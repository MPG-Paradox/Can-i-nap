import { RiskInput, RiskResult, TrendDirection, OptimalWindow, Alert } from './types';
import { findZoneByName, getZonesForRegion } from './zones';
import { isDualFrontActive } from './dual-front';

function matchesZone(alert: Alert, zoneId: string): boolean {
  // Check if the zoneId is a region
  const targetZone = findZoneByName(zoneId);
  if (targetZone && targetZone.isRegion) {
    const regionZones = getZonesForRegion(zoneId);
    const regionNames = new Set(regionZones.map((z) => z.hebrewName));
    return alert.cities.some((city) => {
      // Check if city is in the region or matches a region city prefix
      if (regionNames.has(city)) return true;
      const zone = findZoneByName(city);
      if (zone && regionNames.has(zone.hebrewName)) return true;
      // Also check prefix matching for region cities
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

export function calculateNapRisk(input: RiskInput): RiskResult {
  const { zoneId, napDurationMinutes, alerts, currentTime } = input;

  // 1. Filter alerts to user's zone
  const zoneAlerts = alerts
    .filter((a) => matchesZone(a, zoneId))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 2. Time since last alert
  const timeSinceLastMinutes =
    zoneAlerts.length > 0
      ? (currentTime.getTime() - zoneAlerts[0].timestamp.getTime()) / (60 * 1000)
      : Infinity;

  // 3. Average interval
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
    avgIntervalMinutes = 720; // 12 hours default
  }

  // 4. Volume 24h
  const twentyFourHoursAgo = new Date(
    currentTime.getTime() - 24 * 60 * 60 * 1000
  );
  const volume24h = zoneAlerts.filter(
    (a) => a.timestamp >= twentyFourHoursAgo
  ).length;

  // 5. Trend
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

  // 6. Base risk (Poisson/exponential CDF)
  const baseRisk = 1 - Math.exp(-napDurationMinutes / avgIntervalMinutes);

  // 7. Trend multiplier
  const trendMultiplier =
    trend === 'increasing' ? 1.4 : trend === 'decreasing' ? 0.6 : 1.0;

  // 8. Recency multiplier
  const timeSinceLastSeconds =
    timeSinceLastMinutes === Infinity
      ? Infinity
      : timeSinceLastMinutes * 60;
  const recencyMultiplier =
    timeSinceLastMinutes === Infinity
      ? 0.5
      : 0.5 + 1.5 * Math.exp(-timeSinceLastSeconds / (60 * 60));

  // 9. Dual front
  const dualFrontStatus = isDualFrontActive(alerts, currentTime);
  const dualFrontMultiplier = dualFrontStatus.riskMultiplier;

  // 10. Raw risk
  const rawRisk =
    baseRisk * trendMultiplier * recencyMultiplier * dualFrontMultiplier;

  // 11. Clamp
  const riskPercent = Math.min(99, Math.max(0, Math.round(rawRisk * 100)));

  return {
    riskPercent,
    timeSinceLastMinutes:
      timeSinceLastMinutes === Infinity ? -1 : Math.round(timeSinceLastMinutes),
    avgIntervalMinutes: Math.round(avgIntervalMinutes),
    volume24h,
    trend,
    dualFrontStatus,
    baseRisk,
    multipliers: {
      trendMultiplier,
      recencyMultiplier,
      dualFrontMultiplier,
    },
  };
}

export function findOptimalWindow(
  zoneId: string,
  durationMinutes: number,
  alerts: Alert[],
  currentTime: Date
): OptimalWindow {
  let bestRisk = Infinity;
  let bestStart = currentTime;

  // Scan next 24 hours in 15-minute increments
  for (let offsetMinutes = 0; offsetMinutes < 24 * 60; offsetMinutes += 15) {
    const candidateStart = new Date(
      currentTime.getTime() + offsetMinutes * 60 * 1000
    );

    const result = calculateNapRisk({
      zoneId,
      napDurationMinutes: durationMinutes,
      alerts,
      currentTime: candidateStart,
    });

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
