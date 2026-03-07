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
  riskPercent: number;
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
    let bestRisk = Infinity;
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
      const point: TimelinePoint = {
        time: time.getTime(),
        timeLabel: formatGraphTimeLabel(time, prevTime),
        riskPercent: risk.riskPercent,
        isPast: time.getTime() < currentTime.getTime(),
      };
      points.push(point);
      prevTime = time;

      if (offset === 0) nIdx = points.length - 1;

      // Best future time only
      if (offset >= 0 && risk.riskPercent < bestRisk) {
        bestRisk = risk.riskPercent;
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
    <div className="bg-surface-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">{t.whenSafest}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-slate-400 hover:text-indigo-400 transition-colors text-sm"
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

      <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
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
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
              }}
              formatter={(value) => [`${value}%`, 'Risk']}
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
                stroke="#818cf8"
                strokeDasharray="4 4"
                label={{
                  value: t.now,
                  position: 'top',
                  fill: '#818cf8',
                  fontSize: 11,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="riskPercent"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
