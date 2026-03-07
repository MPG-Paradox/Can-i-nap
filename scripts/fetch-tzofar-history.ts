import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert } from '../src/lib/types';
import { classifyAlertSource } from '../src/lib/zones';

const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

// War start date
const WAR_START = '2026-02-28';

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

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDotDate(d: Date): string {
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

interface FetchResult {
  alerts: StoredAlert[];
  source: string;
}

// Generic alert parser — handles multiple response formats
function parseGenericAlert(item: unknown): StoredAlert | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;

  const rawDate = obj.alertDate || obj.date || obj.timestamp || obj.time || obj.created_at;
  if (!rawDate) return null;
  const timestamp = new Date(String(rawDate));
  if (isNaN(timestamp.getTime())) return null;

  let cities: string[];
  const rawCities = obj.data || obj.cities || obj.areas || obj.city;
  if (Array.isArray(rawCities)) {
    cities = rawCities.map(String);
  } else if (typeof rawCities === 'string') {
    cities = [rawCities];
  } else {
    return null;
  }

  const rawCat = obj.category || obj.cat || obj.type;
  const category = rawCat ? parseInt(String(rawCat), 10) || 1 : 1;

  // Skip "all clear" alerts
  if (category === 13) return null;

  const title = String(obj.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD');
  const id = String(obj.id || `tzofar_${timestamp.getTime()}_${cities.join('|').slice(0, 20)}`);

  return {
    id,
    timestamp: timestamp.toISOString(),
    category,
    title,
    cities,
    source: classifyAlertSource(cities, category, cities.length, timestamp),
  };
}

// Approach 1: Tzofar / tzevaadom.co.il API
async function tryTzofar(): Promise<FetchResult> {
  const endpoints = [
    `https://api.tzevaadom.co.il/alerts-history?from=${WAR_START}&to=${formatDate(new Date())}`,
    `https://www.tzevaadom.co.il/alerts-history/api?from=${WAR_START}`,
    `https://api.tzevaadom.co.il/history?fromDate=${WAR_START}`,
    `https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&fromDate=${WAR_START.replace(/-/g, '.')}&toDate=${formatDate(new Date()).replace(/-/g, '.')}`,
  ];

  for (const url of endpoints) {
    try {
      console.log(`  Trying: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: { ...OREF_HEADERS, 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) { console.log(`    -> ${response.status} ${response.statusText}`); continue; }

      const text = await response.text();
      if (!text || text.trim().length < 10) { console.log('    -> Empty response'); continue; }

      let data: unknown;
      try { data = JSON.parse(text); } catch { console.log('    -> Not valid JSON'); continue; }

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`    -> Response is ${Array.isArray(data) ? 'empty array' : typeof data}`);
        continue;
      }

      console.log(`    -> Got ${data.length} items!`);

      const alerts: StoredAlert[] = [];
      for (const item of data) {
        try {
          const alert = parseGenericAlert(item);
          if (alert) alerts.push(alert);
        } catch { /* skip malformed */ }
      }

      if (alerts.length > 0) return { alerts, source: url };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`    -> Error: ${msg}`);
    }
  }

  return { alerts: [], source: 'none' };
}

// Approach 2: Oref history day-by-day to avoid pagination limits
async function tryOrefDayByDay(): Promise<FetchResult> {
  console.log('  Fetching Oref history day by day...');

  const startDate = new Date(WAR_START);
  const endDate = new Date();
  const allAlerts: StoredAlert[] = [];

  let day = new Date(startDate);
  while (day <= endDate) {
    const dayEnd = addDays(day, 1);
    const fromStr = formatDotDate(day);
    const toStr = formatDotDate(dayEnd);

    const urls = [
      `https://alerts-history.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&fromDate=${fromStr}&toDate=${toStr}`,
      `https://www.oref.org.il/WarningMessages/History/AlertsHistory.json?fromDate=${formatDate(day)}&toDate=${formatDate(dayEnd)}`,
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { headers: OREF_HEADERS, signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) continue;

        const text = await response.text();
        let data: unknown;
        try { data = JSON.parse(text); } catch { continue; }

        if (!Array.isArray(data) || data.length === 0) continue;

        let dayCount = 0;
        for (const item of data) {
          try {
            const alert = parseGenericAlert(item);
            if (alert) { allAlerts.push(alert); dayCount++; }
          } catch { /* skip */ }
        }

        if (dayCount > 0) {
          console.log(`    ${formatDate(day)}: ${dayCount} alerts`);
          break;
        }
      } catch { /* try next url */ }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    day = addDays(day, 1);
  }

  if (allAlerts.length > 0) return { alerts: allAlerts, source: 'oref-day-by-day' };
  return { alerts: [], source: 'none' };
}

// Approach 3: Oref history with date range parameters
async function tryOrefDateRange(): Promise<FetchResult> {
  const dateParams = [
    `?fromDate=${WAR_START}&toDate=${formatDate(new Date())}`,
    `?start=${WAR_START}&end=${formatDate(new Date())}`,
    `?mode=2&fromDate=${WAR_START}`,
  ];

  const baseUrl = 'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json';

  for (const params of dateParams) {
    const url = `${baseUrl}${params}`;
    try {
      console.log(`  Trying: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { headers: OREF_HEADERS, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) { console.log(`    -> ${response.status}`); continue; }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) { console.log('    -> Empty or invalid'); continue; }

      const alerts: StoredAlert[] = [];
      for (const item of data) {
        try {
          const alert = parseGenericAlert(item);
          if (alert) alerts.push(alert);
        } catch { /* skip */ }
      }

      if (alerts.length > 0) {
        console.log(`    -> Got ${alerts.length} threat alerts`);
        return { alerts, source: url };
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`    -> Error: ${msg}`);
    }
  }

  return { alerts: [], source: 'none' };
}

// Approach 4: Oref Pakar AJAX endpoint
async function tryOrefPakar(): Promise<FetchResult> {
  const endpoints = [
    'https://alerts-history.oref.org.il/12481-en/Pakar.aspx/GetAlarmsHistory',
    'https://www.oref.org.il/Shared/Ajax/GetAlarmsHistory.aspx?lang=he&mode=2',
  ];

  for (const url of endpoints) {
    try {
      console.log(`  Trying: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { ...OREF_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromDate: WAR_START.replace(/-/g, '.'),
          toDate: formatDate(new Date()).replace(/-/g, '.'),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) { console.log(`    -> ${response.status}`); continue; }

      const text = await response.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { console.log('    -> Not valid JSON'); continue; }

      const items = Array.isArray(data) ? data
        : Array.isArray((data as Record<string, unknown>)?.d) ? (data as Record<string, unknown>).d as unknown[]
        : Array.isArray((data as Record<string, unknown>)?.result) ? (data as Record<string, unknown>).result as unknown[]
        : null;

      if (!items || items.length === 0) { console.log('    -> Empty or unexpected format'); continue; }

      console.log(`    -> Got ${items.length} items!`);

      const alerts: StoredAlert[] = [];
      for (const item of items) {
        try {
          const alert = parseGenericAlert(item);
          if (alert) alerts.push(alert);
        } catch { /* skip */ }
      }

      if (alerts.length > 0) return { alerts, source: url };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`    -> Error: ${msg}`);
    }
  }

  return { alerts: [], source: 'none' };
}

async function main() {
  console.log(`Fetching historical alert data since ${WAR_START}...\n`);
  console.log('Attempting multiple data sources:\n');

  console.log('1. Tzofar / Tzeva Adom API:');
  let result = await tryTzofar();

  if (result.alerts.length === 0) {
    console.log('\n2. Oref history day-by-day:');
    result = await tryOrefDayByDay();
  }

  if (result.alerts.length === 0) {
    console.log('\n3. Oref history with date range parameters:');
    result = await tryOrefDateRange();
  }

  if (result.alerts.length === 0) {
    console.log('\n4. Oref Pakar AJAX endpoint:');
    result = await tryOrefPakar();
  }

  if (result.alerts.length === 0) {
    console.log('\n---');
    console.log('Could not fetch historical data from any source.');
    console.log('This is expected if you are not on an Israeli IP.');
    console.log('The Oref and Tzofar APIs are geo-blocked to Israel.\n');
    return;
  }

  const existing = readExistingAlerts();
  const existingKeys = new Set(existing.map(deduplicationKey));

  let addedCount = 0;
  for (const alert of result.alerts) {
    const key = deduplicationKey(alert);
    if (!existingKeys.has(key)) {
      existing.push(alert);
      existingKeys.add(key);
      addedCount++;
    }
  }

  existing.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  writeAlerts(existing);

  const sources = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of existing) sources[a.source]++;
  const uniqueCities = new Set(existing.flatMap((a) => a.cities));

  console.log(`\nSource: ${result.source}`);
  console.log(`\nResults:`);
  console.log(`  Historical alerts fetched: ${result.alerts.length}`);
  console.log(`  New alerts added: ${addedCount}`);
  console.log(`  Total alerts in store: ${existing.length}`);
  console.log(`  Date range: ${existing[existing.length - 1]?.timestamp ?? 'N/A'} to ${existing[0]?.timestamp ?? 'N/A'}`);
  console.log(`  Unique cities affected: ${uniqueCities.size}`);
  console.log(`\nSource breakdown:`);
  console.log(`  Iran:       ${sources.iran}`);
  console.log(`  Hezbollah:  ${sources.hezbollah}`);
  console.log(`  Dual:       ${sources.dual}`);
  console.log(`  Unknown:    ${sources.unknown}`);
}

main().catch(console.error);
