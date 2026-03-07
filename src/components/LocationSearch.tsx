'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/context';
import { ZONES } from '@/lib/zones';
import { Zone, District } from '@/lib/types';

const DISTRICT_COLORS: Record<District, string> = {
  north: 'bg-orange-500/20 text-orange-400',
  haifa: 'bg-amber-500/20 text-amber-400',
  center: 'bg-blue-500/20 text-blue-400',
  tel_aviv: 'bg-blue-500/20 text-blue-400',
  jerusalem: 'bg-yellow-500/20 text-yellow-400',
  south: 'bg-green-500/20 text-green-400',
  sharon: 'bg-cyan-500/20 text-cyan-400',
  judea_samaria: 'bg-purple-500/20 text-purple-400',
};

const DISTRICT_LABELS: Record<District, { he: string; en: string; ar: string }> = {
  north: { he: '\u05E6\u05E4\u05D5\u05DF', en: 'North', ar: '\u0634\u0645\u0627\u0644' },
  haifa: { he: '\u05D7\u05D9\u05E4\u05D4', en: 'Haifa', ar: '\u062D\u064A\u0641\u0627' },
  center: { he: '\u05DE\u05E8\u05DB\u05D6', en: 'Center', ar: '\u0627\u0644\u0645\u0631\u0643\u0632' },
  tel_aviv: { he: '\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1', en: 'Tel Aviv', ar: '\u062A\u0644 \u0623\u0628\u064A\u0628' },
  jerusalem: { he: '\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD', en: 'Jerusalem', ar: '\u0627\u0644\u0642\u062F\u0633' },
  south: { he: '\u05D3\u05E8\u05D5\u05DD', en: 'South', ar: '\u062C\u0646\u0648\u0628' },
  sharon: { he: '\u05E9\u05E8\u05D5\u05DF', en: 'Sharon', ar: '\u0634\u0627\u0631\u0648\u0646' },
  judea_samaria: { he: '\u05D9\u05D4\u05D5\u05D3\u05D4 \u05D5\u05E9\u05D5\u05DE\u05E8\u05D5\u05DF', en: 'Judea & Samaria', ar: '\u064A\u0647\u0648\u062F\u0627 \u0648\u0627\u0644\u0633\u0627\u0645\u0631\u0629' },
};

function getZoneName(zone: Zone, lang: string): string {
  if (lang === 'ar') return zone.arabicName;
  if (lang === 'en') return zone.englishName;
  return zone.hebrewName;
}

export default function LocationSearch() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    return ZONES.filter((zone) => {
      const name = getZoneName(zone, language).toLowerCase();
      return (
        name.includes(q) ||
        zone.hebrewName.includes(query.trim()) ||
        zone.englishName.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [query, language]);

  const selectZone = useCallback(
    (zone: Zone) => {
      const encoded = encodeURIComponent(zone.hebrewName);
      router.push(`/dashboard?zone=${encoded}`);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        selectZone(results[highlightIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    },
    [isOpen, results, highlightIndex, selectZone]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-zone-item]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => query.trim().length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t.searchPlaceholder}
        className="w-full bg-surface-card text-white text-lg rounded-xl px-5 py-4 border border-slate-700/50 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder:text-slate-500"
        autoComplete="off"
      />

      {isOpen && query.trim().length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full mt-2 w-full bg-surface-card rounded-xl border border-slate-700/50 shadow-xl shadow-black/20 max-h-[300px] overflow-y-auto z-40"
        >
          {results.length === 0 ? (
            <div className="px-5 py-4 text-slate-500 text-center">{t.noResults}</div>
          ) : (
            results.map((zone, i) => (
              <button
                key={zone.hebrewName}
                data-zone-item
                onClick={() => selectZone(zone)}
                className={`w-full flex items-center justify-between px-5 py-3 text-start transition-colors duration-100 first:rounded-t-xl last:rounded-b-xl ${
                  i === highlightIndex
                    ? 'bg-indigo-500/20'
                    : 'hover:bg-indigo-500/10'
                }`}
              >
                <span className="text-slate-100">{getZoneName(zone, language)}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ms-3 ${DISTRICT_COLORS[zone.district]}`}
                >
                  {DISTRICT_LABELS[zone.district][language]}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
