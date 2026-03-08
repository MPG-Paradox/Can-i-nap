import { NextResponse } from 'next/server';
import { fetchArchiveAlerts } from '@/lib/oref-client';
import { classifyAlertSource } from '@/lib/zones';
import { addAlert, getAlerts } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

// GET /api/fetch-history
// Fetches from the WORKING archive endpoint (alerts-history.oref.org.il)
// Called on app startup and every 5 minutes to stay current.
export async function GET() {
  try {
    const today = new Date();
    const startDate = '28.02.2026'; // War start
    const endDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const data = await fetchArchiveAlerts(startDate, endDate);
    if (data.length === 0) {
      return NextResponse.json({ status: 'unavailable', newAlerts: 0 });
    }

    const existing = getAlerts();
    const existingKeys = new Set(
      existing.map((a) => `${a.timestamp}_${a.cities.sort().join('|')}`)
    );

    let newAlerts = 0;
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;

      const rawDate = obj.alertDate || obj.date || obj.timestamp;
      if (!rawDate) continue;
      const timestamp = new Date(String(rawDate));
      if (isNaN(timestamp.getTime())) continue;

      let cities: string[];
      const rawCities = obj.data || obj.cities || obj.areas;
      if (Array.isArray(rawCities)) {
        cities = rawCities.map(String);
      } else if (typeof rawCities === 'string') {
        cities = [rawCities];
      } else {
        continue;
      }

      const rawCat = obj.category || obj.cat;
      const category = rawCat ? parseInt(String(rawCat), 10) || 1 : 1;

      // Skip "all clear" alerts
      if (category === 13) continue;

      const key = `${timestamp.toISOString()}_${cities.sort().join('|')}`;
      if (existingKeys.has(key)) continue;

      const source = classifyAlertSource(cities, category, cities.length, timestamp);
      const id = String(obj.id || `archive_${timestamp.getTime()}_${cities.join('|').slice(0, 20)}`);

      addAlert({
        id,
        timestamp: timestamp.toISOString(),
        category,
        title: String(obj.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD'),
        cities,
        source,
      });
      existingKeys.add(key);
      newAlerts++;
    }

    return NextResponse.json({ status: 'ok', newAlerts, total: existing.length + newAlerts });
  } catch {
    return NextResponse.json({ status: 'unavailable', newAlerts: 0 });
  }
}
