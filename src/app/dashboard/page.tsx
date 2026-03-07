'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { findZoneByName } from '@/lib/zones';
import { calculateNapRisk } from '@/lib/risk';
import { Alert, StoredAlert } from '@/lib/types';
import LanguageToggle from '@/components/LanguageToggle';
import RiskDial from '@/components/RiskDial';
import DurationSlider from '@/components/DurationSlider';
import DualFrontCard from '@/components/DualFrontCard';
import StatsCards from '@/components/StatsCards';

function toAlert(stored: StoredAlert): Alert {
  return { ...stored, timestamp: new Date(stored.timestamp) };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();

  const zoneName = searchParams.get('zone') || '';
  const zone = useMemo(() => findZoneByName(decodeURIComponent(zoneName)), [zoneName]);

  const [napDuration, setNapDuration] = useState(30);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if no valid zone
  useEffect(() => {
    if (!zoneName) {
      router.replace('/');
    }
  }, [zoneName, router]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?hours=24');
      if (res.ok) {
        const data: StoredAlert[] = await res.json();
        setAlerts(data.map(toAlert));
      }
    } catch {
      // Silently fail — will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Calculate risk
  const risk = useMemo(() => {
    if (!zone) return null;
    return calculateNapRisk({
      zoneId: zone.hebrewName,
      napDurationMinutes: napDuration,
      alerts,
      currentTime: new Date(),
    });
  }, [zone, napDuration, alerts]);

  if (!zone || !zoneName) return null;

  const displayName = language === 'en' ? zone.englishName : zone.hebrewName;

  return (
    <>
      <LanguageToggle />

      <main className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-6 pb-12 max-w-lg mx-auto">
        {/* Zone name + change link */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-lg font-medium text-slate-300">{displayName}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors"
          >
            {t.changeZone}
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : risk ? (
          <>
            {/* Risk Dial */}
            <RiskDial
              riskPercent={risk.riskPercent}
              zoneName={displayName}
              napDuration={napDuration}
            />

            {/* Duration Slider */}
            <div className="w-full mt-8">
              <DurationSlider value={napDuration} onChange={setNapDuration} />
            </div>

            {/* Dual Front Card */}
            <div className="w-full mt-6">
              <DualFrontCard status={risk.dualFrontStatus} />
            </div>

            {/* Stats Cards */}
            <div className="w-full mt-6">
              <StatsCards risk={risk} />
            </div>
          </>
        ) : null}
      </main>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
