'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language } from '../types';
import { getTranslation, isRTL, TranslationStrings } from './index';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationStrings;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('he');

  useEffect(() => {
    const saved = localStorage.getItem('can-i-nap-lang') as Language | null;
    if (saved && (saved === 'he' || saved === 'en' || saved === 'ar')) {
      setLanguageState(saved);
      applyLanguage(saved);
    }
  }, []);

  const applyLanguage = (lang: Language) => {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    applyLanguage(lang);
    localStorage.setItem('can-i-nap-lang', lang);
  }, []);

  const t = getTranslation(language);
  const rtl = isRTL(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: rtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
