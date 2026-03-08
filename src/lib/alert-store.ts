import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert, Alert } from './types';

// Hardcoded path — not user-controllable
const STORE_PATH = path.join(process.cwd(), 'data', 'alerts.json');
const MAX_ALERTS = 10000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// PRODUCTION TODO: Replace file-based store with Supabase/PostgreSQL database.
// File I/O on every poll is not scalable for concurrent users.

function ensureDir(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getAlerts(): StoredAlert[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];

    // Check file size to prevent memory issues
    const stats = fs.statSync(STORE_PATH);
    if (stats.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`alerts.json exceeds ${MAX_FILE_SIZE_BYTES} bytes, trimming...`);
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const trimmed = parsed.slice(0, MAX_ALERTS);
        fs.writeFileSync(STORE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
        return trimmed;
      }
      return [];
    }

    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupted or invalid JSON — return empty array
    return [];
  }
}

export function addAlert(alert: StoredAlert): void {
  ensureDir();
  const existing = getAlerts();

  // Deduplicate by id
  const ids = new Set(existing.map((a) => a.id));
  if (ids.has(alert.id)) return;

  // Validate timestamp is a valid date string
  if (isNaN(new Date(alert.timestamp).getTime())) return;

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
