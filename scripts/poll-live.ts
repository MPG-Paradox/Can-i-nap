import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert, OrefHistoryItem } from '../src/lib/types';
import { classifyAlertSource } from '../src/lib/zones';

const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

const OREF_HEADERS = {
  'Referer': 'https://www.oref.org.il/',
  'X-Requested-With': 'XMLHttpRequest',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

function readAlerts(): StoredAlert[] {
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

function addAlertToStore(alert: StoredAlert): boolean {
  const existing = readAlerts();
  const existingKeys = new Set(
    existing.map((a) => `${a.timestamp}_${a.cities.sort().join('|')}`)
  );
  const key = `${alert.timestamp}_${alert.cities.sort().join('|')}`;

  if (existingKeys.has(key)) return false;

  const updated = [alert, ...existing].slice(0, 10000);
  writeAlerts(updated);
  return true;
}

let lastAlertId: string | null = null;
let pollCount = 0;
let alertsDetected = 0;
let historyAlertsAdded = 0;

async function pollRealTime() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/alert/alerts.json',
      { headers: OREF_HEADERS, signal: controller.signal }
    );
    clearTimeout(timeout);

    const text = await response.text();

    if (!text || text.trim() === '' || text.trim() === '[]') {
      return;
    }

    const data = JSON.parse(text);

    if (data.id === lastAlertId) return;
    lastAlertId = data.id;

    const cities: string[] = Array.isArray(data.data) ? data.data : [data.data];
    const category = parseInt(data.cat, 10) || 1;

    // Skip "all clear" alerts
    if (category === 13) return;

    const source = classifyAlertSource(cities, category, cities.length, new Date());

    const alert: StoredAlert = {
      id: data.id || `${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      title: data.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
      cities,
      source,
    };

    const added = addAlertToStore(alert);
    if (added) {
      alertsDetected++;
      const sourceLabel = source === 'iran' ? 'IRAN' : source === 'hezbollah' ? 'HEZBOLLAH' : source === 'dual' ? 'DUAL' : 'UNKNOWN';
      const catLabel = category === 14 ? ' [PRE-ALERT]' : category === 1 ? '' : ` [cat:${category}]`;
      const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
      console.log(`[${time}] ${sourceLabel}${catLabel} -- ${cities.join(', ')}`);
    }
  } catch {
    // Silently fail — will retry in 3 seconds
  }

  pollCount++;
}

async function pollHistory() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      'https://www.oref.org.il/WarningMessages/History/AlertsHistory.json',
      { headers: OREF_HEADERS, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return;

    const data: OrefHistoryItem[] = await response.json();
    if (!Array.isArray(data)) return;

    let newCount = 0;
    for (const item of data) {
      const cities = typeof item.data === 'string' ? [item.data] : (item.data as unknown as string[]);
      const category = typeof item.category === 'number' ? item.category : parseInt(String(item.category), 10) || 1;

      // Skip "all clear" alerts
      if (category === 13) continue;

      const timestamp = new Date(item.alertDate).toISOString();
      const source = classifyAlertSource(cities, category, cities.length, new Date(item.alertDate));

      const alert: StoredAlert = {
        id: `hist_${new Date(item.alertDate).getTime()}_${cities.join('|').slice(0, 20)}`,
        timestamp,
        category,
        title: item.title || '\u05D9\u05E8\u05D9 \u05E8\u05E7\u05D8\u05D5\u05EA \u05D5\u05D8\u05D9\u05DC\u05D9\u05DD',
        cities,
        source,
      };

      const added = addAlertToStore(alert);
      if (added) newCount++;
    }

    if (newCount > 0) {
      historyAlertsAdded += newCount;
      const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
      console.log(`[${time}] History sync: ${newCount} new alerts`);
    }
  } catch {
    // Silently fail
  }
}

function printStatus() {
  const existing = readAlerts();
  const time = new Date().toLocaleTimeString('he-IL', { hour12: false });
  console.log(`[${time}] Status: ${existing.length} total alerts | ${alertsDetected} detected live | ${historyAlertsAdded} from history | ${pollCount} polls`);
}

// Main entry
console.log('Starting live alert poller...');
console.log('  Polling real-time API every 3 seconds');
console.log('  Polling history API every 60 seconds');
console.log('  Status report every 5 minutes');
console.log('  Press Ctrl+C to stop\n');

const initial = readAlerts();
console.log(`Current alert store: ${initial.length} alerts\n`);

setInterval(pollRealTime, 3000);
setInterval(pollHistory, 60000);
setInterval(printStatus, 5 * 60 * 1000);

pollRealTime();
pollHistory();

process.on('SIGINT', () => {
  console.log('\nStopping poller...');
  const final = readAlerts();
  console.log(`Final alert count: ${final.length}`);
  console.log(`Live alerts detected: ${alertsDetected}`);
  console.log(`History alerts added: ${historyAlertsAdded}`);
  process.exit(0);
});
