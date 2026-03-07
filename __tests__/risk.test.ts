import { calculateNapRisk, calculateNapRiskWeighted, getTimeOfDayMultiplier, DEFAULT_WEIGHTS } from '@/lib/risk';
import { Alert, RiskWeights } from '@/lib/types';

const testCity = '\u05D0\u05E9\u05D3\u05D5\u05D3 - \u05D0,\u05D1,\u05D3,\u05D4';

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
  it('returns low risk with no alerts', () => {
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: [],
      currentTime: now,
    });
    // Weighted system: stable trend contributes ~7.5%, timeOfDay varies
    // Total baseline ~10-20%
    expect(result.riskPercent).toBeLessThanOrEqual(25);
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
    expect(result.riskPercent).toBeGreaterThan(40);
  });

  it('returns lower risk when alert was 6+ hours ago', () => {
    const alerts = [makeAlert(400, [testCity])];
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 20,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeLessThan(25);
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
    expect(result.riskPercent).toBeGreaterThan(40);
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
    const alerts = [
      makeAlert(10, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05D9\u05E4\u05D5']),
      makeAlert(20, ['\u05E8\u05DE\u05EA \u05D2\u05DF']),
      makeAlert(30, ['\u05D7\u05D5\u05DC\u05D5\u05DF']),
    ];
    const result = calculateNapRisk({
      zoneId: '\u05D2\u05D5\u05E9 \u05D3\u05DF',
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.volume24h).toBeGreaterThan(0);
  });

  it('includes factors breakdown in result', () => {
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: [],
      currentTime: now,
    });
    expect(result.factors).toBeDefined();
    expect(result.factors.core).toBeDefined();
    expect(result.factors.trend).toBeDefined();
    expect(result.factors.recency).toBeDefined();
    expect(result.factors.dualFront).toBeDefined();
    expect(result.factors.timeOfDay).toBeDefined();
    expect(result.factors.core.weight).toBe(DEFAULT_WEIGHTS.core);
  });

  it('includes timeOfDay multiplier', () => {
    const result = calculateNapRisk({
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: [],
      currentTime: now,
    });
    expect(result.multipliers.timeOfDayMultiplier).toBeDefined();
    expect(result.multipliers.timeOfDayMultiplier).toBeGreaterThan(0);
  });
});

describe('calculateNapRiskWeighted', () => {
  it('with default weights produces same result as calculateNapRisk', () => {
    const input = {
      zoneId: testCity,
      napDurationMinutes: 30,
      alerts: [makeAlert(30, [testCity])],
      currentTime: now,
    };
    const r1 = calculateNapRisk(input);
    const r2 = calculateNapRiskWeighted(input, DEFAULT_WEIGHTS);
    expect(r1.riskPercent).toBe(r2.riskPercent);
  });

  it('setting a factor weight to 0 removes its influence', () => {
    const alerts = [makeAlert(5, [testCity]), makeAlert(15, [testCity])];
    const input = { zoneId: testCity, napDurationMinutes: 30, alerts, currentTime: now };

    const zeroTrend: RiskWeights = { ...DEFAULT_WEIGHTS, trend: 0 };
    const result = calculateNapRiskWeighted(input, zeroTrend);
    expect(result.factors.trend.contribution).toBe(0);
  });

  it('setting all weight on core makes result dominated by baseRisk', () => {
    const alerts = [makeAlert(60, [testCity])];
    const input = { zoneId: testCity, napDurationMinutes: 30, alerts, currentTime: now };

    const coreOnly: RiskWeights = { core: 100, trend: 0, recency: 0, dualFront: 0, timeOfDay: 0 };
    const result = calculateNapRiskWeighted(input, coreOnly);

    // With all weight on core, result should be roughly baseRisk*100
    const expectedRisk = Math.round(result.baseRisk * 100);
    expect(Math.abs(result.riskPercent - expectedRisk)).toBeLessThanOrEqual(1);
  });

  it('All of Israel national mode does not filter alerts by city', () => {
    const alerts = [
      makeAlert(10, ['\u05D0\u05E9\u05D3\u05D5\u05D3 - \u05D0,\u05D1,\u05D3,\u05D4']),
      makeAlert(20, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1 - \u05D9\u05E4\u05D5']),
      makeAlert(30, ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4']),
    ];
    const result = calculateNapRisk({
      zoneId: '\u05DB\u05DC \u05D9\u05E9\u05E8\u05D0\u05DC',
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    // National mode should see ALL alerts regardless of city
    expect(result.volume24h).toBe(3);
  });
});

describe('getTimeOfDayMultiplier', () => {
  it('returns higher value for late night (1-5)', () => {
    expect(getTimeOfDayMultiplier(3)).toBe(1.3);
  });

  it('returns lower value for midday (9-15)', () => {
    expect(getTimeOfDayMultiplier(12)).toBe(0.8);
  });

  it('returns normal for afternoon (16-19)', () => {
    expect(getTimeOfDayMultiplier(17)).toBe(1.0);
  });

  it('returns elevated for evening (20+)', () => {
    expect(getTimeOfDayMultiplier(22)).toBe(1.2);
  });

  it('returns 1.0 for midnight (hour 0)', () => {
    expect(getTimeOfDayMultiplier(0)).toBe(1.0);
  });
});
