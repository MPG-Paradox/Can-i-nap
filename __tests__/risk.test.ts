import { calculateNapRisk } from '@/lib/risk';
import { Alert } from '@/lib/types';

// Use a city that exists in the new zones-generated data
const testCity = '\u05D0\u05E9\u05D3\u05D5\u05D3 - \u05D0,\u05D1,\u05D3,\u05D4'; // "אשדוד - א,ב,ד,ה"

function makeAlert(minutesAgo: number, cities: string[], source: 'iran' | 'hezbollah' | 'dual' | 'unknown' = 'iran'): Alert {
  return {
    id: `test_${minutesAgo}`,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    category: 1,
    title: '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
    cities,
    source,
  };
}

const now = new Date();

describe('calculateNapRisk', () => {
  it('returns very low risk with no alerts', () => {
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: [],
      currentTime: now,
    });
    // With no alerts: avgInterval=720min (default), recency=0.5, base risk ~4%
    // Final ~ 2% — low but not zero due to background risk
    expect(result.riskPercent).toBeLessThanOrEqual(5);
  });

  it('returns high risk when alert just happened (1 min ago)', () => {
    const alerts = [
      makeAlert(1, [testCity]),
      makeAlert(30, [testCity]),
      makeAlert(60, [testCity]),
    ];
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeGreaterThan(50);
  });

  it('returns low risk when alert was 6+ hours ago', () => {
    const alerts = [makeAlert(400, [testCity])];
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 20,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeLessThan(15);
  });

  it('returns high risk with many alerts in last hour', () => {
    const alerts = [
      makeAlert(5, [testCity]),
      makeAlert(15, [testCity]),
      makeAlert(25, [testCity]),
      makeAlert(35, [testCity]),
      makeAlert(45, [testCity]),
      makeAlert(55, [testCity]),
    ];
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeGreaterThan(50);
  });

  it('decreasing trend lowers risk compared to stable', () => {
    const alerts = [
      makeAlert(200, [testCity]),
      makeAlert(220, [testCity]),
      makeAlert(240, [testCity]),
    ];
    const resultDecreasing = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });

    const stableAlerts = [
      makeAlert(30, [testCity]),
      makeAlert(200, [testCity]),
    ];
    const resultStable = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: stableAlerts,
      currentTime: now,
    });

    expect(resultDecreasing.multipliers.trendMultiplier).toBeLessThan(
      resultStable.multipliers.trendMultiplier
    );
  });

  it('increasing trend raises risk compared to stable', () => {
    const alerts = [
      makeAlert(30, [testCity]),
      makeAlert(60, [testCity]),
      makeAlert(90, [testCity]),
    ];
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.multipliers.trendMultiplier).toBe(1.4);
  });

  it('120-min nap is riskier than 20-min nap', () => {
    const alerts = [
      makeAlert(30, [testCity]),
      makeAlert(90, [testCity]),
    ];
    const result20 = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 20,
      alerts,
      currentTime: now,
    });
    const result120 = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 120,
      alerts,
      currentTime: now,
    });
    expect(result120.riskPercent).toBeGreaterThan(result20.riskPercent);
  });

  it('region risk aggregates alerts from all member cities', () => {
    // Create alerts for different cities that belong to Gush Dan
    const alerts = [
      makeAlert(10, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05D9\u05E4\u05D5']),
      makeAlert(20, ['\u05E8\u05DE\u05EA \u05D2\u05DF']),
      makeAlert(30, ['\u05D7\u05D5\u05DC\u05D5\u05DF']),
    ];
    const result = calculateNapRisk({
      zoneId: '\u05D2\u05D5\u05E9 \u05D3\u05DF', // Gush Dan region
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    // Region should aggregate alerts from member cities
    expect(result.volume24h).toBeGreaterThan(0);
  });
});
