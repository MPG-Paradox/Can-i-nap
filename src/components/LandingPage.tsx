'use client';

import { useLanguage } from '@/lib/i18n/context';
import LanguageToggle from './LanguageToggle';
import LocationSearch from './LocationSearch';
import LocationButton from './LocationButton';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <>
      <LanguageToggle />

      {/* Subtle center glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-[18vh] sm:pt-0 sm:justify-center pb-24">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center animate-fade-in-up">
          <span className="inline-block me-2">😴</span>
          {t.appName}
        </h1>

        {/* Tagline */}
        <p className="mt-4 text-lg text-slate-400 text-center max-w-md animate-fade-in-up animation-delay-150">
          {t.tagline}
        </p>

        {/* Where are you? */}
        <h2 className="mt-12 text-2xl sm:text-3xl font-semibold text-slate-200 text-center animate-fade-in-up animation-delay-300">
          {t.whereAreYou}
        </h2>

        {/* Search */}
        <div className="mt-6 w-full max-w-md animate-fade-in-up animation-delay-450">
          <LocationSearch />
        </div>

        {/* Divider */}
        <div className="mt-6 w-full max-w-md flex items-center gap-4 animate-fade-in-up animation-delay-600">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-sm text-slate-500">{t.or}</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Location button */}
        <div className="mt-6 animate-fade-in-up animation-delay-600">
          <LocationButton />
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 py-4 px-4 text-center z-10">
        <p className="text-xs text-slate-500">{t.disclaimer}</p>
        <a
          href="https://www.oref.org.il/en/12481-en/Pakar.aspx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
        >
          {t.officialApp}
        </a>
      </footer>
    </>
  );
}
