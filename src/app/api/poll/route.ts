import { NextResponse } from 'next/server';
import { fetchActiveAlert, fetchAlertHistory } from '@/lib/oref-client';
import { classifyAlertSource } from '@/lib/zones';
import { addAlert, getAlerts } from '@/lib/alert-store';
import { StoredAlert } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: { realtime: string; history: string } = {
    realtime: 'no_active_alert',
    history: 'skipped',
  };

  // 1. Check real-time alert
  const active = await fetchActiveAlert();
  let storedAlert: StoredAlert | null = null;

  if (active && active.data && active.data.length > 0) {
    const id = active.id || Date.now().toString();
    const source = classifyAlertSource(active.data);

    storedAlert = {
      id,
      timestamp: new Date().toISOString(),
      category: parseInt(active.cat, 10) || 1,
      title: active.title,
      cities: active.data,
      source,
    };

    addAlert(storedAlert);
    results.realtime = 'alert_stored';
  }

  // 2. Sync history
  const history = await fetchAlertHistory();
  const existing = getAlerts();
  const existingKeys = new Set(
    existing.map((a) => `${a.timestamp}_${a.cities.join(',')}`)
  );

  let newFromHistory = 0;
  for (const item of history) {
    const cities = [item.data];
    const key = `${new Date(item.alertDate).toISOString()}_${cities.join(',')}`;

    if (!existingKeys.has(key)) {
      const source = classifyAlertSource(cities);
      addAlert({
        id: `hist_${new Date(item.alertDate).getTime()}`,
        timestamp: new Date(item.alertDate).toISOString(),
        category: item.category,
        title: item.title,
        cities,
        source,
      });
      newFromHistory++;
    }
  }

  if (newFromHistory > 0) {
    results.history = `${newFromHistory}_new_alerts_stored`;
  }

  return NextResponse.json({
    status: results.realtime,
    alert: storedAlert,
    historySynced: results.history,
  });
}
