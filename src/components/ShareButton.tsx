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
        await navigator.share({ title: t.appName, text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Clipboard API
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Clipboard API not available — fall through
    }

    // Fallback: old-school copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getShareText, t]);

  return (
    <button
      onClick={handleShare}
      className="glass-card rounded-full px-6 py-2.5 text-sm font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors flex items-center gap-2 mx-auto"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t.copied}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t.share}
        </>
      )}
    </button>
  );
}
