'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef, Suspense, memo } from 'react';
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
import ActiveThreatOverlay from '@/components/ActiveThreatOverlay';
import Footer from '@/components/Footer';

const AnimatedBackground = dynamic(
  () => import('@/components/ui/AnimatedBackground').catch(() => {
    // If the shader fails to load, return a no-op component
    return { default: () => null };
  }),
  { ssr: false }
);

const SafeNapGraph = dynamic(() => import('@/components/SafeNapGraph'), {
  loading: () => <div className="h-[300px] glass-card rounded-2xl skeleton" />,
  ssr: false,
});

const CalculationPanel = dynamic(() => import('@/components/CalculationPanel'), {
  loading: () => <div className="h-[200px] glass-card rounded-2xl skeleton" />,
  ssr: false,
});

// Memoize components that don't depend on tickTime
const MemoizedRiskDial = memo(RiskDial);
const MemoizedDurationButtons = memo(DurationButtons);
const MemoizedInlineLocationPicker = memo(InlineLocationPicker);

function toAlert(stored: StoredAlert): Alert {
  return { ...stored, timestamp: new Date(stored.timestamp) };
}

const NATIONAL_ZONE = '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC';

function LoadingSkeleton() {
  return (
    <div className="w-full space-y-6 mt-8">
      {/* Dial placeholder */}
      <div className="flex justify-center">
        <div className="w-[240px] h-[240px] rounded-full skeleton" />
      </div>
      {/* Message placeholder */}
      <div className="h-6 w-48 mx-auto rounded-lg skeleton" />
      {/* Duration buttons */}
      <div className="flex gap-2 justify-center">
        <div className="h-10 w-20 rounded-full skeleton" />
        <div className="h-10 w-20 rounded-full skeleton" />
        <div className="h-10 w-20 rounded-full skeleton" />
      </div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-xl skeleton" />
        <div className="h-20 rounded-xl skeleton" />
        <div className="h-20 rounded-xl skeleton" />
        <div className="h-20 rounded-xl skeleton" />
      </div>
    </div>
  );
}

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
  const [debouncedDuration, setDebouncedDuration] = useState(45);
  const debounceRef = useRef<NodeJS.Timeout>();
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

  // Graph recalc key — only recalculate expensive timeline when data actually changes
  const [graphRecalcKey, setGraphRecalcKey] = useState(0);

  // Deferred graph rendering — wait for initial load before rendering graph
  const [graphReady, setGraphReady] = useState(false);

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
      const res = await fetch('/api/alerts?hours=48');
      if (res.ok) {
        const data: StoredAlert[] = await res.json();
        const newJson = JSON.stringify(data);
        if (newJson !== prevAlertsRef.current) {
          prevAlertsRef.current = newJson;
          setAlerts(data.map(toAlert));
          setGraphRecalcKey(k => k + 1);
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

  // Startup: load local data first (fast), then background-sync history
  useEffect(() => {
    // Step 1: Load cached alerts immediately (local store — fast)
    fetchAlerts();

    // Step 2: Background archive fetch — only re-read store if new data arrived
    fetch('/api/fetch-history')
      .then((r) => r.json())
      .then((d) => { if (d.newAlerts > 0) fetchAlerts(); })
      .catch(() => {});

    // Step 3: Poll real-time every 30s + refresh store
    const pollId = setInterval(async () => {
      try {
        const res = await fetch('/api/poll');
        const data = await res.json();
        if (data.newAlerts > 0) {
          // New alert — sync history for full picture, then refresh
          fetch('/api/fetch-history')
            .then((r) => r.json())
            .then((d) => { if (d.newAlerts > 0) fetchAlerts(); })
            .catch(() => {});
        }
      } catch {}
      fetchAlerts();
    }, 30_000);

    // Step 4: Re-sync history every 5 minutes — only refresh if new data
    const historyId = setInterval(() => {
      fetch('/api/fetch-history')
        .then((r) => r.json())
        .then((d) => { if (d.newAlerts > 0) fetchAlerts(); })
        .catch(() => {});
    }, 300_000);

    return () => {
      clearInterval(pollId);
      clearInterval(historyId);
    };
  }, [fetchAlerts]);

  // Defer graph rendering — wait 2 seconds after initial load
  useEffect(() => {
    const timer = setTimeout(() => setGraphReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Debounce duration for expensive graph/timeline calculations
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedDuration(napDuration), 300);
    return () => clearTimeout(debounceRef.current);
  }, [napDuration]);

  // Tick timer (1s) for StatsCards + staleness
  // Calc timer (30s) for main risk dial
  useEffect(() => {
    const tickId = setInterval(() => {
      setTickTime(new Date());
      if (Date.now() - lastFetchRef.current > 90000) {
        setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : prev));
      }
    }, 1000);
    const calcId = setInterval(() => setCalcTime(new Date()), 30000);
    return () => {
      clearInterval(tickId);
      clearInterval(calcId);
    };
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
    setGraphRecalcKey(k => k + 1);
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

  // Risk calculation uses calcTime (30s) — single calc, cheap
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

  // Independent "time since last threat" — bypasses risk engine zone filtering entirely.
  // Uses ALL threat alerts regardless of zone, so national view always works.
  // Type-safe: coerces category (string|number) and timestamp (string|Date).
  const globalTimeSinceLastMs = useMemo(() => {
    if (alerts.length === 0) return null;
    let latest = -1;
    for (const a of alerts) {
      const cat = typeof a.category === 'string' ? parseInt(a.category, 10) : a.category;
      if (cat !== 1 && cat !== 2) continue;
      const ts = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp as unknown as string).getTime();
      if (isNaN(ts)) continue;
      if (ts > latest) latest = ts;
    }
    if (latest < 0) return null;
    return Date.now() - latest;
  }, [alerts]);

  // Graph time — only update when data/zone/duration/weights change, not every 30s
  // Uses debouncedDuration so graph doesn't recalculate while dragging slider
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graphTime = useMemo(() => new Date(), [graphRecalcKey, debouncedDuration, zoneName, weights]);

  const lastUpdateTime = useMemo(() => {
    if (!lastFetchTime) return '--:--:--';
    const h = lastFetchTime.getHours().toString().padStart(2, '0');
    const m = lastFetchTime.getMinutes().toString().padStart(2, '0');
    const s = lastFetchTime.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [lastFetchTime]);

  const displayName = zone
    ? language === 'en' ? zone.englishName : zone.hebrewName
    : '';

  const scrollToLocation = () => {
    locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = locationRef.current?.querySelector('input');
    if (input) setTimeout(() => input.focus(), 300);
  };

  // Register service worker + clear stale caches
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Force update check to pick up new SW version
        reg.update().catch(() => {});
      }).catch(() => {});
    }
    // Clear stale caches from old SW versions
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.filter((k) => k !== 'caninap-v2').forEach((k) => caches.delete(k));
      }).catch(() => {});
    }
  }, []);

  return (
    <>
      <AnimatedBackground />
      <LanguageToggle />

      {activeOverlay && (
        <ActiveThreatOverlay
          type={activeOverlay.type}
          alert={activeOverlay.alert}
          timeToShelterSeconds={zone?.timeToShelterSeconds ?? 90}
          onDismiss={() => setActiveOverlay(null)}
        />
      )}

      <main className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-6 pb-12 max-w-lg mx-auto">
        <div className="stagger-1">
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
            />
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : risk ? (
          <>
            <div className="mt-8 stagger-2">
              <MemoizedRiskDial riskPercent={risk.riskPercent} />
            </div>

            <div className="stagger-2">
              <RiskMessage riskPercent={risk.riskPercent} />
              <p className="mt-2 text-sm text-slate-400 text-center">{displayName}</p>
            </div>

            {isNational && (
              <button
                onClick={scrollToLocation}
                className="mt-4 w-full glass-card rounded-xl border-s-4 border-amber-500 px-4 py-3 text-start text-sm text-slate-300 hover:bg-slate-800/50 transition-colors stagger-3"
              >
                {'\uD83D\uDCCD'} {t.improveAccuracy}
              </button>
            )}

            <div className="w-full mt-8 stagger-3">
              <MemoizedDurationButtons value={napDuration} onChange={setNapDuration} />
            </div>

            <div className="w-full mt-6 stagger-4 relative z-[60]" ref={locationRef}>
              <MemoizedInlineLocationPicker
                currentZone={zoneName}
                onZoneChange={handleZoneChange}
              />
            </div>

            <div className="w-full mt-6 stagger-5">
              <StatsCards risk={risk} tickTime={tickTime} isNational={isNational} globalTimeSinceLastMs={globalTimeSinceLastMs} />
            </div>

            {graphReady && (
              <div className="w-full mt-6 stagger-6">
                <SafeNapGraph
                  zoneId={zone!.hebrewName}
                  napDuration={debouncedDuration}
                  alerts={alerts}
                  currentTime={graphTime}
                  weights={weights}
                  onRefresh={fetchAlerts}
                />
              </div>
            )}

            <div className="w-full mt-6 border-t border-slate-800/50 py-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                {language === 'he' ? 'נהנים מהאתר?' : 'Enjoying the site?'}
              </p>
              <p className="text-xs text-slate-500">
                {language === 'he' ? 'עזרו לי לשמור עליו פעיל' : 'Help me keep it running'}
              </p>
              <a
                href="https://buymeacoffee.com/emilelasmar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold bg-[#FFDD00] text-black hover:bg-[#e6c800] transition-colors"
              >
                🛏️ Buy me a pillow
              </a>
            </div>

            <div className="w-full mt-6 stagger-7">
              <CalculationPanel
                risk={risk}
                weights={weights}
                onWeightsChange={setWeights}
              />
            </div>

            <Footer
              lastUpdateTime={lastUpdateTime}
              riskPercent={risk.riskPercent}
              napDuration={napDuration}
            />
          </>
        ) : (
          <div className="mt-12 text-center stagger-2">
            <MemoizedRiskDial riskPercent={0} />
            <p className="mt-4 text-sm text-slate-400">{t.noAlerts}</p>
          </div>
        )}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MainApp />
    </Suspense>
  );
}
