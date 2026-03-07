import { OrefRealTimeResponse, OrefHistoryItem } from './types';

const OREF_HEADERS = {
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function fetchActiveAlert(): Promise<OrefRealTimeResponse | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/alert/alerts.json',
      {
        headers: OREF_HEADERS,
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const text = await response.text();
    if (!text || text.trim() === '' || text.trim() === '[]') {
      return null;
    }

    const parsed = JSON.parse(text) as OrefRealTimeResponse;
    if (parsed && parsed.data && Array.isArray(parsed.data)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch active alert:', error);
    return null;
  }
}

export async function fetchAlertHistory(): Promise<OrefHistoryItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json',
      {
        headers: OREF_HEADERS,
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const data = (await response.json()) as OrefHistoryItem[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch alert history:', error);
    return [];
  }
}
