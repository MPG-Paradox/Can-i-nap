import { NextResponse } from 'next/server';
import { fetchAlertHistory } from '@/lib/oref-client';
import { classifyAlertSource } from '@/lib/zones';
import { addAlert, getAlerts } from '@/lib/alert-store';

export const dynamic = 'force-dynamic';

// GET /api/fetch-history
// Fetches from the Oref 24h history endpoint and stores new alerts.
// Called once on app startup to fill any gaps.
export async function GET() {
  try {
    const history = await fetchAlertHistory();
    const existing = getAlerts();
    const existingKeys = new Set(
      existing.map((a) => `${a.timestamp}_${a.cities.join(',')}`)
    );

    let newAlerts = 0;
    for (const item of history) {
      // Skip "all clear" alerts
      if (item.category === 13) continue;

      const cities = [item.data];
      const key = `${new Date(item.alertDate).toISOString()}_${cities.join(',')}`;

      if (!existingKeys.has(key)) {
        const source = classifyAlertSource(
          cities,
          item.category,
          cities.length,
          new Date(item.alertDate)
        );
        addAlert({
          id: `hist_${new Date(item.alertDate).getTime()}`,
          timestamp: new Date(item.alertDate).toISOString(),
          category: item.category,
          title: item.title,
          cities,
          source,
        });
        newAlerts++;
      }
    }

    return NextResponse.json({ status: 'ok', newAlerts });
  } catch {
    // Silently return — API unavailable is normal (geo-blocked, etc.)
    return NextResponse.json({ status: 'unavailable', newAlerts: 0 });
  }
}
