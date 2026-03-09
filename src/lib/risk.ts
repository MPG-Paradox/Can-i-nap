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

// Based on actual alert data from Feb 28 - Mar 8, 2026:
// Peak: 05:00-08:00 (357 alerts at 07:00), 20:00-22:00 (452 combined)
// Quiet: 17:00-20:00 (0 alerts)
export function getTimeOfDayMultiplier(hour: number): number {
  if (hour >= 5 && hour < 8) return 1.5;    // Dawn/early morning — HIGHEST risk
  if (hour >= 20 && hour < 23) return 1.3;   // Evening — high
  if (hour >= 23 || hour < 2) return 1.1;    // Late night — moderate
  if (hour >= 2 && hour < 5) return 1.0;     // Deep night — normal
  if (hour >= 8 && hour < 12) return 0.7;    // Morning — lower
  if (hour >= 12 && hour < 17) return 0.5;   // Afternoon — lowest
  if (hour >= 17 && hour < 20) return 0.3;   // Late afternoon — QUIETEST
  return 1.0;
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

  // Extract base city name (before " - ") for broader matching
  // e.g. "ירושלים - מרכז" → "ירושלים"
  const baseName = zoneId.split(' - ')[0].trim();

  return alert.cities.some((city) => {
    const zone = findZoneByName(city);
    if (zone && targetZone && zone.hebrewName === targetZone.hebrewName) return true;

    // Direct Hebrew string matching
    if (city.includes(zoneId) || zoneId.includes(city)) return true;

    // Base name matching: "ירושלים" matches "ירושלים - מרכז, רמות"
    if (city.includes(baseName) || baseName.includes(city)) return true;

    return false;
  });
}

function computeRawFactors(input: RiskInput) {
  const { zoneId, napDurationMinutes, alerts, currentTime } = input;

  // Only count actual threat alerts for risk calculation (cat:1 rockets, cat:2 hostile aircraft).
  // Cat:14 (pre-alert) and cat:13 (all clear) should NOT inflate risk numbers.
  const threatAlerts = alerts.filter((a) => a.category === 1 || a.category === 2);

  const targetZone = findZoneByName(zoneId);
  const isNational = !!(targetZone && targetZone.isNational);

  const zoneAlerts = threatAlerts
    .filter((a) => matchesZone(a, zoneId, isNational))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const timeSinceLastMinutes =
    zoneAlerts.length > 0
      ? (currentTime.getTime() - zoneAlerts[0].timestamp.getTime()) / (60 * 1000)
      : Infinity;

  const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

  // Expand window progressively: 6h → 24h → 72h → all data
  let windowAlerts = zoneAlerts.filter((a) => a.timestamp >= sixHoursAgo);
  if (windowAlerts.length < 2) {
    windowAlerts = zoneAlerts.filter((a) => a.timestamp >= twentyFourHoursAgo);
  }
  if (windowAlerts.length < 2) {
    const threeDaysAgo = new Date(currentTime.getTime() - 72 * 60 * 60 * 1000);
    windowAlerts = zoneAlerts.filter((a) => a.timestamp >= threeDaysAgo);
  }
  if (windowAlerts.length < 2) {
    windowAlerts = zoneAlerts;
  }

  // Weighted average interval: recent intervals matter more than old ones
  let avgIntervalMinutes: number;
  if (windowAlerts.length >= 2) {
    const sorted = [...windowAlerts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime() // Newest first
    );
    let weightedSum = 0;
    let weightTotal = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const interval = (sorted[i].timestamp.getTime() - sorted[i + 1].timestamp.getTime()) / 60000;
      const weight = 1 / (i + 1); // 1, 0.5, 0.33, 0.25...
      weightedSum += interval * weight;
      weightTotal += weight;
    }
    avgIntervalMinutes = weightedSum / weightTotal;
  } else {
    avgIntervalMinutes = 720;
  }

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

  const dualFrontStatus = isDualFrontActive(threatAlerts, currentTime);
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
  const timeOfDayModuleRisk = Math.max(0, Math.min(1, (raw.timeOfDayMultiplier - 0.3) / (1.5 - 0.3)));

  const weightedRisk =
    coreModuleRisk * w.core +
    trendModuleRisk * w.trend +
    recencyModuleRisk * w.recency +
    dualFrontModuleRisk * w.dualFront +
    timeOfDayModuleRisk * w.timeOfDay;

  // Preserve one decimal for UI display precision (e.g., 97.2% vs 97%)
  const riskPercent = Math.min(99, Math.max(0, Math.round(weightedRisk * 1000) / 10));

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
  // Always use real current time so results are never in the past
  const now = new Date();
  let bestRisk = Infinity;
  let bestStart = now;
  let bestOffset = 0;

  for (let offsetMinutes = 0; offsetMinutes < 24 * 60; offsetMinutes += 60) {
    const candidateStart = new Date(
      now.getTime() + offsetMinutes * 60 * 1000
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
      bestOffset = offsetMinutes;
    }
    // Prefer sooner windows: if within 2h and nearly as good, take it
    else if (
      offsetMinutes <= 120 &&
      result.riskPercent <= bestRisk + 5 &&
      offsetMinutes < bestOffset
    ) {
      bestRisk = result.riskPercent;
      bestStart = candidateStart;
      bestOffset = offsetMinutes;
    }
  }

  // Safety check: ensure result is never in the past
  if (bestStart.getTime() < now.getTime()) {
    bestStart = now;
  }

  return {
    startTime: bestStart,
    endTime: new Date(bestStart.getTime() + durationMinutes * 60 * 1000),
    riskPercent: bestRisk,
  };
}
