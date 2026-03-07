import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const STORE_PATH = path.join(__dirname, '..', 'data', 'alerts.json');

function countAlerts(): number {
  try {
    if (!fs.existsSync(STORE_PATH)) return 0;
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    if (!raw.trim()) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log(' CAN I NAP? -- Master Data Loader');
  console.log('='.repeat(50));
  console.log();

  const initialCount = countAlerts();
  console.log(`Starting alert count: ${initialCount}\n`);

  // Step 1: Fetch historical data (Tzofar / external sources)
  console.log('--- Step 1: Fetching historical data ---\n');
  try {
    execSync('npx tsx scripts/fetch-tzofar-history.ts', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 120000,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Historical fetch failed or timed out: ${msg}`);
    console.log('Continuing with next step...\n');
  }

  const afterHistorical = countAlerts();
  console.log(`\nAlerts after historical fetch: ${afterHistorical} (+${afterHistorical - initialCount})\n`);

  // Step 2: Fetch Oref 24h history
  console.log('--- Step 2: Fetching Oref 24h history ---\n');
  try {
    execSync('npx tsx scripts/fetch-oref-history.ts', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 60000,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Oref history fetch failed: ${msg}`);
    console.log('Continuing with next step...\n');
  }

  const afterOref = countAlerts();
  console.log(`\nAlerts after Oref history: ${afterOref} (+${afterOref - afterHistorical})\n`);

  // Step 3: Run validation
  console.log('--- Step 3: Validating data ---\n');
  try {
    execSync('npx tsx scripts/validate-data.ts', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 30000,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Validation failed: ${msg}`);
  }

  // Summary
  const finalCount = countAlerts();
  console.log('\n' + '='.repeat(50));
  console.log(' SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Initial alerts: ${initialCount}`);
  console.log(`  Final alerts:   ${finalCount}`);
  console.log(`  New alerts:     ${finalCount - initialCount}`);
  console.log();

  if (finalCount === initialCount) {
    console.log('No new alerts were loaded. This is expected if:');
    console.log('  - You are not on an Israeli IP (APIs are geo-blocked)');
    console.log('  - The data was already up to date');
    console.log('\nTo collect real data, run: npm run poll');
    console.log('(Keep it running in a separate terminal from an Israeli IP)');
  } else {
    console.log('Data loaded successfully!');
    console.log('Run `npm run dev` to see the app with real data.');
  }
}

main().catch(console.error);
