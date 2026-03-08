'use client';

import { useLanguage } from '@/lib/i18n/context';
import { DualFrontStatus, EscalationLevel, Alert } from '@/lib/types';

interface DualFrontCardProps {
  status: DualFrontStatus;
  alerts?: Alert[];
  zoneId?: string;
  isNational?: boolean;
}

function getStatusBadge(level: EscalationLevel, t: ReturnType<typeof useLanguage>['t']): { text: string; className: string } {
  switch (level) {
    case 'calm':
      return { text: t.calm, className: 'bg-risk-green/20 text-risk-green' };
    case 'single_front':
      return { text: t.singleFront, className: 'bg-risk-yellow/20 text-risk-yellow' };
    case 'dual_front':
      return { text: t.dualFrontActive, className: 'bg-risk-red/20 text-risk-red' };
    case 'heavy_barrage':
      return { text: t.heavyBarrage, className: 'bg-risk-dark-red/20 text-risk-red' };
    case 'heavy_barrage_both':
      return { text: t.heavyBarrageBoth, className: 'bg-risk-dark-red/20 text-risk-red' };
  }
}

function getDescription(level: EscalationLevel, t: ReturnType<typeof useLanguage>['t']): string {
  switch (level) {
    case 'calm': return t.calm;
    case 'single_front': return t.singleFront;
    case 'dual_front': return t.dualFrontDesc;
    case 'heavy_barrage': return t.heavyBarrage;
    case 'heavy_barrage_both': return t.heavyBarrageBoth;
  }
}

function countZoneAlerts(alerts: Alert[], zoneId: string, source: 'iran' | 'hezbollah', hoursAgo: number): number {
  const cutoff = Date.now() - hoursAgo * 60 * 60 * 1000;
  const baseName = zoneId.split(' - ')[0].trim();
  return alerts.filter((a) => {
    if (a.timestamp.getTime() < cutoff) return false;
    if (source === 'iran' && a.source !== 'iran' && a.source !== 'dual') return false;
    if (source === 'hezbollah' && a.source !== 'hezbollah' && a.source !== 'dual') return false;
    return a.cities.some(
      (city) => city.includes(zoneId) || zoneId.includes(city) ||
        city.includes(baseName) || baseName.includes(city)
    );
  }).length;
}

export default function DualFrontCard({ status, alerts, zoneId, isNational }: DualFrontCardProps) {
  const { t } = useLanguage();
  const badge = getStatusBadge(status.escalationLevel, t);

  const iranPercent = Math.min(100, (status.iranFront.alertsLast6h / 20) * 100);
  const hezbollahPercent = Math.min(100, (status.hezbollahFront.alertsLast6h / 20) * 100);

  const showZone = !isNational && alerts && zoneId;
  const zoneIranCount = showZone ? countZoneAlerts(alerts, zoneId, 'iran', 6) : 0;
  const zoneHezbollahCount = showZone ? countZoneAlerts(alerts, zoneId, 'hezbollah', 6) : 0;

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Status badge with time window label */}
      <div className="mb-4 flex items-center gap-2">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.className}`}>
          {badge.text}
        </span>
        <span className="text-[10px] text-slate-500">({t.last30min})</span>
      </div>

      {/* Iran front */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-300">{t.iranFront}</span>
          <span className="text-xs text-slate-400">
            {status.iranFront.alertsLast6h} {t.alertsLast6h}
            <span className="text-slate-500"> ({t.national})</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-500"
            style={{ width: `${iranPercent}%` }}
          />
        </div>
        {showZone && (
          <p className="text-[11px] text-slate-500 mt-1">
            {t.yourZone}: {zoneIranCount} {t.alertsLast6h}
          </p>
        )}
      </div>

      {/* Hezbollah front */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-slate-300">{t.hezbollahFront}</span>
          <span className="text-xs text-slate-400">
            {status.hezbollahFront.alertsLast6h} {t.alertsLast6h}
            <span className="text-slate-500"> ({t.national})</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${hezbollahPercent}%` }}
          />
        </div>
        {showZone && (
          <p className="text-[11px] text-slate-500 mt-1">
            {t.yourZone}: {zoneHezbollahCount} {t.alertsLast6h}
          </p>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mt-3">
        {getDescription(status.escalationLevel, t)}
      </p>
    </div>
  );
}
