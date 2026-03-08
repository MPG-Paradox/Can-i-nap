'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/lib/i18n/context';
import { findZoneByName } from '@/lib/zones';
import { calculateNapRiskWeighted, DEFAULT_WEIGHTS } from '@/lib/risk';
import { Alert, StoredAlert, RiskWeights } from '@/lib/types';
import { useSSE } from '@/lib/use-sse';
import LanguageToggle from '@/components/LanguageToggle';
import RiskDial from '@/components/RiskDial';
import RiskMessage from '@/components/RiskMessage';
import ConnectionStatus from '@/components/ConnectionStatus';
import DurationButtons from '@/components/DurationButtons';
import InlineLocationPicker from '@/components/InlineLocationPicker';
import StatsCards from '@/components/StatsCards';
import DualFrontCard from '@/components/DualFrontCard';
import ActiveThreatOverlay from '@/components/ActiveThreatOverlay';

const SafeNapGraph = dynamic(() => import('@/components/SafeNapGraph'), {
  loading: () => <div className="h-[300px] bg-surface-card rounded-2xl animate-pulse" />,
  ssr: false,
});

const CalculationPanel = dynamic(() => import('@/components/CalculationPanel'), {
  loading: () => <div className="h-[200px] bg-surface-card rounded-2xl animate-pulse" />,
  ssr: false,
});

function toAlert(stored: StoredAlert): Alert {
  return { ...stored, timestamp: new Date(stored.timestamp) };
}

const NATIONAL_ZONE = '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC';

