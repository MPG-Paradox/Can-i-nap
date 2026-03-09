import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert, OrefHistoryItem } from '../src/lib/types';
import { classifyAlertSource } from '../src/lib/zones';
import { parseIsraelDate } from '../src/lib/parse-israel-date';

const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

const OREF_HEADERS = {
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function readExistingAlerts(): StoredAlert[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAlerts(alerts: StoredAlert[]): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(alerts, null, 2), 'utf-8');
}

function deduplicationKey(alert: StoredAlert): string {
  return `${alert.timestamp}_${alert.cities.sort().join('|')}`;
}

async function fetchOrefHistory(): Promise<OrefHistoryItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json',
      { headers: OREF_HEADERS, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`Oref history API returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    clearTimeout(timeout);
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch Oref history: ${msg}`);
    return [];
  }
}

function parseHistoryItem(item: OrefHistoryItem): StoredAlert | null {
  const cities = typeof item.data === 'string' ? [item.data] : (item.data as unknown as string[]);
  const category = typeof item.category === 'number' ? item.category : parseInt(String(item.category), 10) || 1;

  // Skip "all clear" alerts — not threats
  if (category === 13) return null;

  const parsed = parseIsraelDate(item.alertDate);
  const timestamp = parsed.toISOString();
  const source = classifyAlertSource(cities, category, cities.length, parsed);

  return {
    id: `oref_${parsed.getTime()}_${cities.join('|').slice(0, 30)}`,
    timestamp,
    category,
    title: item.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
    cities,
    source,
  };
}

async function main() {
  console.log('Fetching Oref 24h alert history...\n');

  const historyItems = await fetchOrefHistory();

  if (historyItems.length === 0) {
    console.log('No alerts returned from Oref history API.');
    console.log('This may be because:');
    console.log('  - You are not on an Israeli IP (API is geo-blocked)');
    console.log('  - There are currently no alerts in the last 24h');
    console.log('  - The API is temporarily unavailable\n');
    return;
  }

  console.log(`Received ${historyItems.length} alerts from Oref history API`);

  // Parse all items, filtering out cat:13
  const newAlerts: StoredAlert[] = [];
  let skippedCat13 = 0;
  for (const item of historyItems) {
    const alert = parseHistoryItem(item);
    if (alert) {
      newAlerts.push(alert);
    } else {
      skippedCat13++;
    }
  }

  if (skippedCat13 > 0) {
    console.log(`Skipped ${skippedCat13} cat:13 "all clear" entries`);
  }

  // Load existing and deduplicate
  const existing = readExistingAlerts();
  const existingKeys = new Set(existing.map(deduplicationKey));

  let addedCount = 0;
  for (const alert of newAlerts) {
    const key = deduplicationKey(alert);
    if (!existingKeys.has(key)) {
      existing.push(alert);
      existingKeys.add(key);
      addedCount++;
    }
  }

  // Sort descending by timestamp
  existing.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  writeAlerts(existing);

  // Stats
  const sources = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of existing) sources[a.source]++;

  console.log(`\nResults:`);
  console.log(`  New alerts added: ${addedCount}`);
  console.log(`  Total alerts in store: ${existing.length}`);
  console.log(`  Date range: ${existing[existing.length - 1]?.timestamp ?? 'N/A'} to ${existing[0]?.timestamp ?? 'N/A'}`);
  console.log(`\nSource breakdown:`);
  console.log(`  Iran:       ${sources.iran}`);
  console.log(`  Hezbollah:  ${sources.hezbollah}`);
  console.log(`  Dual:       ${sources.dual}`);
  console.log(`  Unknown:    ${sources.unknown}`);
}

main().catch(console.error);
