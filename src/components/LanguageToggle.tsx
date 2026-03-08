'use client';

import { useLanguage } from '@/lib/i18n/context';
import { Language } from '@/lib/types';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'he', label: '\u05E2\u05D1' },
  { code: 'en', label: 'EN' },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex rounded-full bg-surface-card/80 backdrop-blur-sm border border-slate-700/50 p-0.5">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ease-in-out ${
            language === code
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label={`Switch to ${code}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
