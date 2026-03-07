import { RiskInput, RiskResult, RiskWeights, TrendDirection, OptimalWindow, Alert } from './types';
import { findZoneByName, getZonesForRegion } from './zones';
import { isDualFrontActive } from './dual-front';

export const DEFAULT_WEIGHTS: RiskWeights = {
  core: 40,
  trend: 15,
  recency: 20,
  dualFront: 15,
  timeOfDay: 10,
};

export function getTimeOfDayMultiplier(hour: number): number {
  if (hour >= 1 && hour <= 5) return 1.3;
  if (hour >= 6 && hour <= 8) return 1.1;
  if (hour >= 9 && hour <= 15) return 0.8;
  if (hour >= 16 && hour <= 19) return 1.0;
  if (hour >= 20) return 1.2;
  return 1.0; // hour 0 (midnight)
}

function matchesZone(alert: Alert, zoneId: string, isNational: boolean): boolean {
  if (isNational) return true;

  const targetZone = findZoneByName(zoneId);
  if (targetZone && targetZone.isRegion) {
    const regionZones = getZonesForRegion(zoneId);
    const regionNames = new Set(regionZones.map((z) => z.hebrewName));
    return alert.cities.some((city) => {
      if (regionNames.has(city)) return true;
      const zone = findZoneByName(city);
      if (zone && regionNames.has(zone.hebrewName)) return true;
      return targetZone.regionCities!.some(
        (prefix) => city.includes(prefix) || prefix.includes(city)
      );
    });
  }

  return alert.cities.some((city) => {
    const zone = findZoneByName(city);
    if (!zone || !targetZone) {
      return city.includes(zoneId) || zoneId.includes(city);
    }
    return zone.hebrewName === targetZone.hebrewName;
  });
}

function computeRawFactors(input: RiskInput) {
  const { zoneId, napDurationMinutes, alerts, currentTime } = input;

  const targetZone = findZoneByName(zoneId);
  const isNational = !!(targetZone && targetZone.isNational);

  const zoneAlerts = alerts
    .filter((a) => matchesZone(a, zoneId, isNational))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const timeSinceLastMinutes =
    zoneAlerts.length > 0
      ? (currentTime.getTime() - zoneAlerts[0].timestamp.getTime()) / (60 * 1000)
      : Infinity;

  const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
  const last6hAlerts = zoneAlerts.filter((a) => a.timestamp >= sixHoursAgo);

  let avgIntervalMinutes: number;
  if (last6hAlerts.length >= 2) {
    const sorted = [...last6hAlerts].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
    let totalInterval = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalInterval +=
        sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime();
    }
    avgIntervalMinutes = totalInterval / ((sorted.length - 1) * 60 * 1000);
  } else {
    avgIntervalMinutes = 720;
  }

  const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);
  const volume24h = zoneAlerts.filter((a) => a.timestamp >= twentyFourHoursAgo).length;

  const threeHoursAgo = new Date(currentTime.getTime() - 3 * 60 * 60 * 1000);
  const last3h = zoneAlerts.filter((a) => a.timestamp >= threeHoursAgo).length;
  const prior3h = zoneAlerts.filter(
    (a) => a.timestamp >= sixHoursAgo && a.timestamp < threeHoursAgo
  ).length;

  let trend: TrendDirection;
  if (last3h > prior3h * 1.3) {
    trend = 'increasing';
  } else if (last3h < prior3h * 0.7) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  const baseRisk = 1 - Math.exp(-napDurationMinutes / avgIntervalMinutes);

  const trendMultiplier =
    trend === 'increasing' ? 1.4 : trend === 'decreasing' ? 0.6 : 1.0;

  const timeSinceLastSeconds =
    timeSinceLastMinutes === Infinity ? Infinity : timeSinceLastMinutes * 60;
  const recencyMultiplier =
    timeSinceLastMinutes === Infinity
      ? 0.5
      : 0.5 + 1.5 * Math.exp(-timeSinceLastSeconds / (60 * 60));

  const dualFrontStatus = isDualFrontActive(alerts, currentTime);
  const dualFrontMultiplier = dualFrontStatus.riskMultiplier;

  const timeOfDayMultiplier = getTimeOfDayMultiplier(currentTime.getHours());

  return {
    timeSinceLastMinutes,
    avgIntervalMinutes,
    volume24h,
    trend,
    baseRisk,
    trendMultiplier,
    recencyMultiplier,
    dualFrontStatus,
    dualFrontMultiplier,
    timeOfDayMultiplier,
  };
}

