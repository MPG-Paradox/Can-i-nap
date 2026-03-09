import { NextResponse } from 'next/server';
import { fetchArchiveAlerts, fetchAlertHistory } from '@/lib/oref-client';
import { classifyAlertSource } from '@/lib/zones';
import { addAlertsBatch, getAlerts } from '@/lib/alert-store';
import { StoredAlert } from '@/lib/types';
import { parseIsraelDate } from '@/lib/parse-israel-date';

export const dynamic = 'force-dynamic';

function processRawAlerts(
  data: unknown[],
  existingKeys: Set<string>
): StoredAlert[] {
  const batch: StoredAlert[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;

    const rawDate = obj.alertDate ?? obj.date ?? obj.timestamp;
    if (!rawDate) continue;
    const timestamp = parseIsraelDate(String(rawDate));
    if (isNaN(timestamp.getTime())) continue;

    let cities: string[];
    const rawCities = obj.data ?? obj.cities ?? obj.areas;
    if (Array.isArray(rawCities)) {
      cities = rawCities.map(String);
    } else if (typeof rawCities === 'string') {
      cities = [rawCities];
    } else {
      continue;
    }

    const rawCat = obj.category ?? obj.cat;
    const category = rawCat != null ? parseInt(String(rawCat), 10) : 1;
    if (isNaN(category)) continue;

    // Skip "all clear" alerts
    if (category === 13) continue;

    const key = `${timestamp.toISOString()}_${cities.sort().join('|')}`;
    if (existingKeys.has(key)) continue;

    const source = classifyAlertSource(cities, category, cities.length, timestamp);
    const id = String(obj.id || `archive_${timestamp.getTime()}_${cities.join('|').slice(0, 20)}`);

    batch.push({
      id,
      timestamp: timestamp.toISOString(),
      category,
      title: String(obj.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD'),
      cities,
      source,
    });
    existingKeys.add(key);
  }
  return batch;
}

// GET /api/fetch-history
// Tries both endpoints: archive (full war history) + AlertsHistory.json (24h fallback)
// Called on app startup and every 5 minutes to stay current.
export async function GET() {
  try {
    const existing = getAlerts();
    const existingKeys = new Set(
      existing.map((a) => `${a.timestamp}_${a.cities.sort().join('|')}`)
    );

    // Collect all new alerts from both sources, then write once
    const allNew: StoredAlert[] = [];

    // Source 1: Archive endpoint (full war history, works best but might be delayed)
    const today = new Date();
    const startDate = '28.02.2026'; // War start
    const endDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const archiveData = await fetchArchiveAlerts(startDate, endDate);
    if (archiveData.length > 0) {
      allNew.push(...processRawAlerts(archiveData, existingKeys));
    }

    // Source 2: AlertsHistory.json (24h, might return 403 but worth trying)
    const historyData = await fetchAlertHistory();
    if (historyData.length > 0) {
      allNew.push(...processRawAlerts(historyData as unknown[], existingKeys));
    }

    // Single batch write — avoids O(n²) per-alert I/O
    const totalNew = allNew.length > 0 ? addAlertsBatch(allNew) : 0;

    return NextResponse.json({ status: 'ok', newAlerts: totalNew, total: getAlerts().length });
  } catch {
    return NextResponse.json({ status: 'unavailable', newAlerts: 0 });
  }
}
