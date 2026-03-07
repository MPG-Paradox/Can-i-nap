'use client';

import { useLanguage } from '@/lib/i18n/context';

interface DurationSliderProps {
  value: number;
  onChange: (val: number) => void;
}

const PRESETS = [20, 45, 90];

export default function DurationSlider({ value, onChange }: DurationSliderProps) {
  const { t } = useLanguage();

  // Calculate fill percentage for the track
  const fillPercent = ((value - 10) / (120 - 10)) * 100;

  return (
    <div className="w-full">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={10}
          max={120}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${fillPercent}%, rgb(51 65 85) ${fillPercent}%, rgb(51 65 85) 100%)`,
          }}
        />
      </div>

      {/* Value display */}
      <p className="text-lg font-semibold text-slate-200 text-center mt-3">
        {value} {t.minutes}
      </p>

      {/* Quick-select buttons */}
      <div className="flex gap-2 mt-3 justify-center">
        {PRESETS.map((presetVal) => (
          <button
            key={presetVal}
            onClick={() => onChange(presetVal)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              value === presetVal
                ? 'bg-indigo-500/10 border border-indigo-500 text-indigo-400'
                : 'bg-surface-card border border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            {presetVal} {t.minutesShort}
          </button>
        ))}
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
