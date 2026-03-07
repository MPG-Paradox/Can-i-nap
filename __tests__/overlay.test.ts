import { findZoneByName } from '@/lib/zones';
import { StoredAlert } from '@/lib/types';

// Replicate the overlay check logic from page.tsx
function checkAlertForOverlay(
  alert: StoredAlert,
  zoneName: string
): { type: 'active-alert' | 'pre-alert' } | null {
  const category = alert.category;

  if (category === 14) {
    return { type: 'pre-alert' };
  }

  if (category !== 1 && category !== 2) {
    return null;
  }

  const zone = findZoneByName(zoneName);
  if (!zone) return null;

  if (zone.isNational) {
    return { type: 'active-alert' };
  }

  if (zone.isRegion && zone.regionCities) {
    const matches = alert.cities.some(city =>
      zone.regionCities!.some(rc => city.includes(rc) || rc.includes(city))
    );
    if (matches) return { type: 'active-alert' };
  }

  const matches = alert.cities.some(city =>
    city.includes(zoneName) || zoneName.includes(city)
  );
  if (matches) return { type: 'active-alert' };

  return null;
}

const testCity = '\u05D0\u05E9\u05D3\u05D5\u05D3 - \u05D0,\u05D1,\u05D3,\u05D4';

function makeStoredAlert(category: number, cities: string[]): StoredAlert {
  return {
    id: 'test_1',
    timestamp: new Date().toISOString(),
    category,
    title: '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
    cities,
    source: 'iran',
  };
}

describe('checkAlertForOverlay', () => {
  it('returns active-alert when cat:1 matches user zone', () => {
    const alert = makeStoredAlert(1, [testCity]);
    const result = checkAlertForOverlay(alert, testCity);
    expect(result).toEqual({ type: 'active-alert' });
  });

  it('returns pre-alert for cat:14', () => {
    const alert = makeStoredAlert(14, [testCity]);
    const result = checkAlertForOverlay(alert, testCity);
    expect(result).toEqual({ type: 'pre-alert' });
  });

  it('returns null when cat:1 does not match user zone', () => {
    const alert = makeStoredAlert(1, ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4']);
    const result = checkAlertForOverlay(alert, testCity);
    expect(result).toBeNull();
  });

  it('national mode triggers on any alert', () => {
    const alert = makeStoredAlert(1, ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4']);
    const result = checkAlertForOverlay(alert, '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC');
    expect(result).toEqual({ type: 'active-alert' });
  });

  it('region mode triggers when alert city matches a member city', () => {
    // Gush Dan region should match Tel Aviv cities
    const alert = makeStoredAlert(1, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05D9\u05E4\u05D5']);
    const result = checkAlertForOverlay(alert, '\u05D2\u05D5\u05E9 \u05D3\u05DF');
    expect(result).toEqual({ type: 'active-alert' });
  });

  it('returns null for non-threat categories (cat:13)', () => {
    const alert = makeStoredAlert(13, [testCity]);
    const result = checkAlertForOverlay(alert, testCity);
    expect(result).toBeNull();
  });

  it('returns active-alert for cat:2 (hostile aircraft) matching zone', () => {
    const alert = makeStoredAlert(2, [testCity]);
    const result = checkAlertForOverlay(alert, testCity);
    expect(result).toEqual({ type: 'active-alert' });
  });
});
