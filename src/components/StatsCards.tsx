'use client';

import { useLanguage } from '@/lib/i18n/context';
import { RiskResult } from '@/lib/types';

interface StatsCardsProps {
  risk: RiskResult;
  tickTime: Date;
}

function formatTimeSince(totalSeconds: number, t: ReturnType<typeof useLanguage>['t']): string {
  if (totalSeconds < 0) return '\u2014';
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (d > 0) return t.daysAgo.replace('{days}', String(d));
  if (h > 0) return `${h}${t.hours} ${m}${t.minutesShort}`;
  if (m > 0) return `${m}${t.minutesShort} ${s}${t.secondsShort}`;
  return `${s}${t.secondsShort}`;
}

function getTimeSinceColor(minutes: number): string {
  if (minutes < 0) return 'text-slate-400';
  if (minutes < 30) return 'text-risk-red';
  if (minutes < 120) return 'text-risk-yellow';
  return 'text-risk-green';
}

function getVolumeColor(count: number): string {
  if (count <= 3) return 'text-risk-green';
  if (count <= 10) return 'text-risk-yellow';
  if (count <= 20) return 'text-risk-orange';
  return 'text-risk-red';
}

export default function StatsCards({ risk, tickTime }: StatsCardsProps) {
  const { t } = useLanguage();

  // Use tickTime to compute live seconds since last alert
  // risk.timeSinceLastMinutes is from the last calcTime snapshot
  // We don't need the exact live counter — the 30s recalc is close enough
  // tickTime is used just to trigger re-renders for the display
  const baseSeconds = risk.timeSinceLastMinutes >= 0 ? Math.floor(risk.timeSinceLastMinutes * 60) : -1;
  // Suppress unused tickTime warning — it's used to trigger re-renders
  void tickTime;

  const avgHours = risk.avgIntervalMinutes / 60;
  const avgDisplay = risk.avgIntervalMinutes >= 720
    ? `12${t.hours}+`
    : `${avgHours.toFixed(1)}${t.hours}`;

  const trendConfig = {
    increasing: { label: t.increasing, arrow: '\u2191', color: 'text-risk-red' },
    decreasing: { label: t.decreasing, arrow: '\u2193', color: 'text-risk-green' },
    stable: { label: t.stable, arrow: '\u2192', color: 'text-risk-yellow' },
  };

  const trendInfo = trendConfig[risk.trend];

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Time since last */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{t.timeSinceLast}</p>
        <p className={`text-2xl font-bold mt-1 tabular-nums ${getTimeSinceColor(baseSeconds / 60)}`}>
          {baseSeconds < 0 ? t.noAlertsEver : formatTimeSince(baseSeconds, t)}
        </p>
      </div>

      {/* Average interval */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{t.avgInterval}</p>
        <p className={`text-2xl font-bold mt-1 ${risk.avgIntervalMinutes >= 720 ? 'text-risk-green' : 'text-slate-100'}`}>
          {avgDisplay}
        </p>
      </div>

      {/* 24h alert count */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{t.alertCount24h}</p>
        <p className={`text-2xl font-bold mt-1 ${getVolumeColor(risk.volume24h)}`}>
          {risk.volume24h}
        </p>
      </div>

      {/* Trend */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wide">{t.trend}</p>
        <p className={`text-2xl font-bold mt-1 ${trendInfo.color}`}>
          <span className="me-1">{trendInfo.arrow}</span>
          {trendInfo.label}
        </p>
      </div>
    </div>
  );
}
