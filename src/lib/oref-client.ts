import { OrefRealTimeResponse, OrefHistoryItem } from './types';

const OREF_HEADERS = {
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function fetchActiveAlert(): Promise<OrefRealTimeResponse | null> {
  try {
    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/alert/alerts.json',
      {
        headers: OREF_HEADERS,
        signal: AbortSignal.timeout(5000),
      }
    );

    const text = await response.text();

    // Empty or array-empty = no active alert
    if (!text || text.trim() === '' || text.trim() === '[]') {
      return null;
    }

    // Only parse if it looks like JSON
    const firstChar = text.trim()[0];
    if (firstChar !== '{' && firstChar !== '[') {
      return null; // HTML error/block page — silently ignore
    }

    const parsed = JSON.parse(text) as OrefRealTimeResponse;
    if (parsed && parsed.data && Array.isArray(parsed.data)) {
      return parsed;
    }

    return null;
  } catch {
    return null; // Silently fail — API unavailable is normal
  }
}

// Old 24h endpoint — kept as fallback but usually returns 403
export async function fetchAlertHistory(): Promise<OrefHistoryItem[]> {
  try {
    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json',
      {
        headers: OREF_HEADERS,
        signal: AbortSignal.timeout(5000),
      }
    );

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      return [];
    }

    const text = await response.text();
    if (!text || text.trim() === '' || text.trim() === '[]') {
      return [];
    }

    const firstChar = text.trim()[0];
    if (firstChar !== '[' && firstChar !== '{') {
      return [];
    }

    return JSON.parse(text);
  } catch {
    return [];
  }
}

// Working archive endpoint — fetches full war history
export async function fetchArchiveAlerts(fromDate: string, toDate: string): Promise<unknown[]> {
  try {
    const url = `https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&fromDate=${fromDate}&toDate=${toDate}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000), // Slow endpoint
    });

    const text = await response.text();
    if (!text || text.trim()[0] !== '[') return [];

    return JSON.parse(text);
  } catch {
    return [];
  }
}
