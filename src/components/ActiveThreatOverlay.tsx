'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { StoredAlert } from '@/lib/types';

interface ActiveThreatOverlayProps {
  type: 'active-alert' | 'pre-alert';
  alert?: StoredAlert;
  timeToShelterSeconds: number;
  onDismiss: () => void;
}

export default function ActiveThreatOverlay({
  type,
  alert,
  timeToShelterSeconds,
  onDismiss,
}: ActiveThreatOverlayProps) {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(timeToShelterSeconds);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (type !== 'active-alert') return;
    startRef.current = Date.now();
    setCountdown(timeToShelterSeconds);

    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, timeToShelterSeconds - elapsed);
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(id);
  }, [type, timeToShelterSeconds]);

  // Pre-alert: yellow banner at top
  if (type === 'pre-alert') {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9998] bg-yellow-500 text-black py-3 px-4 text-center">
        <p className="text-sm font-medium">
          {'\u26A0'} {t.preAlertBanner}
        </p>
        <button
          onClick={onDismiss}
          className="absolute top-1/2 -translate-y-1/2 end-3 text-black/50 hover:text-black text-lg"
          aria-label={t.dismiss}
        >
          {'\u2715'}
        </button>
      </div>
    );
  }

  // Active alert: full-screen red overlay
  const progress = countdown / timeToShelterSeconds;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center px-6">
      {/* Alert title */}
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center">
        {t.alertActiveTitle}
      </h2>

      {/* Instruction */}
      <p className="text-xl text-white/90 mt-3 text-center">
        {countdown > 0 ? t.seekShelter : t.stayInShelter}
      </p>

      {/* Countdown ring */}
      <div className="relative mt-8 w-[180px] h-[180px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="8"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl sm:text-7xl font-bold text-white font-mono tabular-nums">
            {countdown}
          </span>
        </div>
      </div>

      <p className="text-sm text-white/60 mt-2">{t.seconds}</p>

      {/* Affected cities */}
      {alert && alert.cities.length > 0 && (
        <div className="mt-6 text-center max-w-sm">
          <p className="text-xs text-white/50 uppercase tracking-wide mb-1">{t.affectedAreas}</p>
          <p className="text-sm text-white/70">
            {alert.cities.slice(0, 10).join(', ')}
            {alert.cities.length > 10 && ` +${alert.cities.length - 10}`}
          </p>
        </div>
      )}

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="mt-8 text-sm text-white/50 underline underline-offset-2 hover:text-white/80 transition-colors"
      >
        {t.dismiss}
      </button>
    </div>
  );
}
