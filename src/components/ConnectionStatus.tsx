'use client';

import { useLanguage } from '@/lib/i18n/context';
import { formatTime } from '@/lib/utils';

type Status = 'connected' | 'reconnecting' | 'offline';

interface ConnectionStatusProps {
  status: Status;
  lastFetchTime?: Date | null;
  alertCount?: number;
}

export default function ConnectionStatus({ status, lastFetchTime, alertCount }: ConnectionStatusProps) {
  const { t } = useLanguage();

  const config: Record<Status, { color: string; text: string }> = {
    connected: { color: 'bg-risk-green', text: t.connected },
    reconnecting: { color: 'bg-risk-yellow', text: t.reconnecting },
    offline: { color: 'bg-risk-red', text: t.offline },
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{text}</span>
      {lastFetchTime && (
        <span className="text-xs text-slate-500">
          {' \u00B7 '}{t.lastUpdate}: {formatTime(lastFetchTime)}
        </span>
      )}
      {alertCount !== undefined && alertCount > 0 && (
        <span className="text-xs text-slate-500">
          {' \u00B7 '}{alertCount} {t.alertsLoaded}
        </span>
      )}
      {alertCount !== undefined && alertCount > 0 && alertCount < 100 && (
        <span className="text-xs text-risk-yellow block w-full text-center mt-0.5">
          {t.limitedData}
        </span>
      )}
    </div>
  );
}
