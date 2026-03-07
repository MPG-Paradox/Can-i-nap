import * as fs from 'fs';
import * as path from 'path';
import { StoredAlert, AlertSource } from '../src/lib/types';
import { classifyAlertSource } from '../src/lib/zones';

const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.csv');
const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

function parseSeedCSV(): StoredAlert[] {
  const raw = fs.readFileSync(SEED_PATH, 'utf-8');
  const lines = raw.trim().split('\n');
  // Skip header
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    // CSV format: id,timestamp,category,title,cities (pipe-separated)
    // But title may contain commas in Hebrew, so we need careful parsing
    // Format: seed_001,2026-02-28T08:30:00.000Z,1,ירי רקטות וטילים,cities
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const thirdComma = line.indexOf(',', secondComma + 1);
    const fourthComma = line.indexOf(',', thirdComma + 1);

    const id = line.substring(0, firstComma);
    const timestamp = line.substring(firstComma + 1, secondComma);
    const category = parseInt(line.substring(secondComma + 1, thirdComma), 10);
    const title = line.substring(thirdComma + 1, fourthComma);
    const citiesRaw = line.substring(fourthComma + 1);
    const cities = citiesRaw.split('|').map((c) => c.trim());

    const source: AlertSource = classifyAlertSource(cities);

    return {
      id,
      timestamp,
      category,
      title,
      cities,
      source,
    };
  });
}

function main() {
  const alerts = parseSeedCSV();

  // Ensure data directory exists
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(STORE_PATH, JSON.stringify(alerts, null, 2), 'utf-8');
  console.log(`Seeded ${alerts.length} alerts to ${STORE_PATH}`);
  alerts.forEach((a) => {
    console.log(`  ${a.id}: ${a.source} - ${a.cities.join(', ')}`);
  });
}

main();
