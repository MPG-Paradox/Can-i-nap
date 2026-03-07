import { calculateNapRisk } from '@/lib/risk';
import { Alert } from '@/lib/types';

function makeAlert(minutesAgo: number, cities: string[], source: 'iran' | 'hezbollah' | 'dual' | 'unknown' = 'iran'): Alert {
  return {
    id: `test_${minutesAgo}`,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    category: 1,
    title: 'ירי רקטות וטילים',
    cities,
    source,
  };
}

const now = new Date();
const ashdodZone = 'אשדוד - יא,יב,טו,יז,מרינה';

describe('calculateNapRisk', () => {
  it('returns very low risk with no alerts', () => {
    const result = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts: [],
      currentTime: now,
    });
    // With no alerts: avgInterval=720min (default), recency=0.5, base risk ~4%
    // Final ≈ 2% — low but not zero due to background risk
    expect(result.riskPercent).toBeLessThanOrEqual(5);
  });

  it('returns high risk when alert just happened (1 min ago)', () => {
    const alerts = [
      makeAlert(1, [ashdodZone]),
      makeAlert(30, [ashdodZone]),
      makeAlert(60, [ashdodZone]),
    ];
    const result = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeGreaterThan(50);
  });

  it('returns low risk when alert was 6+ hours ago', () => {
    const alerts = [makeAlert(400, [ashdodZone])];
    const result = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 20,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeLessThan(15);
  });

  it('returns high risk with many alerts in last hour', () => {
    const alerts = [
      makeAlert(5, [ashdodZone]),
      makeAlert(15, [ashdodZone]),
      makeAlert(25, [ashdodZone]),
      makeAlert(35, [ashdodZone]),
      makeAlert(45, [ashdodZone]),
      makeAlert(55, [ashdodZone]),
    ];
    const result = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.riskPercent).toBeGreaterThan(50);
  });

  it('decreasing trend lowers risk compared to stable', () => {
    // Alerts only in the 3-6h window (prior3h), none in last 3h
    const alerts = [
      makeAlert(200, [ashdodZone]),
      makeAlert(220, [ashdodZone]),
      makeAlert(240, [ashdodZone]),
    ];
    const resultDecreasing = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });

    // Alerts spread evenly (stable)
    const stableAlerts = [
      makeAlert(30, [ashdodZone]),
      makeAlert(200, [ashdodZone]),
    ];
    const resultStable = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts: stableAlerts,
      currentTime: now,
    });

    expect(resultDecreasing.multipliers.trendMultiplier).toBeLessThan(
      resultStable.multipliers.trendMultiplier
    );
  });

  it('increasing trend raises risk compared to stable', () => {
    // Alerts only in last 3h, none in 3-6h window
    const alerts = [
      makeAlert(30, [ashdodZone]),
      makeAlert(60, [ashdodZone]),
      makeAlert(90, [ashdodZone]),
    ];
    const result = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 30,
      alerts,
      currentTime: now,
    });
    expect(result.multipliers.trendMultiplier).toBe(1.4);
  });

  it('120-min nap is riskier than 20-min nap', () => {
    const alerts = [
      makeAlert(30, [ashdodZone]),
      makeAlert(90, [ashdodZone]),
    ];
    const result20 = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 20,
      alerts,
      currentTime: now,
    });
    const result120 = calculateNapRisk({
      zoneId: ashdodZone,
      napDurationMinutes: 120,
      alerts,
      currentTime: now,
    });
    expect(result120.riskPercent).toBeGreaterThan(result20.riskPercent);
  });
});
