'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { RiskResult, RiskWeights, Language } from '@/lib/types';

interface CalculationPanelProps {
  risk: RiskResult;
  weights: RiskWeights;
  onWeightsChange: (weights: RiskWeights) => void;
}

type FactorKey = 'core' | 'trend' | 'recency' | 'dualFront' | 'timeOfDay';

const FACTOR_COLORS: Record<FactorKey, string> = {
  core: 'bg-indigo-400',
  trend: 'bg-yellow-400',
  recency: 'bg-green-400',
  dualFront: 'bg-red-400',
  timeOfDay: 'bg-purple-400',
};

const FACTOR_DOT_COLORS: Record<FactorKey, string> = {
  core: 'text-indigo-400',
  trend: 'text-yellow-400',
  recency: 'text-green-400',
  dualFront: 'text-red-400',
  timeOfDay: 'text-purple-400',
};

const FACTOR_DESCRIPTIONS: Record<FactorKey, Record<Language, string>> = {
  core: {
    en: 'Base probability from Poisson model \u2014 how likely an alert is during your nap given recent alert frequency.',
    he: '\u05D4\u05E1\u05EA\u05D1\u05E8\u05D5\u05EA \u05D1\u05E1\u05D9\u05E1\u05D9\u05EA \u05DC\u05E4\u05D9 \u05DE\u05D5\u05D3\u05DC \u05E4\u05D5\u05D0\u05E1\u05D5\u05DF \u2014 \u05DE\u05D4 \u05D4\u05E1\u05D9\u05DB\u05D5\u05D9 \u05DC\u05D0\u05D6\u05E2\u05E7\u05D4 \u05D1\u05DE\u05D4\u05DC\u05DA \u05D4\u05EA\u05E0\u05D5\u05DE\u05D4 \u05DC\u05E4\u05D9 \u05EA\u05D3\u05D9\u05E8\u05D5\u05EA \u05D4\u05D0\u05D6\u05E2\u05E7\u05D5\u05EA \u05D4\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4.',
  },
  trend: {
    en: 'Are alerts becoming more or less frequent? Increasing trend raises risk.',
    he: '\u05D4\u05D0\u05DD \u05D4\u05D0\u05D6\u05E2\u05E7\u05D5\u05EA \u05D4\u05D5\u05DC\u05DB\u05D5\u05EA \u05D5\u05E0\u05E2\u05E9\u05D5\u05EA \u05EA\u05DB\u05D5\u05E4\u05D5\u05EA \u05D9\u05D5\u05EA\u05E8? \u05DE\u05D2\u05DE\u05D4 \u05E2\u05D5\u05DC\u05D4 \u05DE\u05E2\u05DC\u05D4 \u05E1\u05D9\u05DB\u05D5\u05DF.',
  },
  recency: {
    en: 'How recently the last alert happened. A very recent alert means elevated risk.',
    he: '\u05DB\u05DE\u05D4 \u05D6\u05DE\u05DF \u05E2\u05D1\u05E8 \u05DE\u05D0\u05D6 \u05D4\u05D0\u05D6\u05E2\u05E7\u05D4 \u05D4\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4. \u05D0\u05D6\u05E2\u05E7\u05D4 \u05DC\u05D0\u05D7\u05E8\u05D5\u05E0\u05D4 \u05DE\u05D2\u05D1\u05D9\u05E8\u05D4 \u05E1\u05D9\u05DB\u05D5\u05DF.',
  },
  dualFront: {
    en: 'Are both Iran and Hezbollah actively firing? Dual-front scenarios multiply risk.',
    he: '\u05D4\u05D0\u05DD \u05D2\u05DD \u05D0\u05D9\u05E8\u05D0\u05DF \u05D5\u05D2\u05DD \u05D7\u05D9\u05D6\u05D1\u05D0\u05DC\u05D4 \u05D9\u05D5\u05E8\u05D9\u05DD? \u05EA\u05E8\u05D7\u05D9\u05E9 \u05D7\u05D6\u05D9\u05EA \u05DB\u05E4\u05D5\u05DC\u05D4 \u05DE\u05DB\u05E4\u05D9\u05DC \u05E1\u05D9\u05DB\u05D5\u05DF.',
  },
  timeOfDay: {
    en: 'Historical attack patterns by time of day. Night hours tend to be riskier.',
    he: '\u05D3\u05E4\u05D5\u05E1\u05D9 \u05EA\u05E7\u05D9\u05E4\u05D4 \u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D9\u05DD \u05DC\u05E4\u05D9 \u05E9\u05E2\u05D4 \u05D1\u05D9\u05D5\u05DD. \u05E9\u05E2\u05D5\u05EA \u05D4\u05DC\u05D9\u05DC\u05D4 \u05E0\u05D5\u05D8\u05D5\u05EA \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05E1\u05D5\u05DB\u05E0\u05D5\u05EA \u05D9\u05D5\u05EA\u05E8.',
  },
};

