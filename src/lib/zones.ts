import { Zone, Alert, AlertSource } from './types';
import { ZONES as ALL_ZONES } from './zones-generated';
import { hasRecentPreAlert, registerPreAlert } from './pre-alert-tracker';

export const ZONES = ALL_ZONES;

export function findZoneByName(name: string): Zone | undefined {
  const normalized = name.trim();
  if (!normalized) return undefined;

  // Exact match first
  const exact = ZONES.find(
    (z) => z.hebrewName === normalized || z.englishName === normalized
  );
  if (exact) return exact;

  // Fuzzy match: bidirectional includes on Hebrew and English
  return ZONES.find(
    (z) =>
      z.hebrewName.includes(normalized) ||
      normalized.includes(z.hebrewName) ||
      z.englishName.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(z.englishName.toLowerCase()) ||
      // For regions, also check regionCities
      (z.regionCities && z.regionCities.some(
        (c) => c.includes(normalized) || normalized.includes(c)
      ))
  );
}

export function findNearestZone(lat: number, lng: number): Zone {
  let closest = ZONES[0];
  let minDist = Infinity;
  for (const zone of ZONES) {
    // Skip entries with no coordinates or regions
    if (zone.lat === 0 && zone.lng === 0) continue;
    if (zone.isRegion) continue;
    const dist = Math.sqrt(
      Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = zone;
    }
  }
  return closest;
}

export function getZonesForRegion(regionName: string): Zone[] {
  const region = ZONES.find(
    (z) => z.isRegion && (z.hebrewName === regionName || z.englishName === regionName)
  );
  if (!region || !region.regionCities) return [];

  return ZONES.filter((z) => {
    if (z.isRegion) return false;
    return region.regionCities!.some(
      (prefix) => z.hebrewName.includes(prefix) || prefix.includes(z.hebrewName)
    );
  });
}

export function classifyAlertSource(
  cities: string[],
  category: number = 1,
  alertCount: number = cities.length,
  timestamp: Date = new Date(),
  allRecentAlerts: Alert[] = []
): AlertSource {
  // Cat:14 = early warning. ONLY Iran ballistic missiles get this.
  // Hezbollah rockets have 0-30s flight time — no time for early warning.
  if (category === 14) {
    registerPreAlert(timestamp, cities);
    return 'iran';
  }

  // Cat:1 following a recent cat:14 within 4 minutes = same Iranian barrage
  if (category === 1 && hasRecentPreAlert(timestamp)) {
    return 'iran';
  }

  // Check alert history for cat:14 in the last 4 minutes
  const fourMinAgo = new Date(timestamp.getTime() - 4 * 60 * 1000);
  const recentPreAlertFromHistory = allRecentAlerts.some(
    (a) => a.category === 14 && a.timestamp > fourMinAgo
  );
  if (category === 1 && recentPreAlertFromHistory) {
    return 'iran';
  }

  // Massive barrage pattern: Iran launches hit 20+ cities simultaneously
  const isMassiveBarrage = alertCount >= 20;

  // Geography-based classification
  let hasNorth = false;
  let hasCentralSouth = false;

  for (const city of cities) {
    const zone = findZoneByName(city);
    if (!zone) continue;

    if (zone.district === 'haifa') {
      hasNorth = true;
      hasCentralSouth = true;
    } else if (zone.district === 'north') {
      hasNorth = true;
    } else {
      hasCentralSouth = true;
    }
  }

  // Massive barrage hitting central/south = Iran
  if (isMassiveBarrage && hasCentralSouth) return 'iran';

  if (hasNorth && hasCentralSouth) return 'dual';
  if (hasNorth) return 'hezbollah';
  if (hasCentralSouth) return 'iran';

  return 'unknown';
}
