import { findZoneByName, getZonesForRegion } from '@/lib/zones';
import { calculateNapRisk } from '@/lib/risk';
import { Alert } from '@/lib/types';

describe('regions', () => {
  it('getZonesForRegion returns zones for Gush Dan', () => {
    const zones = getZonesForRegion('\u05D2\u05D5\u05E9 \u05D3\u05DF');
    expect(zones.length).toBeGreaterThan(0);
    // Should include Tel Aviv and Ramat Gan
    const names = zones.map(z => z.hebrewName);
    const hasTelAviv = names.some(n => n.includes('\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1'));
    expect(hasTelAviv).toBe(true);
  });

  it('findZoneByName finds Gush Dan region', () => {
    const zone = findZoneByName('\u05D2\u05D5\u05E9 \u05D3\u05DF');
    expect(zone).toBeDefined();
    expect(zone!.isRegion).toBe(true);
    expect(zone!.regionCities).toBeDefined();
    expect(zone!.regionCities!.length).toBeGreaterThan(0);
  });

  it('risk calculation for a region considers alerts from all member cities', () => {
    const now = new Date();
    const alerts: Alert[] = [
      {
        id: 'ta1',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000),
        category: 1,
        title: 'test',
        cities: ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05D9\u05E4\u05D5'],
        source: 'iran',
      },
      {
        id: 'rg1',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000),
        category: 1,
        title: 'test',
        cities: ['\u05E8\u05DE\u05EA \u05D2\u05DF'],
        source: 'iran',
      },
    ];

    const result = calculateNapRisk({
      zoneId: '\u05D2\u05D5\u05E9 \u05D3\u05DF',
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });

    // Should see alerts from both Tel Aviv and Ramat Gan
    expect(result.volume24h).toBeGreaterThanOrEqual(2);
  });

  it('getZonesForRegion returns empty for non-region', () => {
    const zones = getZonesForRegion('\u05DC\u05D5\u05D3');
    expect(zones.length).toBe(0);
  });
});
