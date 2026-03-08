'use client';

import { useLanguage } from '@/lib/i18n/context';

interface DurationButtonsProps {
  value: number;
  onChange: (val: number) => void;
}

const PRESETS = [20, 45, 90];

export default function DurationButtons({ value, onChange }: DurationButtonsProps) {
  const { t } = useLanguage();

  const fillPercent = ((value - 10) / (120 - 10)) * 100;

  return (
    <div className="w-full glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-wide text-slate-400">{t.napDuration}</span>
        <span className="text-lg font-bold text-amber-400">
          {value} {t.minutesShort}
        </span>
      </div>

      <div className="px-1">
        <input
          type="range"
          min={10}
          max={120}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="nap-slider w-full"
          style={{
            background: `linear-gradient(to right, #f59e0b ${fillPercent}%, #1e1e1e ${fillPercent}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-600">10</span>
          <span className="text-xs text-slate-600">120</span>
        </div>
      </div>

      <div className="flex gap-2 justify-center mt-4">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
              value === preset
                ? 'bg-amber-500/15 border border-amber-500 text-amber-400'
                : 'bg-transparent border border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {preset}{t.minutesShort}
          </button>
        ))}
      </div>
    </div>
  );
}
