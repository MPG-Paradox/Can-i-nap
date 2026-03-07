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

function runStep(name: string, command: string, timeout: number) {
  console.log(`--- ${name} ---\n`);
  try {
    execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`${name} failed: ${msg}`);
    console.log('Continuing with next step...\n');
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log(' CAN I NAP? -- Master Data Loader');
  console.log('='.repeat(50));
  console.log();

  const initialCount = countAlerts();
  console.log(`Starting alert count: ${initialCount}\n`);

  // Step 1: Fetch historical data (Tzofar / external sources with day-by-day)
  runStep('Step 1: Fetching historical data', 'npx tsx scripts/fetch-tzofar-history.ts', 300000);

  const afterHistorical = countAlerts();
  console.log(`\nAlerts after historical fetch: ${afterHistorical} (+${afterHistorical - initialCount})\n`);

  // Step 2: Fetch Oref 24h history
  runStep('Step 2: Fetching Oref 24h history', 'npx tsx scripts/fetch-oref-history.ts', 60000);

  const afterOref = countAlerts();
  console.log(`\nAlerts after Oref history: ${afterOref} (+${afterOref - afterHistorical})\n`);

  // Step 3: Reprocess — remove cat:13, re-classify with fixed keywords
  runStep('Step 3: Reprocessing data', 'npx tsx scripts/reprocess-data.ts', 60000);

  const afterReprocess = countAlerts();
  console.log(`\nAlerts after reprocessing: ${afterReprocess}\n`);

  // Step 4: Validate
  runStep('Step 4: Validating data', 'npx tsx scripts/validate-data.ts', 30000);

  // Summary
  const finalCount = countAlerts();
  console.log('\n' + '='.repeat(50));
  console.log(' SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Initial alerts: ${initialCount}`);
  console.log(`  After fetch:    ${afterOref}`);
  console.log(`  After cleanup:  ${finalCount}`);
  console.log();

  if (finalCount === initialCount) {
    console.log('No new alerts were loaded. This is expected if:');
    console.log('  - You are not on an Israeli IP (APIs are geo-blocked)');
    console.log('  - The data was already up to date');
    console.log('\nTo collect real data, run: npm run poll');
  } else {
    console.log('Data loaded and processed successfully!');
    console.log('Run `npm run dev` to see the app with real data.');
  }
}

main().catch(console.error);
