// Pre-alert (cat:14) tracker for Iran missile classification.
// Iran ballistic missiles get ~2 min early warning (cat:14) before impact (cat:1).
// Hezbollah rockets from Lebanon have 0-30s flight time — no early warning possible.
// Any cat:1 within 4 minutes of a cat:14 is definitively Iranian.

interface PreAlertEvent {
  timestamp: Date;
  cities: string[];
  expiresAt: Date;
}

let recentPreAlerts: PreAlertEvent[] = [];

export function registerPreAlert(timestamp: Date, cities: string[]): void {
  recentPreAlerts.push({
    timestamp,
    cities,
    expiresAt: new Date(timestamp.getTime() + 4 * 60 * 1000),
  });
  clearExpiredPreAlerts(timestamp);
}

export function hasRecentPreAlert(currentTime: Date): boolean {
  clearExpiredPreAlerts(currentTime);
  return recentPreAlerts.some((p) => p.expiresAt > currentTime);
}

export function clearExpiredPreAlerts(currentTime: Date = new Date()): void {
  recentPreAlerts = recentPreAlerts.filter((p) => p.expiresAt > currentTime);
}

// For testing
export function resetPreAlerts(): void {
  recentPreAlerts = [];
}
