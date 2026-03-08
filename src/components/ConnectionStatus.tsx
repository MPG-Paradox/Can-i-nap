'use client';

import { useLanguage } from '@/lib/i18n/context';
import { formatTime } from '@/lib/utils';

type Status = 'connected' | 'reconnecting' | 'offline';

interface ConnectionStatusProps {
  status: Status;
  lastFetchTime?: Date | null;
  alertCount?: number;
  newestAlertTime?: Date | null;
}

export default function ConnectionStatus({ status, lastFetchTime, newestAlertTime }: ConnectionStatusProps) {
  const { t } = useLanguage();

  // Check data staleness
  const dataAgeHours = newestAlertTime
    ? (Date.now() - newestAlertTime.getTime()) / (60 * 60 * 1000)
    : Infinity;

  // Override visual status based on data age
  let effectiveStatus: Status = status;
  let statusText = '';

  if (dataAgeHours > 6 && dataAgeHours < Infinity) {
    effectiveStatus = 'reconnecting';
    statusText = t.dataOutdated;
  } else if (dataAgeHours > 1 && dataAgeHours < Infinity) {
    effectiveStatus = 'reconnecting';
    statusText = t.updating;
  } else {
    const config: Record<Status, string> = {
      connected: t.connected,
      reconnecting: t.reconnecting,
      offline: t.offline,
    };
    statusText = config[effectiveStatus];
  }

  const colorMap: Record<Status, string> = {
    connected: 'bg-risk-green',
    reconnecting: 'bg-risk-yellow',
    offline: 'bg-risk-red',
  };

  const color = colorMap[effectiveStatus];

  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${effectiveStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{statusText}</span>
      {lastFetchTime && effectiveStatus === 'connected' && (
        <span className="text-xs text-slate-500">
          {' \u00B7 '}{t.lastUpdate}: {formatTime(lastFetchTime)}
        </span>
      )}
    </div>
  );
}