function MainApp() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const locationRef = useRef<HTMLDivElement>(null);

  const zoneParam = searchParams.get('zone');
  const zoneName = zoneParam ? decodeURIComponent(zoneParam) : NATIONAL_ZONE;
  const zone = useMemo(() => findZoneByName(zoneName), [zoneName]);
  const isNational = !!(zone && zone.isNational);

  const [napDuration, setNapDuration] = useState(45);
  const [weights, setWeights] = useState<RiskWeights>({ ...DEFAULT_WEIGHTS });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Two separate timers for performance
  const [tickTime, setTickTime] = useState(new Date());
  const [calcTime, setCalcTime] = useState(new Date());
  const lastFetchRef = useRef(Date.now());
  const prevAlertsRef = useRef('');

  // Active threat overlay state
  const [activeOverlay, setActiveOverlay] = useState<{
    type: 'active-alert' | 'pre-alert';
    alert?: StoredAlert;
    triggeredAt: Date;
  } | null>(null);

  const handleZoneChange = useCallback(
    (hebrewName: string) => {
      if (hebrewName === NATIONAL_ZONE) {
        router.replace('/', { scroll: false });
      } else {
        router.replace(`/?zone=${encodeURIComponent(hebrewName)}`, { scroll: false });
      }
    },
    [router]
  );

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?hours=168');
      if (res.ok) {
        const data: StoredAlert[] = await res.json();
        const newJson = JSON.stringify(data);
        if (newJson !== prevAlertsRef.current) {
          prevAlertsRef.current = newJson;
          setAlerts(data.map(toAlert));
        }
        setConnectionStatus('connected');
        setLastFetchTime(new Date());
        lastFetchRef.current = Date.now();
      } else {
        setConnectionStatus('reconnecting');
      }
    } catch {
      setConnectionStatus('reconnecting');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch alerts every 30s
  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Tick timer (1s) for StatsCards counter + staleness detection
  // Calc timer (30s) for expensive risk/graph recalculations
  useEffect(() => {
    const tickId = setInterval(() => {
      setTickTime(new Date());
      if (Date.now() - lastFetchRef.current > 60000) {
        setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : prev));
      }
    }, 1000);
    const calcId = setInterval(() => setCalcTime(new Date()), 30000);
    return () => {
      clearInterval(tickId);
      clearInterval(calcId);
    };
  }, []);

  // On startup: fetch history once, then poll every 5 seconds
  useEffect(() => {
    // One-time history fetch to fill gaps on app startup
    fetch('/api/fetch-history').catch(() => {});
    // Trigger the poller immediately, then every 5 seconds
    fetch('/api/poll').catch(() => {});
    const pollId = setInterval(async () => {
      try { await fetch('/api/poll'); } catch { /* silently fail */ }
    }, 5000);
    return () => clearInterval(pollId);
  }, []);

  // SSE: handle new alerts in real-time
  const checkAlertForOverlay = useCallback((alert: StoredAlert) => {
    const category = alert.category;
    if (category === 14) {
      setActiveOverlay({ type: 'pre-alert', alert, triggeredAt: new Date() });
      return;
    }
    if (category !== 1 && category !== 2) return;

    const currentZone = findZoneByName(zoneName);
    if (!currentZone) return;

    if (currentZone.isNational) {
      setActiveOverlay({ type: 'active-alert', alert, triggeredAt: new Date() });
      return;
    }

    const alertCities = alert.cities;
    if (currentZone.isRegion && currentZone.regionCities) {
      const matches = alertCities.some(city =>
        currentZone.regionCities!.some(rc => city.includes(rc) || rc.includes(city))
      );
      if (matches) {
        setActiveOverlay({ type: 'active-alert', alert, triggeredAt: new Date() });
        return;
      }
    }

    const baseName = zoneName.split(' - ')[0].trim();
    const matches = alertCities.some(city =>
      city.includes(zoneName) || zoneName.includes(city) ||
      city.includes(baseName) || baseName.includes(city)
    );
    if (matches) {
      setActiveOverlay({ type: 'active-alert', alert, triggeredAt: new Date() });
    }
  }, [zoneName]);

  const handleNewAlert = useCallback((alert: StoredAlert) => {
    const parsed = toAlert(alert);
    setAlerts(prev => {
      const exists = prev.some(a => a.id === alert.id);
      if (exists) return prev;
      return [parsed, ...prev].slice(0, 500);
    });
    setCalcTime(new Date());
    checkAlertForOverlay(alert);
  }, [checkAlertForOverlay]);

  useSSE(handleNewAlert);

  // Auto-dismiss overlay
  useEffect(() => {
    if (!activeOverlay) return;
    const timeout = activeOverlay.type === 'pre-alert' ? 3 * 60 * 1000 : 5 * 60 * 1000;
    const timer = setTimeout(() => setActiveOverlay(null), timeout);
    return () => clearTimeout(timer);
  }, [activeOverlay]);

  // Risk calculation uses calcTime (30s), not tickTime (1s)
  const risk = useMemo(() => {
    if (!zone) return null;
    return calculateNapRiskWeighted(
      {
        zoneId: zone.hebrewName,
        napDurationMinutes: napDuration,
        alerts,
        currentTime: calcTime,
      },
      weights
    );
  }, [zone, napDuration, alerts, calcTime, weights]);

  const newestAlertTime = useMemo(() => {
    if (alerts.length === 0) return null;
    return alerts.reduce((latest, a) =>
      a.timestamp.getTime() > latest.getTime() ? a.timestamp : latest,
      alerts[0].timestamp
    );
  }, [alerts]);

  const displayName = zone
    ? language === 'en' ? zone.englishName : zone.hebrewName
    : '';

  const scrollToLocation = () => {
    locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = locationRef.current?.querySelector('input');
    if (input) setTimeout(() => input.focus(), 300);
  };

  return (
    <>
      <LanguageToggle />

      {activeOverlay && (
        <ActiveThreatOverlay
          type={activeOverlay.type}
          alert={activeOverlay.alert}
          timeToShelterSeconds={zone?.timeToShelterSeconds ?? 90}
          onDismiss={() => setActiveOverlay(null)}
        />
      )}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-6 pb-12 max-w-lg mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center">
          <span className="inline-block me-2">{'\uD83D\uDE34'}</span>
          {t.appName}
        </h1>
        <p className="mt-2 text-sm text-slate-400 text-center">{t.realTimeAssessment}</p>
        <div className="mt-1">
          <ConnectionStatus
            status={connectionStatus}
            lastFetchTime={lastFetchTime}
            alertCount={alerts.length}
            newestAlertTime={newestAlertTime}
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center mt-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : risk ? (
          <>
            <div className="mt-8">
              <RiskDial riskPercent={risk.riskPercent} />
            </div>

            <RiskMessage riskPercent={risk.riskPercent} />

            <p className="mt-2 text-sm text-slate-400 text-center">{displayName}</p>

            {isNational && (
              <button
                onClick={scrollToLocation}
                className="mt-4 w-full bg-surface-card rounded-xl border-s-4 border-indigo-500 px-4 py-3 text-start text-sm text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                {'\uD83D\uDCCD'} {t.improveAccuracy}
              </button>
            )}

            <div className="w-full mt-8">
              <DurationButtons value={napDuration} onChange={setNapDuration} />
            </div>

            <div className="w-full mt-6" ref={locationRef}>
              <InlineLocationPicker
                currentZone={zoneName}
                onZoneChange={handleZoneChange}
              />
            </div>

            <div className="w-full mt-6">
              <StatsCards risk={risk} tickTime={tickTime} />
            </div>

            <div className="w-full mt-6">
              <DualFrontCard
                status={risk.dualFrontStatus}
                alerts={alerts}
                zoneId={zone!.hebrewName}
                isNational={isNational}
              />
            </div>

            <div className="w-full mt-6">
              <SafeNapGraph
                zoneId={zone!.hebrewName}
                napDuration={napDuration}
                alerts={alerts}
                currentTime={calcTime}
                weights={weights}
                onRefresh={fetchAlerts}
              />
            </div>

            <div className="w-full mt-6">
              <CalculationPanel
                risk={risk}
                weights={weights}
                onWeightsChange={setWeights}
              />
            </div>

            <footer className="mt-8 text-center">
              <p className="text-xs text-slate-500">{t.disclaimer}</p>
              <a
                href="https://www.oref.org.il/en/12481-en/Pakar.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                {t.officialApp}
              </a>
            </footer>
          </>
        ) : null}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MainApp />
    </Suspense>
  );
}
