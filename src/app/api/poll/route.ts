import { NextResponse } from 'next/server';
import { fetchActiveAlert } from '@/lib/oref-client';
import { classifyAlertSource } from '@/lib/zones';
import { addAlert, getRecentAlerts, toAlert } from '@/lib/alert-store';
import { StoredAlert } from '@/lib/types';
import { registerPreAlert } from '@/lib/pre-alert-tracker';

export const dynamic = 'force-dynamic';

// Lightweight poll — ONLY checks real-time alerts endpoint.
// History sync is handled separately by /api/fetch-history on a slower interval.
export async function GET() {
  const active = await fetchActiveAlert();

  if (!active || !active.data || active.data.length === 0) {
    return NextResponse.json({ status: 'no_active_alert', newAlerts: 0 });
  }

  const id = active.id || Date.now().toString();
  const category = parseInt(active.cat, 10) || 1;

  // Skip "all clear" alerts — not threats
  if (category === 13) {
    return NextResponse.json({ status: 'skipped_cat13', newAlerts: 0 });
  }

  const now = new Date();

  // Get recent alerts for classification context
  const recentStored = getRecentAlerts(0.1); // last ~6 minutes
  const recentAlerts = recentStored.map(toAlert);

  // Register pre-alert if cat:14
  if (category === 14) {
    registerPreAlert(now, active.data);
  }

  const source = classifyAlertSource(
    active.data,
    category,
    active.data.length,
    now,
    recentAlerts
  );

  const storedAlert: StoredAlert = {
    id,
    timestamp: now.toISOString(),
    category,
    title: active.title,
    cities: active.data,
    source,
  };

  addAlert(storedAlert);

  return NextResponse.json({ status: 'alert_stored', alert: storedAlert, newAlerts: 1 });
}
