import { Language } from '../types';
import { en } from './en';
import { he } from './he';
import { ar } from './ar';

const translations = { en, he, ar } as const;

export type TranslationStrings = typeof en;

export function getTranslation(lang: Language): TranslationStrings {
  return translations[lang];
}

export function isRTL(lang: Language): boolean {
  return lang === 'he' || lang === 'ar';
}
