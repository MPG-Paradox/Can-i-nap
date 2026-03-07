import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert } from '../src/lib/types';

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

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('he-IL', { hour12: false, timeZone: 'Asia/Jerusalem' });
}

function main() {
  const alerts = readAlerts();

  console.log('='.repeat(50));
  console.log(' CAN I NAP? -- Data Validation Report');
  console.log('='.repeat(50));
  console.log();

  if (alerts.length === 0) {
    console.log('No alerts found in data/alerts.json');
    console.log('Run `npm run seed` to add seed data or `npm run load-data` to fetch real data.');
    return;
  }

  // 1. Total count
  console.log(`Total alerts: ${alerts.length.toLocaleString()}`);

  // 2. Date range
  const timestamps = alerts
    .map((a) => new Date(a.timestamp).getTime())
    .filter((t) => !isNaN(t));
  const oldest = new Date(Math.min(...timestamps));
  const newest = new Date(Math.max(...timestamps));
  const daysCovered = (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24);

  console.log(`Date range: ${formatTimestamp(oldest.toISOString())} -- ${formatTimestamp(newest.toISOString())}`);
  console.log(`Days covered: ${daysCovered.toFixed(1)}`);
  console.log(`Avg alerts/day: ${(alerts.length / Math.max(daysCovered, 1)).toFixed(0)}`);

  // 3. Category breakdown (FIRST — shows filtering status)
  const categories: Record<number, number> = {};
  for (const a of alerts) categories[a.category] = (categories[a.category] || 0) + 1;

  const catLabels: Record<number, string> = {
    1: 'Rockets & missiles',
    2: 'Hostile aircraft',
    6: 'Hostile aircraft (alt)',
    13: 'All clear (should be 0)',
    14: 'Pre-alert / early warning',
  };

  const threatCount = (categories[1] || 0) + (categories[2] || 0);
  const preAlertCount = categories[14] || 0;
  const allClearCount = categories[13] || 0;

  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(categories)) {
    const label = catLabels[Number(cat)] || `Category ${cat}`;
    console.log(`  ${label.padEnd(30)} ${count.toLocaleString().padStart(6)}`);
  }
  console.log(`  ${'---'.padEnd(30)} ${'---'.padStart(6)}`);
  console.log(`  ${'Threat alerts (risk engine)'.padEnd(30)} ${threatCount.toLocaleString().padStart(6)}`);
  console.log(`  ${'Pre-alerts (classification)'.padEnd(30)} ${preAlertCount.toLocaleString().padStart(6)}`);

  if (allClearCount > 0) {
    console.log(`\n  WARNING: ${allClearCount} cat:13 "all clear" entries still present!`);
    console.log('  Run `npm run reprocess` to remove them.');
  }

  // 4. Source breakdown — based on threat alerts only
  const threatAlerts = alerts.filter((a) => a.category === 1 || a.category === 2);
  const threatSources: Record<string, number> = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of threatAlerts) threatSources[a.source] = (threatSources[a.source] || 0) + 1;

  console.log('\nSource breakdown (threat alerts only):');
  const base = threatAlerts.length || 1;
  for (const [source, count] of Object.entries(threatSources)) {
    const pct = ((count / base) * 100).toFixed(1);
    const label = source.charAt(0).toUpperCase() + source.slice(1);
    console.log(`  ${label.padEnd(12)} ${count.toLocaleString().padStart(6)} (${pct}%)`);
  }

  // Source breakdown — all alerts
  const allSources: Record<string, number> = { iran: 0, hezbollah: 0, dual: 0, unknown: 0 };
  for (const a of alerts) allSources[a.source] = (allSources[a.source] || 0) + 1;

  console.log('\nSource breakdown (all alerts):');
  for (const [source, count] of Object.entries(allSources)) {
    const pct = ((count / alerts.length) * 100).toFixed(1);
    const label = source.charAt(0).toUpperCase() + source.slice(1);
    console.log(`  ${label.padEnd(12)} ${count.toLocaleString().padStart(6)} (${pct}%)`);
  }

  // Sanity check
  const hezPct = threatAlerts.length > 0 ? (threatSources.hezbollah / threatAlerts.length) * 100 : 0;
  if (hezPct < 10 && threatAlerts.length > 50) {
    console.log(`\n  WARNING: Hezbollah threat alerts are only ${hezPct.toFixed(1)}% — classification may be broken.`);
  }

  // 5. Top 10 most-alerted cities (threat alerts only)
  const cityCounts: Record<string, number> = {};
  for (const a of threatAlerts) {
    for (const city of a.cities) {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    }
  }
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\nTop 10 cities (threat alerts):');
  topCities.forEach(([city, count], i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${city.padEnd(30)} ${count.toLocaleString().padStart(5)} alerts`);
  });

  // 6. Unique cities
  const uniqueCities = new Set(alerts.flatMap((a) => a.cities));
  console.log(`\nUnique cities affected: ${uniqueCities.size}`);

  // 7. Peak hours (threat alerts only)
  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourCounts[h] = 0;
  for (const a of threatAlerts) {
    const d = new Date(a.timestamp);
    if (!isNaN(d.getTime())) {
      const israelHour = (d.getUTCHours() + 2) % 24;
      hourCounts[israelHour]++;
    }
  }

  const sortedHours = Object.entries(hourCounts)
    .map(([h, c]) => ({ hour: Number(h), count: c }))
    .sort((a, b) => b.count - a.count);

  console.log('\nPeak hours (Israel time, threat alerts):');
  sortedHours.slice(0, 5).forEach(({ hour, count }) => {
    const hStr = `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
    console.log(`  ${hStr} -- ${count.toLocaleString().padStart(5)} alerts`);
  });
  console.log('  ...');
  sortedHours.slice(-2).forEach(({ hour, count }) => {
    const hStr = `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`;
    console.log(`  ${hStr} -- ${count.toLocaleString().padStart(5)} alerts (quietest)`);
  });

  // 8. Data gaps > 12 hours (threat alerts only)
  const threatTimestamps = threatAlerts
    .map((a) => new Date(a.timestamp).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);

  const gaps: { from: Date; to: Date; hours: number }[] = [];
  for (let i = 1; i < threatTimestamps.length; i++) {
    const gapMs = threatTimestamps[i] - threatTimestamps[i - 1];
    const gapHours = gapMs / (1000 * 60 * 60);
    if (gapHours > 12) {
      gaps.push({
        from: new Date(threatTimestamps[i - 1]),
        to: new Date(threatTimestamps[i]),
        hours: gapHours,
      });
    }
  }

  console.log(`\nData gaps > 12h: ${gaps.length === 0 ? 'None' : gaps.length}`);
  for (const gap of gaps) {
    console.log(`  ${formatTimestamp(gap.from.toISOString())} -- ${formatTimestamp(gap.to.toISOString())} (${gap.hours.toFixed(1)}h)`);
  }

  // 9. Malformed entries
  let malformed = 0;
  for (const a of alerts) {
    if (!a.id || !a.timestamp || !Array.isArray(a.cities) || a.cities.length === 0) malformed++;
    if (isNaN(new Date(a.timestamp).getTime())) malformed++;
  }
  console.log(`Malformed entries: ${malformed}`);

  // 10. Duplicate check
  const keys = new Set<string>();
  let dupes = 0;
  for (const a of alerts) {
    const key = `${a.timestamp}_${a.cities.sort().join('|')}`;
    if (keys.has(key)) dupes++;
    keys.add(key);
  }
  console.log(`Duplicates: ${dupes}`);

  // 11. Unknown source rate (threat alerts)
  const unknownRate = threatAlerts.length > 0 ? ((threatSources.unknown || 0) / threatAlerts.length) * 100 : 0;
  console.log(`Unknown source rate (threats): ${unknownRate.toFixed(1)}%`);

  // Overall quality
  console.log('\n' + '-'.repeat(50));
  const issues: string[] = [];
  if (malformed > 0) issues.push(`${malformed} malformed entries`);
  if (dupes > 0) issues.push(`${dupes} duplicates`);
  if (unknownRate > 5) issues.push(`${unknownRate.toFixed(1)}% unknown sources`);
  if (gaps.length > 0) issues.push(`${gaps.length} data gaps > 12h`);
  if (threatAlerts.length < 100) issues.push(`Only ${threatAlerts.length} threat alerts (thin data)`);
  if (allClearCount > 0) issues.push(`${allClearCount} cat:13 entries not removed`);
  if (hezPct < 10 && threatAlerts.length > 50) issues.push(`Hezbollah at ${hezPct.toFixed(1)}% — classification suspect`);

  if (issues.length === 0) {
    console.log('Data quality: GOOD');
  } else {
    console.log(`Data quality: ${issues.length <= 2 ? 'FAIR' : 'NEEDS ATTENTION'}`);
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
  }
}

main();
