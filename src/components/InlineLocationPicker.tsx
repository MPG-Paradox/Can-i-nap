'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { ZONES, findNearestZone } from '@/lib/zones';
import { Zone, District, Language } from '@/lib/types';

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

const DISTRICT_LABELS: Record<District, Record<Language, string>> = {
  north: { he: '\u05E6\u05E4\u05D5\u05DF', en: 'North' },
  haifa: { he: '\u05D7\u05D9\u05E4\u05D4', en: 'Haifa' },
  center: { he: '\u05DE\u05E8\u05DB\u05D6', en: 'Center' },
  tel_aviv: { he: '\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1', en: 'Tel Aviv' },
  jerusalem: { he: '\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD', en: 'Jerusalem' },
  south: { he: '\u05D3\u05E8\u05D5\u05DD', en: 'South' },
  sharon: { he: '\u05E9\u05E8\u05D5\u05DF', en: 'Sharon' },
  judea_samaria: { he: '\u05D9\u05D4\u05D5\u05D3\u05D4 \u05D5\u05E9\u05D5\u05DE\u05E8\u05D5\u05DF', en: 'Judea & Samaria' },
};

function getZoneName(zone: Zone, lang: Language): string {
  if (lang === 'en') return zone.englishName;
  return zone.hebrewName;
}

const QUICK_CITIES = [
  '\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05DE\u05E8\u05DB\u05D6 \u05D4\u05E2\u05D9\u05E8',
  '\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD - \u05DE\u05E8\u05DB\u05D6',
  '\u05D7\u05D9\u05E4\u05D4 - \u05DB\u05E8\u05DE\u05DC, \u05D4\u05D3\u05E8 \u05D5\u05E2\u05D9\u05E8 \u05EA\u05D7\u05EA\u05D9\u05EA',
  '\u05D1\u05D0\u05E8 \u05E9\u05D1\u05E2 - \u05D3\u05E8\u05D5\u05DD',
];

interface InlineLocationPickerProps {
  currentZone: string;
  onZoneChange: (hebrewName: string) => void;
}

export default function InlineLocationPicker({ currentZone, onZoneChange }: InlineLocationPickerProps) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isNational = currentZone === '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC';

  const results = useMemo(() => {
    if (query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    const raw = query.trim();

    const matchingRegions: Zone[] = [];
    const matchingCities: Zone[] = [];

    for (const zone of ZONES) {
      if (zone.isNational) continue;
      const name = getZoneName(zone, language).toLowerCase();
      const matches =
        name.includes(q) ||
        zone.hebrewName.includes(raw) ||
        zone.englishName.toLowerCase().includes(q);

      if (matches) {
        if (zone.isRegion) {
          matchingRegions.push(zone);
        } else {
          matchingCities.push(zone);
        }
      }
    }

    return [...matchingRegions, ...matchingCities].slice(0, 8);
  }, [query, language]);

  const selectZone = useCallback(
    (hebrewName: string) => {
      onZoneChange(hebrewName);
      setQuery('');
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onZoneChange]
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const zone = findNearestZone(position.coords.latitude, position.coords.longitude);
        selectZone(zone.hebrewName);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [selectZone]);

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
        selectZone(results[highlightIndex].hebrewName);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    },
    [isOpen, results, highlightIndex, selectZone]
  );

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-zone-item]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="w-full">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">{t.location}</p>

      {/* Quick chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={handleGeolocate}
          disabled={geoLoading}
          className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
            geoLoading ? 'opacity-50 cursor-not-allowed border-slate-600 text-slate-400' : 'border-slate-600 text-slate-300 hover:border-indigo-400'
          }`}
        >
          {'\uD83D\uDCCD'} {geoLoading ? t.locating : t.useLocation}
        </button>
        <button
          onClick={() => selectZone('\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC')}
          className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
            isNational
              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
              : 'border-slate-600 text-slate-300 hover:border-indigo-400'
          }`}
        >
          {t.allOfIsrael}
        </button>
        {QUICK_CITIES.map((cityName) => {
          const zone = ZONES.find((z) => z.hebrewName === cityName);
          if (!zone) return null;
          const display = language === 'en' ? zone.englishName : zone.hebrewName.split(' - ')[0];
          const isActive = currentZone === cityName;
          return (
            <button
              key={cityName}
              onClick={() => selectZone(cityName)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                isActive
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                  : 'border-slate-600 text-slate-300 hover:border-indigo-400'
              }`}
            >
              {display}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <div ref={wrapperRef} className="relative">
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
          className="w-full bg-surface text-white text-sm rounded-xl px-4 py-3 border border-slate-700/50 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder:text-slate-500"
          autoComplete="off"
        />

        {isOpen && query.trim().length > 0 && (
          <div
            ref={listRef}
            className="absolute top-full mt-2 w-full bg-surface-card rounded-xl border border-slate-700/50 shadow-xl shadow-black/20 max-h-[250px] overflow-y-auto z-40"
          >
            {results.length === 0 ? (
              <div className="px-4 py-3 text-slate-500 text-center text-sm">{t.noResults}</div>
            ) : (
              results.map((zone, i) => (
                <button
                  key={zone.hebrewName}
                  data-zone-item
                  onClick={() => selectZone(zone.hebrewName)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-start transition-colors duration-100 first:rounded-t-xl last:rounded-b-xl text-sm ${
                    i === highlightIndex ? 'bg-indigo-500/20' : 'hover:bg-indigo-500/10'
                  }`}
                >
                  <span className="text-slate-100 flex items-center gap-2">
                    {zone.isRegion && <span className="text-indigo-400 text-xs">{'\uD83D\uDCCD'}</span>}
                    {getZoneName(zone, language)}
                  </span>
                  <span className="flex items-center gap-2">
                    {zone.isRegion && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 whitespace-nowrap">
                        {t.region}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${DISTRICT_COLORS[zone.district]}`}>
                      {DISTRICT_LABELS[zone.district][language]}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
