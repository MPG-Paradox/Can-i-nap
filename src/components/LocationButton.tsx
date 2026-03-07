'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { findNearestZone } from '@/lib/zones';

export default function LocationButton() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (!navigator.geolocation) {
      setError(t.locationError);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const zone = findNearestZone(position.coords.latitude, position.coords.longitude);
        const encoded = encodeURIComponent(zone.hebrewName);
        router.push(`/dashboard?zone=${encoded}`);
      },
      () => {
        setLoading(false);
        setError(t.locationError);
        setTimeout(() => setError(null), 3000);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [router, t]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2.5 px-6 py-3 rounded-xl border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? (
          <span className="animate-pulse">{t.locating}</span>
        ) : (
          <>
            <svg
              className="w-5 h-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <span>{t.useMyLocation}</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-red-400 text-sm animate-pulse">{error}</p>
      )}
    </div>
  );
}