export function calculateNapRiskWeighted(
  input: RiskInput,
  weights: RiskWeights = DEFAULT_WEIGHTS
): RiskResult {
  const raw = computeRawFactors(input);

  const totalWeight = weights.core + weights.trend + weights.recency + weights.dualFront + weights.timeOfDay;
  const w = {
    core: weights.core / totalWeight,
    trend: weights.trend / totalWeight,
    recency: weights.recency / totalWeight,
    dualFront: weights.dualFront / totalWeight,
    timeOfDay: weights.timeOfDay / totalWeight,
  };

  const coreModuleRisk = raw.baseRisk;
  const trendModuleRisk = Math.max(0, Math.min(1, (raw.trendMultiplier - 0.6) / (1.4 - 0.6)));
  const recencyModuleRisk = Math.max(0, Math.min(1, (raw.recencyMultiplier - 0.5) / (2.0 - 0.5)));
  const dualFrontModuleRisk = Math.max(0, Math.min(1, (raw.dualFrontMultiplier - 1.0) / (2.5 - 1.0)));
  const timeOfDayModuleRisk = Math.max(0, Math.min(1, (raw.timeOfDayMultiplier - 0.8) / (1.3 - 0.8)));

  const weightedRisk =
    coreModuleRisk * w.core +
    trendModuleRisk * w.trend +
    recencyModuleRisk * w.recency +
    dualFrontModuleRisk * w.dualFront +
    timeOfDayModuleRisk * w.timeOfDay;

  const riskPercent = Math.min(99, Math.max(0, Math.round(weightedRisk * 100)));

  return {
    riskPercent,
    timeSinceLastMinutes:
      raw.timeSinceLastMinutes === Infinity ? -1 : Math.round(raw.timeSinceLastMinutes),
    avgIntervalMinutes: Math.round(raw.avgIntervalMinutes),
    volume24h: raw.volume24h,
    trend: raw.trend,
    dualFrontStatus: raw.dualFrontStatus,
    baseRisk: raw.baseRisk,
    multipliers: {
      trendMultiplier: raw.trendMultiplier,
      recencyMultiplier: raw.recencyMultiplier,
      dualFrontMultiplier: raw.dualFrontMultiplier,
      timeOfDayMultiplier: raw.timeOfDayMultiplier,
    },
    factors: {
      core: {
        weight: weights.core,
        moduleRisk: Math.round(coreModuleRisk * 100),
        contribution: Math.round(coreModuleRisk * w.core * 100),
      },
      trend: {
        weight: weights.trend,
        moduleRisk: Math.round(trendModuleRisk * 100),
        contribution: Math.round(trendModuleRisk * w.trend * 100),
      },
      recency: {
        weight: weights.recency,
        moduleRisk: Math.round(recencyModuleRisk * 100),
        contribution: Math.round(recencyModuleRisk * w.recency * 100),
      },
      dualFront: {
        weight: weights.dualFront,
        moduleRisk: Math.round(dualFrontModuleRisk * 100),
        contribution: Math.round(dualFrontModuleRisk * w.dualFront * 100),
      },
      timeOfDay: {
        weight: weights.timeOfDay,
        moduleRisk: Math.round(timeOfDayModuleRisk * 100),
        contribution: Math.round(timeOfDayModuleRisk * w.timeOfDay * 100),
      },
    },
  };
}

export function calculateNapRisk(input: RiskInput): RiskResult {
  return calculateNapRiskWeighted(input, DEFAULT_WEIGHTS);
}

export function findOptimalWindow(
  zoneId: string,
  durationMinutes: number,
  alerts: Alert[],
  currentTime: Date,
  weights: RiskWeights = DEFAULT_WEIGHTS
): OptimalWindow {
  let bestRisk = Infinity;
  let bestStart = currentTime;

  for (let offsetMinutes = 0; offsetMinutes < 24 * 60; offsetMinutes += 15) {
    const candidateStart = new Date(
      currentTime.getTime() + offsetMinutes * 60 * 1000
    );

    const result = calculateNapRiskWeighted(
      {
        zoneId,
        napDurationMinutes: durationMinutes,
        alerts,
        currentTime: candidateStart,
      },
      weights
    );

    if (result.riskPercent < bestRisk) {
      bestRisk = result.riskPercent;
      bestStart = candidateStart;
    }
  }

  return {
    startTime: bestStart,
    endTime: new Date(bestStart.getTime() + durationMinutes * 60 * 1000),
    riskPercent: bestRisk,
  };
}
