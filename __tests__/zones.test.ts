import { findZoneByName, findNearestZone, classifyAlertSource, getZonesForRegion } from '@/lib/zones';
import { resetPreAlerts, registerPreAlert } from '@/lib/pre-alert-tracker';
import { Alert } from '@/lib/types';

beforeEach(() => {
  resetPreAlerts();
});

describe('findZoneByName', () => {
  it('finds zone by exact Hebrew name', () => {
    const zone = findZoneByName('\u05D0\u05D1\u05D5 \u05D2\u05D5\u05E9');
    expect(zone).toBeDefined();
    expect(zone!.englishName).toBe('Abu Gosh');
  });

  it('finds zone by partial Hebrew name (prefix match)', () => {
    const zone = findZoneByName('\u05D0\u05E9\u05D3\u05D5\u05D3');
    expect(zone).toBeDefined();
    expect(zone!.hebrewName).toContain('\u05D0\u05E9\u05D3\u05D5\u05D3');
  });

  it('finds zone by English name', () => {
    const zone = findZoneByName('Abu Gosh');
    expect(zone).toBeDefined();
  });

  it('finds a region by Hebrew name', () => {
    const zone = findZoneByName('\u05D2\u05D5\u05E9 \u05D3\u05DF');
    expect(zone).toBeDefined();
    expect(zone!.isRegion).toBe(true);
    expect(zone!.englishName).toBe('Gush Dan');
  });

  it('returns undefined for unknown name', () => {
    const zone = findZoneByName('NonexistentCity');
    expect(zone).toBeUndefined();
  });
});

describe('findNearestZone', () => {
  it('returns a zone near Tel Aviv for TA coords', () => {
    const zone = findNearestZone(32.08, 34.78);
    expect(zone).toBeDefined();
    expect(zone.lat).toBeGreaterThan(0);
  });

  it('returns a northern zone for coords near Kiryat Shmona', () => {
    const zone = findNearestZone(33.21, 35.57);
    expect(zone.district).toBe('north');
  });
});

describe('getZonesForRegion', () => {
  it('returns zones for Gush Dan region', () => {
    const zones = getZonesForRegion('\u05D2\u05D5\u05E9 \u05D3\u05DF');
    expect(zones.length).toBeGreaterThan(0);
    // Should include cities with "Tel Aviv" prefix
    const hasTelAviv = zones.some(z => z.hebrewName.includes('\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1'));
    expect(hasTelAviv).toBe(true);
  });

  it('returns empty array for non-region', () => {
    const zones = getZonesForRegion('\u05D0\u05D1\u05D5 \u05D2\u05D5\u05E9');
    expect(zones.length).toBe(0);
  });
});

describe('classifyAlertSource', () => {
  it('classifies cat:14 as iran regardless of geography', () => {
    const source = classifyAlertSource(
      ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4'], // Northern city
      14, 1, new Date()
    );
    expect(source).toBe('iran');
  });

  it('classifies cat:1 within 4 minutes of cat:14 as iran (pre-alert correlation)', () => {
    const now = new Date();
    // First register a pre-alert
    registerPreAlert(now, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1']);

    // Then classify a cat:1 arriving 2 minutes later
    const twoMinLater = new Date(now.getTime() + 2 * 60 * 1000);
    const source = classifyAlertSource(
      ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4'], // Northern city — would be Hezbollah by geography
      1, 1, twoMinLater
    );
    expect(source).toBe('iran');
  });

  it('falls back to geography after cat:14 expires (5 minutes)', () => {
    const now = new Date();
    registerPreAlert(now, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1']);

    // 5 minutes later — pre-alert expired
    const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
    const source = classifyAlertSource(
      ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4'], // Northern city
      1, 1, fiveMinLater
    );
    expect(source).toBe('hezbollah');
  });

  it('classifies cat:1 with recent cat:14 in alert history as iran', () => {
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const recentAlerts: Alert[] = [{
      id: 'prealert1',
      timestamp: twoMinAgo,
      category: 14,
      title: 'test',
      cities: ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1'],
      source: 'iran',
    }];

    const source = classifyAlertSource(
      ['\u05E0\u05D4\u05E8\u05D9\u05D4'], // Northern city
      1, 1, now, recentAlerts
    );
    expect(source).toBe('iran');
  });

  it('classifies massive barrage (25+ cities) in central Israel as iran', () => {
    const cities = Array.from({ length: 25 }, (_, i) => `\u05E2\u05D9\u05E8-${i}`);
    // None of these will match known zones, so add one known central city
    cities.push('\u05DC\u05D5\u05D3');
    const source = classifyAlertSource(cities, 1, cities.length, new Date());
    expect(source).toBe('iran');
  });

  it('classifies 3 northern cities with no pre-alert as hezbollah', () => {
    const source = classifyAlertSource(
      ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4', '\u05E0\u05D4\u05E8\u05D9\u05D4', '\u05E6\u05E4\u05EA'],
      1, 3, new Date()
    );
    expect(source).toBe('hezbollah');
  });

  it('classifies north + central cities as dual', () => {
    const source = classifyAlertSource(
      ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4', '\u05DC\u05D5\u05D3'],
      1, 2, new Date()
    );
    expect(source).toBe('dual');
  });

  it('defaults unrecognized cities to iran (central/south)', () => {
    const source = classifyAlertSource(['\u05E2\u05D9\u05E8 \u05DC\u05D0 \u05E7\u05D9\u05D9\u05DE\u05EA'], 1, 1, new Date());
    expect(source).toBe('iran');
  });

  it('classifies small northern communities via keyword fallback', () => {
    // These are tiny kibbutzim not in zones-generated but should be Hezbollah
    const source = classifyAlertSource(
      ['\u05DE\u05E9\u05D2\u05D1 \u05E2\u05DD', '\u05D0\u05D1\u05D9\u05D1\u05D9\u05DD'],
      1, 2, new Date()
    );
    expect(source).toBe('hezbollah');
  });
});
