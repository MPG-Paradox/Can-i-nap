'use client';

import { useLanguage } from '@/lib/i18n/context';
import { formatTime } from '@/lib/utils';

type Status = 'connected' | 'reconnecting' | 'offline';

interface ConnectionStatusProps {
  status: Status;
  lastFetchTime?: Date | null;
  alertCount?: number;
}

export default function ConnectionStatus({ status, lastFetchTime }: ConnectionStatusProps) {
  const { t } = useLanguage();

  const config: Record<Status, string> = {
    connected: t.connected,
    reconnecting: t.reconnecting,
    offline: t.offline,
  };

  const colorMap: Record<Status, string> = {
    connected: 'bg-risk-green',
    reconnecting: 'bg-risk-yellow',
    offline: 'bg-risk-red',
  };

  return (
    <div className="flex items-center gap-1.5 justify-center flex-wrap">
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[status]} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{config[status]}</span>
      {lastFetchTime && status === 'connected' && (
        <span className="text-xs text-slate-500">
          {' \u00B7 '}{t.lastUpdate}: {formatTime(lastFetchTime)}
        </span>
      )}
    </div>
  );
}
