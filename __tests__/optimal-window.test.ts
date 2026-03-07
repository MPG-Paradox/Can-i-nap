import { findOptimalWindow } from '@/lib/risk';
import { Alert } from '@/lib/types';

function makeAlert(minutesAgo: number, cities: string[]): Alert {
  return {
    id: `test_${minutesAgo}`,
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
    category: 1,
    title: '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
    cities,
    source: 'iran',
  };
}

const testCity = '\u05D0\u05E9\u05D3\u05D5\u05D3 - \u05D0,\u05D1,\u05D3,\u05D4';

describe('findOptimalWindow', () => {
  it('always returns a future start time (>= currentTime)', () => {
    const now = new Date();
    const alerts = [makeAlert(30, [testCity]), makeAlert(120, [testCity])];
    const result = findOptimalWindow(testCity, 30, alerts, now);
    expect(result.startTime.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('never returns a time in the past', () => {
    const now = new Date();
    const alerts: Alert[] = [];
    const result = findOptimalWindow(testCity, 45, alerts, now);
    expect(result.startTime.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('endTime is startTime + duration', () => {
    const now = new Date();
    const result = findOptimalWindow(testCity, 60, [], now);
    const expectedEnd = result.startTime.getTime() + 60 * 60 * 1000;
    expect(result.endTime.getTime()).toBe(expectedEnd);
  });

  it('riskPercent is between 0 and 99', () => {
    const now = new Date();
    const alerts = [makeAlert(5, [testCity]), makeAlert(15, [testCity])];
    const result = findOptimalWindow(testCity, 30, alerts, now);
    expect(result.riskPercent).toBeGreaterThanOrEqual(0);
    expect(result.riskPercent).toBeLessThanOrEqual(99);
  });
});
