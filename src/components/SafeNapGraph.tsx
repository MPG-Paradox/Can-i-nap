'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Alert, RiskWeights } from '@/lib/types';
import { calculateNapRiskWeighted, DEFAULT_WEIGHTS } from '@/lib/risk';
import { formatBestTime, formatGraphTimeLabel } from '@/lib/utils';

interface SafeNapGraphProps {
  zoneId: string;
  napDuration: number;
  alerts: Alert[];
  currentTime: Date;
  weights?: RiskWeights;
  onRefresh?: () => void;
}

interface TimelinePoint {
  time: number;
  timeLabel: string;
  safetyPercent: number;
  isPast: boolean;
}

export default function SafeNapGraph({
  zoneId,
  napDuration,
  alerts,
  currentTime,
  weights = DEFAULT_WEIGHTS,
  onRefresh,
}: SafeNapGraphProps) {
  const { t } = useLanguage();

  const { data, bestTimeLabel, nowIndex } = useMemo(() => {
    const points: TimelinePoint[] = [];
    let bestSafety = -Infinity;
    let bestTime: Date | null = null;
    let nIdx = 0;

    // -12h to +12h, every 60 min (25 points)
    let prevTime: Date | null = null;
    for (let offset = -12 * 60; offset <= 12 * 60; offset += 60) {
      const time = new Date(currentTime.getTime() + offset * 60000);
      const risk = calculateNapRiskWeighted(
        { zoneId, napDurationMinutes: napDuration, alerts, currentTime: time },
        weights
      );
      const safety = Math.round(100 - risk.riskPercent);
      const point: TimelinePoint = {
        time: time.getTime(),
        timeLabel: formatGraphTimeLabel(time, prevTime),
        safetyPercent: safety,
        isPast: time.getTime() < currentTime.getTime(),
      };
      points.push(point);
      prevTime = time;

      if (offset === 0) nIdx = points.length - 1;

      // Best future time = highest safety (must be in the future)
      if (offset >= 0 && safety > bestSafety && time.getTime() >= Date.now()) {
        bestSafety = safety;
        bestTime = time;
      }
    }

    const label = bestTime
      ? formatBestTime(bestTime, currentTime, t.tomorrow)
      : '';

    return { data: points, bestTimeLabel: label, nowIndex: nIdx };
  }, [zoneId, napDuration, alerts, currentTime, weights, t.tomorrow]);

  // Get alert timestamps for the past 12h for reference marks
  const alertTimes = useMemo(() => {
    const twelveHoursAgo = currentTime.getTime() - 12 * 60 * 60 * 1000;
    return alerts
      .filter((a) => a.timestamp.getTime() >= twelveHoursAgo && a.timestamp.getTime() <= currentTime.getTime())
      .map((a) => ({
        time: a.timestamp.getTime(),
        source: a.source,
      }));
  }, [alerts, currentTime]);

  return (
    <div className="glass-card rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">{t.whenSafest}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-slate-400 hover:text-amber-400 transition-colors text-sm"
            title="Refresh"
          >
            {'\u21BB'}
          </button>
        )}
      </div>

      {bestTimeLabel && (
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-risk-green/20 text-risk-green text-sm font-medium">
            {'\uD83C\uDF19'} {t.bestTime}: {bestTimeLabel}
          </span>
        </div>
      )}

      <div className="h-[200px] sm:h-[250px] md:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="safetyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval={2}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: '#0a0a0a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
              }}
              formatter={(value) => [`${Math.round(Number(value))}%`, t.safety]}
              labelFormatter={(label) => String(label)}
            />
            {/* Alert markers */}
            {alertTimes.slice(0, 20).map((a, i) => {
              const nearestPoint = data.reduce((prev, curr) =>
                Math.abs(curr.time - a.time) < Math.abs(prev.time - a.time) ? curr : prev
              );
              return (
                <ReferenceLine
                  key={`alert-${i}`}
                  x={nearestPoint.timeLabel}
                  stroke={a.source === 'hezbollah' ? '#f97316' : '#dc2626'}
                  strokeOpacity={0.5}
                  strokeDasharray="2 2"
                />
              );
            })}
            {/* "Now" marker */}
            {data[nowIndex] && (
              <ReferenceLine
                x={data[nowIndex].timeLabel}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                label={{
                  value: t.now,
                  position: 'top',
                  fill: '#fbbf24',
                  fontSize: 11,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="safetyPercent"
              stroke="#4ade80"
              strokeWidth={2}
              fill="url(#safetyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
