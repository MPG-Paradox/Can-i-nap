// Server-side cron: fetches alerts from both Oref endpoints every 2 minutes.
// Runs independently of browser visitors — keeps data/alerts.json fresh.
// Usage: npx tsx scripts/cron-fetch.ts
// PM2:   pm2 start ecosystem.config.js --only caninap-cron

import { fetchArchiveAlerts, fetchAlertHistory } from '../src/lib/oref-client';
import { classifyAlertSource } from '../src/lib/zones';
import { addAlertsBatch, getAlerts } from '../src/lib/alert-store';
import { StoredAlert } from '../src/lib/types';

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

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
    const timestamp = new Date(String(rawDate));
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

async function fetchAndStore() {
  const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
  try {
    const existing = getAlerts();
    const existingKeys = new Set(
      existing.map((a) => `${a.timestamp}_${a.cities.sort().join('|')}`)
    );

    const allNew: StoredAlert[] = [];

    // Source 1: Archive endpoint (full war history)
    const today = new Date();
    const startDate = '28.02.2026';
    const endDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;

    const archiveData = await fetchArchiveAlerts(startDate, endDate);
    if (archiveData.length > 0) {
      allNew.push(...processRawAlerts(archiveData, existingKeys));
    }

    // Source 2: AlertsHistory.json (24h fallback)
    const historyData = await fetchAlertHistory();
    if (historyData.length > 0) {
      allNew.push(...processRawAlerts(historyData as unknown[], existingKeys));
    }

    const added = allNew.length > 0 ? addAlertsBatch(allNew) : 0;
    const total = getAlerts().length;

    if (added > 0) {
      console.log(`[${time}] +${added} new alerts (total: ${total})`);
    } else {
      console.log(`[${time}] No new alerts (total: ${total})`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${time}] Error: ${msg}`);
  }
}

// Main
console.log('Starting cron-fetch (archive + history sync every 2 minutes)');
console.log(`Current store: ${getAlerts().length} alerts\n`);

fetchAndStore();
setInterval(fetchAndStore, INTERVAL_MS);

process.on('SIGINT', () => {
  console.log('\nStopping cron-fetch.');
  process.exit(0);
});
