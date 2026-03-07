import { registerPreAlert, hasRecentPreAlert, clearExpiredPreAlerts, resetPreAlerts } from '@/lib/pre-alert-tracker';

beforeEach(() => {
  resetPreAlerts();
});

describe('pre-alert tracker', () => {
  it('reports no pre-alert when empty', () => {
    expect(hasRecentPreAlert(new Date())).toBe(false);
  });

  it('reports active pre-alert within 4 minute window', () => {
    const now = new Date();
    registerPreAlert(now, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1']);

    // 2 minutes later — still active
    const twoMinLater = new Date(now.getTime() + 2 * 60 * 1000);
    expect(hasRecentPreAlert(twoMinLater)).toBe(true);
  });

  it('reports no pre-alert after 4 minutes', () => {
    const now = new Date();
    registerPreAlert(now, ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1']);

    // 5 minutes later — expired
    const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000);
    expect(hasRecentPreAlert(fiveMinLater)).toBe(false);
  });

  it('cleans up expired entries', () => {
    const now = new Date();
    registerPreAlert(now, ['city1']);
    registerPreAlert(new Date(now.getTime() + 1000), ['city2']);

    // 5 minutes later — both expired
    const later = new Date(now.getTime() + 5 * 60 * 1000);
    clearExpiredPreAlerts(later);
    expect(hasRecentPreAlert(later)).toBe(false);
  });
});
