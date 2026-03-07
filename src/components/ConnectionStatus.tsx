'use client';

import { useLanguage } from '@/lib/i18n/context';

type Status = 'connected' | 'reconnecting' | 'offline';

interface ConnectionStatusProps {
  status: Status;
}

export default function ConnectionStatus({ status }: ConnectionStatusProps) {
  const { t } = useLanguage();

  const config: Record<Status, { color: string; text: string }> = {
    connected: { color: 'bg-risk-green', text: t.connected },
    reconnecting: { color: 'bg-risk-yellow', text: t.reconnecting },
    offline: { color: 'bg-risk-red', text: t.offline },
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-1.5 justify-center">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{text}</span>
    </div>
  );
}
