import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert, Alert } from './types';

const STORE_PATH = path.join(process.cwd(), 'data', 'alerts.json');
const MAX_ALERTS = 10000;

function ensureDir(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getAlerts(): StoredAlert[] {
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

export function addAlert(alert: StoredAlert): void {
  ensureDir();
  const existing = getAlerts();

  // Deduplicate by id
  const ids = new Set(existing.map((a) => a.id));
  if (ids.has(alert.id)) return;

  const updated = [alert, ...existing].slice(0, MAX_ALERTS);
  fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
}

export function getRecentAlerts(hours: number): StoredAlert[] {
  const alerts = getAlerts();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  return alerts.filter((a) => a.timestamp >= cutoff);
}

export function toAlert(stored: StoredAlert): Alert {
  return {
    ...stored,
    timestamp: new Date(stored.timestamp),
  };
}

export function toStoredAlert(alert: Alert): StoredAlert {
  return {
    ...alert,
    timestamp: alert.timestamp.toISOString(),
  };
}
