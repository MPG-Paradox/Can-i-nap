'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/context';

interface RiskDialProps {
  riskPercent: number;
  zoneName: string;
  napDuration: number;
}

function getRiskColor(risk: number): string {
  if (risk <= 20) return '#22c55e';
  if (risk <= 40) return '#eab308';
  if (risk <= 60) return '#f97316';
  return '#dc2626';
}

export default function RiskDial({ riskPercent, zoneName, napDuration }: RiskDialProps) {
  const { t } = useLanguage();
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  // Animate the number
  useEffect(() => {
    const from = prevValueRef.current;
    const to = riskPercent;
    const duration = 400;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + (to - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = to;
      }
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [riskPercent]);

  const color = getRiskColor(riskPercent);
  const radius = 100;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (riskPercent / 100) * circumference;

  const subtitle = t.forNap
    .replace('{duration}', String(napDuration))
    .replace('{zone}', zoneName);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px]">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 224 224"
          style={{ filter: `drop-shadow(0 0 12px ${color}40)` }}
        >
          {/* Background ring */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="none"
            stroke="rgb(51 65 85 / 0.3)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <circle
            cx="112"
            cy="112"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 500ms ease-out, stroke 300ms ease' }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums"
            style={{ color }}
          >
            {displayValue}%
          </span>
          <span className="text-sm text-slate-400 mt-1">{t.riskLabel}</span>
        </div>
      </div>
      <p className="mt-3 text-base text-slate-300 text-center max-w-xs">{subtitle}</p>
    </div>
  );
}
