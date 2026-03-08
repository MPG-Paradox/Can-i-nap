'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface ShareButtonProps {
  riskPercent: number;
  napDuration: number;
  zoneName: string;
}

export default function ShareButton({ riskPercent, napDuration, zoneName }: ShareButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const getShareText = useCallback(() => {
    return t.shareText
      .replace('{risk}', String(riskPercent))
      .replace('{duration}', String(napDuration))
      .replace('{zone}', zoneName)
      + ' \uD83D\uDE34';
  }, [t, riskPercent, napDuration, zoneName]);

  const handleShare = useCallback(async () => {
    const text = getShareText();

    // Native share on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.appName,
          text,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [getShareText, t]);

  return (
    <button
      onClick={handleShare}
      className="glass-card rounded-full px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? t.copied : t.share}
    </button>
  );
}
