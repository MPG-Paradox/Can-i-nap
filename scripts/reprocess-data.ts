import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert } from '../src/lib/types';
import { classifyAlertSource } from '../src/lib/zones';
import { resetPreAlerts } from '../src/lib/pre-alert-tracker';

const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

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

function main() {
  const alerts = readAlerts();

  if (alerts.length === 0) {
    console.log('No alerts found in data/alerts.json');
    return;
  }

  // Before stats
  const beforeSources = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of alerts) beforeSources[a.source]++;

  const beforeCats: Record<number, number> = {};
  for (const a of alerts) beforeCats[a.category] = (beforeCats[a.category] || 0) + 1;

  console.log(`Before: ${alerts.length} alerts`);
  console.log(`  Iran: ${beforeSources.iran} (${((beforeSources.iran / alerts.length) * 100).toFixed(1)}%)`);
  console.log(`  Hezbollah: ${beforeSources.hezbollah} (${((beforeSources.hezbollah / alerts.length) * 100).toFixed(1)}%)`);
  console.log(`  Dual: ${beforeSources.dual}`);
  console.log(`  Unknown: ${beforeSources.unknown}`);
  console.log(`  Categories: ${Object.entries(beforeCats).map(([c, n]) => `cat:${c}=${n}`).join(', ')}`);

  // Step 1: Remove ALL cat:13 entries (all clear)
  const removedCat13 = alerts.filter((a) => a.category === 13).length;
  const filtered = alerts.filter((a) => a.category !== 13);

  console.log(`\nRemoved: ${removedCat13} cat:13 "all clear" entries`);

  // Step 2: Sort by timestamp ascending for proper pre-alert correlation
  filtered.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Step 3: Re-classify every remaining alert with the fixed keyword logic
  // Reset pre-alert tracker so we get clean state
  resetPreAlerts();

  for (const alert of filtered) {
    alert.source = classifyAlertSource(
      alert.cities,
      alert.category,
      alert.cities.length,
      new Date(alert.timestamp)
    );
  }

  // Step 4: Sort descending by timestamp (newest first) for storage
  filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Step 5: Write back
  writeAlerts(filtered);

  // After stats
  const afterSources = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of filtered) afterSources[a.source]++;

  const afterCats: Record<number, number> = {};
  for (const a of filtered) afterCats[a.category] = (afterCats[a.category] || 0) + 1;

  const threatAlerts = filtered.filter((a) => a.category === 1 || a.category === 2);
  const preAlerts = filtered.filter((a) => a.category === 14);

  console.log(`\nAfter: ${filtered.length} alerts`);
  console.log(`  Threat alerts (cat:1 + cat:2): ${threatAlerts.length} -- these drive the risk engine`);
  console.log(`  Pre-alerts (cat:14): ${preAlerts.length} -- stored for classification, not for risk`);
  console.log(`\nSource breakdown (all alerts):`);
  console.log(`  Iran:       ${afterSources.iran} (${((afterSources.iran / filtered.length) * 100).toFixed(1)}%)`);
  console.log(`  Hezbollah:  ${afterSources.hezbollah} (${((afterSources.hezbollah / filtered.length) * 100).toFixed(1)}%)`);
  console.log(`  Dual:       ${afterSources.dual} (${((afterSources.dual / filtered.length) * 100).toFixed(1)}%)`);
  console.log(`  Unknown:    ${afterSources.unknown} (${((afterSources.unknown / filtered.length) * 100).toFixed(1)}%)`);

  // Threat-only source breakdown
  const threatSources = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of threatAlerts) threatSources[a.source]++;

  console.log(`\nSource breakdown (threat alerts only):`);
  if (threatAlerts.length > 0) {
    console.log(`  Iran:       ${threatSources.iran} (${((threatSources.iran / threatAlerts.length) * 100).toFixed(1)}%)`);
    console.log(`  Hezbollah:  ${threatSources.hezbollah} (${((threatSources.hezbollah / threatAlerts.length) * 100).toFixed(1)}%)`);
    console.log(`  Dual:       ${threatSources.dual} (${((threatSources.dual / threatAlerts.length) * 100).toFixed(1)}%)`);
    console.log(`  Unknown:    ${threatSources.unknown} (${((threatSources.unknown / threatAlerts.length) * 100).toFixed(1)}%)`);
  }

  // Sanity check
  const hezPct = filtered.length > 0 ? (afterSources.hezbollah / filtered.length) * 100 : 0;
  if (hezPct < 10) {
    console.log(`\nWARNING: Hezbollah percentage is suspiciously low (${hezPct.toFixed(1)}%).`);
    console.log('Classification may still need work for some northern communities.');
  }
}

main();