const FACTOR_KEYS: FactorKey[] = ['core', 'trend', 'recency', 'dualFront', 'timeOfDay'];

export default function CalculationPanel({ risk, weights, onWeightsChange }: CalculationPanelProps) {
  const { language, t } = useLanguage();
  const [expandedFactor, setExpandedFactor] = useState<FactorKey | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

  const factorNames: Record<FactorKey, string> = {
    core: t.factorCore,
    trend: t.factorTrend,
    recency: t.factorRecency,
    dualFront: t.factorDualFront,
    timeOfDay: t.factorTimeOfDay,
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestWeightsRef = useRef(weights);
  latestWeightsRef.current = weights;

  const debouncedOnChange = useCallback((newWeights: RiskWeights) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onWeightsChange(newWeights), 150);
  }, [onWeightsChange]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleWeightChange = (key: FactorKey, value: number) => {
    debouncedOnChange({ ...latestWeightsRef.current, [key]: value });
  };

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpandedFactor(null);
  };

  const isExpanded = (key: FactorKey) => allExpanded || expandedFactor === key;

  return (
    <div className="bg-surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">{t.howCalculated}</p>
        <button
          onClick={toggleAll}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {t.adjustWeights} {allExpanded ? '\u25B2' : '\u25BC'}
        </button>
      </div>

      <div className="space-y-2">
        {FACTOR_KEYS.map((key) => {
          const factor = risk.factors[key];
          const expanded = isExpanded(key);
          const maxContrib = Math.max(1, ...FACTOR_KEYS.map((k) => risk.factors[k].contribution));
          const barWidth = Math.max(2, (factor.contribution / maxContrib) * 100);

          return (
            <div key={key} className="rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => {
                  if (allExpanded) return;
                  setExpandedFactor(expandedFactor === key ? null : key);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${FACTOR_COLORS[key]}`} />
                <span className="flex-1 text-start text-sm text-slate-200">{factorNames[key]}</span>
                <span className="text-xs text-slate-400 tabular-nums w-10 text-end">{factor.weight}%</span>
                <span className={`text-xs font-medium tabular-nums w-10 text-end ${FACTOR_DOT_COLORS[key]}`}>
                  {factor.contribution}%
                </span>
              </button>

              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div className="h-1.5 rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full ${FACTOR_COLORS[key]} transition-all duration-300`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Expanded section */}
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  expanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-slate-400">
                    {FACTOR_DESCRIPTIONS[key][language]}
                  </p>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{t.conditionWeight}</span>
                      <span className="text-xs text-slate-300 tabular-nums">{weights[key]}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[key]}
                      onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                      style={{
                        background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${weights[key]}%, rgb(51 65 85) ${weights[key]}%, rgb(51 65 85) 100%)`,
                      }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{t.moduleRisk}: <span className="text-slate-300">{factor.moduleRisk}%</span></span>
                    <span>{t.resultedContrib}: <span className={FACTOR_DOT_COLORS[key]}>{factor.contribution}%</span></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
