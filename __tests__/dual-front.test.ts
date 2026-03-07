import { isDualFrontActive } from '@/lib/dual-front';
import { Alert } from '@/lib/types';

const now = new Date();

function makeAlert(
  minutesAgo: number,
  source: 'iran' | 'hezbollah' | 'dual' | 'unknown'
): Alert {
  return {
    id: `test_${minutesAgo}_${source}`,
    timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000),
    category: 1,
    title: 'ירי רקטות וטילים',
    cities: [],
    source,
  };
}

describe('isDualFrontActive', () => {
  it('returns calm with no alerts', () => {
    const status = isDualFrontActive([], now);
    expect(status.escalationLevel).toBe('calm');
    expect(status.riskMultiplier).toBe(1.0);
    expect(status.dualFrontActive).toBe(false);
  });

  it('returns single_front with only northern alerts', () => {
    const alerts = [makeAlert(5, 'hezbollah'), makeAlert(10, 'hezbollah')];
    const status = isDualFrontActive(alerts, now);
    expect(status.escalationLevel).toBe('single_front');
    expect(status.hezbollahFront.active).toBe(true);
    expect(status.iranFront.active).toBe(false);
  });

  it('returns single_front with only central alerts', () => {
    const alerts = [makeAlert(5, 'iran'), makeAlert(10, 'iran')];
    const status = isDualFrontActive(alerts, now);
    expect(status.escalationLevel).toBe('single_front');
    expect(status.iranFront.active).toBe(true);
    expect(status.hezbollahFront.active).toBe(false);
  });

  it('returns dual_front with both northern and central alerts', () => {
    const alerts = [
      makeAlert(5, 'iran'),
      makeAlert(10, 'hezbollah'),
    ];
    const status = isDualFrontActive(alerts, now);
    expect(status.escalationLevel).toBe('dual_front');
    expect(status.riskMultiplier).toBe(1.5);
    expect(status.dualFrontActive).toBe(true);
  });

  it('returns heavy_barrage_both with 5+ from each front', () => {
    const alerts = [
      ...Array.from({ length: 5 }, (_, i) => makeAlert(i + 1, 'iran')),
      ...Array.from({ length: 5 }, (_, i) => makeAlert(i + 1, 'hezbollah')),
    ];
    const status = isDualFrontActive(alerts, now);
    expect(status.escalationLevel).toBe('heavy_barrage_both');
    expect(status.riskMultiplier).toBe(2.5);
  });

  it('returns heavy_barrage with 5+ from one front only', () => {
    const alerts = [
      ...Array.from({ length: 6 }, (_, i) => makeAlert(i + 1, 'iran')),
      makeAlert(5, 'hezbollah'),
    ];
    const status = isDualFrontActive(alerts, now);
    expect(status.escalationLevel).toBe('heavy_barrage');
    expect(status.riskMultiplier).toBe(2.0);
  });

  it('ignores old alerts outside the window', () => {
    const alerts = [makeAlert(60, 'iran'), makeAlert(60, 'hezbollah')];
    const status = isDualFrontActive(alerts, now, 30);
    expect(status.escalationLevel).toBe('calm');
  });
});
