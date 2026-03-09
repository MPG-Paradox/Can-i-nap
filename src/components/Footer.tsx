'use client';

import { useLanguage } from '@/lib/i18n/context';

interface FooterProps {
  lastUpdateTime: string;
  riskPercent?: number;
  napDuration?: number;
}

export default function Footer({ lastUpdateTime, riskPercent, napDuration }: FooterProps) {
  const { t, language } = useLanguage();

  const handleShare = async () => {
    const text = language === 'he'
      ? `${riskPercent || 0}% סיכוי שתנומה של ${napDuration || 45} דקות תופרע 😴`
      : `${riskPercent || 0}% chance my ${napDuration || 45}-min nap gets interrupted 😴`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Can I Nap?', text }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  return (
    <footer className="mt-10 sm:mt-16 pb-6 sm:pb-8 px-4 max-w-lg mx-auto text-center space-y-2 sm:space-y-3">
      <button
        onClick={handleShare}
        className="glass-card rounded-full px-6 py-2.5 text-sm font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {t.share}
      </button>

      <p className="text-xs text-slate-500">{t.disclaimer}</p>

      <p className="text-xs text-slate-400">
        {t.dataSource}:{' '}
        <a
          href="https://www.oref.org.il/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400/60 hover:text-amber-400 underline transition-colors"
        >
          {t.pikudHaoref}
        </a>
      </p>

      <p className="text-xs text-slate-400">
        {t.lastUpdated}: {lastUpdateTime}
      </p>

      <p className="text-xs">
        <a
          href="https://www.linkedin.com/in/emil-el-asmar-59a4a629a/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400/60 hover:text-amber-400 underline transition-colors"
        >
          LinkedIn
        </a>
      </p>

    </footer>
  );
}
