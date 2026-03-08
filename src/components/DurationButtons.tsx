'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface DurationButtonsProps {
  value: number;
  onChange: (val: number) => void;
}

const PRESETS = [20, 45, 90];

export default function DurationButtons({ value, onChange }: DurationButtonsProps) {
  const { t } = useLanguage();
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState(String(value));

  const isPreset = PRESETS.includes(value);

  const handleCustomConfirm = () => {
    const num = Math.min(120, Math.max(10, parseInt(customValue) || 20));
    onChange(num);
    setCustomValue(String(num));
    setShowCustom(false);
  };

  return (
    <div className="w-full">
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">{t.napDuration}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        {PRESETS.map((presetVal) => (
          <button
            key={presetVal}
            onClick={() => { onChange(presetVal); setShowCustom(false); }}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
              value === presetVal
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'border border-slate-600 text-slate-300 hover:border-indigo-400'
            }`}
          >
            {presetVal} {t.minutesShort}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-150 ${
            !isPreset && !showCustom
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
              : showCustom
                ? 'bg-indigo-500/20 border border-indigo-500 text-indigo-300'
                : 'border border-slate-600 text-slate-300 hover:border-indigo-400'
          }`}
        >
          {!isPreset && !showCustom ? `${value} ${t.minutesShort}` : t.custom}
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 mt-3 justify-center">
          <button
            onClick={() => {
              const n = Math.max(10, (parseInt(customValue) || 20) - 5);
              setCustomValue(String(n));
              onChange(n);
            }}
            className="w-9 h-9 rounded-full border border-slate-600 text-slate-300 hover:border-indigo-400 flex items-center justify-center text-lg"
          >
            -
          </button>
          <input
            type="number"
            min={10}
            max={120}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onBlur={handleCustomConfirm}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomConfirm()}
            className="w-16 text-center glass-card rounded-lg px-2 py-1.5 text-slate-200 text-sm outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => {
              const n = Math.min(120, (parseInt(customValue) || 20) + 5);
              setCustomValue(String(n));
              onChange(n);
            }}
            className="w-9 h-9 rounded-full border border-slate-600 text-slate-300 hover:border-indigo-400 flex items-center justify-center text-lg"
          >
            +
          </button>
          <span className="text-sm text-slate-400">{t.minutes}</span>
        </div>
      )}
    </div>
  );
}
