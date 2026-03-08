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
      // API returned HTML (block page, error page, etc.) — not JSON
      return [];
    }

    const text = await response.text();
    if (!text || text.trim() === '' || text.trim() === '[]') {
      return [];
    }

    const firstChar = text.trim()[0];
    if (firstChar !== '[' && firstChar !== '{') {
      return []; // Not JSON — probably HTML error page
    }

    return JSON.parse(text);
  } catch {
    return []; // Silently fail — API unavailable is normal
  }
}
