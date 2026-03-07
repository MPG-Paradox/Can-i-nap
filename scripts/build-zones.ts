/**
 * Build zones data from pikud-haoref-api cities.json
 * Run: npx tsx scripts/build-zones.ts
 */
import * as fs from 'fs';
import * as path from 'path';

interface PikudCity {
  id: number;
  name: string;
  name_en: string;
  zone: string;
  zone_en: string;
  countdown: number;
  lat: number;
  lng: number;
  value: string;
}

type District = 'north' | 'haifa' | 'center' | 'tel_aviv' | 'jerusalem' | 'south' | 'judea_samaria' | 'sharon';
type ThreatSource = 'iran' | 'hezbollah' | 'both';

interface ZoneEntry {
  hebrewName: string;
  englishName: string;
  district: District;
  lat: number;
  lng: number;
  timeToShelterSeconds: number;
  threatSource: ThreatSource;
  isRegion?: boolean;
  regionCities?: string[];
}

// Map pikud-haoref zone names to our district system
const ZONE_TO_DISTRICT: Record<string, District> = {
  '\u05E7\u05D5 \u05D4\u05E2\u05D9\u05DE\u05D5\u05EA': 'north',      // Confrontation Line
  '\u05D2\u05DC\u05D9\u05DC \u05E2\u05DC\u05D9\u05D5\u05DF': 'north',   // Upper Galilee
  '\u05D2\u05DC\u05D9\u05DC \u05EA\u05D7\u05EA\u05D5\u05DF': 'north',   // Lower Galilee
  '\u05D2\u05D5\u05DC\u05DF': 'north',              // Golan
  '\u05E7\u05E6\u05E8\u05D9\u05DF': 'north',            // Katzrin
  '\u05EA\u05D1\u05D5\u05E8': 'north',              // Tavor
  '\u05D1\u05E7\u05E2\u05EA \u05D1\u05D9\u05EA \u05E9\u05D0\u05DF': 'north', // Beit She'an Valley
  '\u05D7\u05D9\u05E4\u05D4': 'haifa',              // Haifa
  '\u05E7\u05E8\u05D9\u05D5\u05EA': 'haifa',            // Krayot
  '\u05D7\u05D5\u05E3 \u05D4\u05DB\u05E8\u05DE\u05DC': 'haifa',   // Hof HaCarmel
  '\u05D9\u05E2\u05E8\u05D5\u05EA \u05D4\u05DB\u05E8\u05DE\u05DC': 'haifa', // Yearot HaCarmel
  '\u05D5\u05D0\u05D3\u05D9 \u05E2\u05E8\u05D4': 'haifa',     // Wadi Ara
  '\u05DE\u05E0\u05E9\u05D4': 'center',             // Menashe
  '\u05D3\u05DF': 'center',                // Dan
  '\u05D9\u05E8\u05E7\u05D5\u05DF': 'center',           // Yarkon
  '\u05D4\u05E9\u05E4\u05DC\u05D4': 'center',           // HaShfela
  '\u05D3\u05E8\u05D5\u05DD \u05D4\u05E9\u05E4\u05DC\u05D4': 'center', // Drom Hashfela
  '\u05E9\u05E8\u05D5\u05DF': 'sharon',             // Sharon
  '\u05D7\u05E4\u05E8': 'sharon',              // Hefer
  '\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD': 'jerusalem',       // Jerusalem
  '\u05D1\u05D9\u05EA \u05E9\u05DE\u05E9': 'jerusalem',   // Beit Shemesh
  '\u05D9\u05D4\u05D5\u05D3\u05D4': 'judea_samaria',        // Yehuda
  '\u05E9\u05D5\u05DE\u05E8\u05D5\u05DF': 'judea_samaria',      // Shomron
  '\u05D1\u05E7\u05E2\u05D4': 'judea_samaria',          // Bika'a
  '\u05DC\u05DB\u05D9\u05E9': 'south',              // Lachish
  '\u05DE\u05E2\u05E8\u05D1 \u05DC\u05DB\u05D9\u05E9': 'south',   // West Lachish
  '\u05E2\u05D5\u05D8\u05E3 \u05E2\u05D6\u05D4': 'south',     // Gaza Envelope
  '\u05DE\u05E2\u05E8\u05D1 \u05D4\u05E0\u05D2\u05D1': 'south',   // West Negev
  '\u05DE\u05E8\u05DB\u05D6 \u05D4\u05E0\u05D2\u05D1': 'south',   // Center Negev
  '\u05D3\u05E8\u05D5\u05DD \u05D4\u05E0\u05D2\u05D1': 'south',   // South Negev
  '\u05D9\u05DD \u05D4\u05DE\u05DC\u05D7': 'south',        // Dead Sea
  '\u05D0\u05D9\u05DC\u05EA': 'south',              // Eilat
  '\u05E2\u05E8\u05D1\u05D4': 'south',              // Arava
};

const DISTRICT_THREAT: Record<District, ThreatSource> = {
  north: 'hezbollah',
  haifa: 'both',
  center: 'iran',
  tel_aviv: 'iran',
  jerusalem: 'iran',
  south: 'iran',
  judea_samaria: 'iran',
  sharon: 'iran',
};

// Cities that map to tel_aviv district specifically
const TEL_AVIV_KEYWORDS = [
  '\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1', '\u05D9\u05E4\u05D5',
  '\u05E8\u05DE\u05EA \u05D0\u05D1\u05D9\u05D1',
];

function getDistrict(city: PikudCity): District {
  // Check if it's a Tel Aviv city
  for (const kw of TEL_AVIV_KEYWORDS) {
    if (city.name.includes(kw)) return 'tel_aviv';
  }

  // Use zone mapping
  const district = ZONE_TO_DISTRICT[city.zone];
  if (district) return district;

  // Fallback: guess by zone name keywords
  const zone = city.zone;
  if (zone.includes('\u05E0\u05D2\u05D1') || zone.includes('\u05E2\u05D6\u05D4')) return 'south';
  if (zone.includes('\u05D2\u05DC\u05D9\u05DC') || zone.includes('\u05D2\u05D5\u05DC\u05DF')) return 'north';

  return 'center';
}

function main() {
  const citiesPath = path.join(process.cwd(), 'node_modules', 'pikud-haoref-api', 'cities.json');
  const raw = fs.readFileSync(citiesPath, 'utf-8');
  const cities: PikudCity[] = JSON.parse(raw);

  // Filter out the "select all" entry and entries without names
  const validCities = cities.filter(c => c.id !== 0 && c.name && c.zone);

  const zones: ZoneEntry[] = [];
  const seen = new Set<string>();

  for (const city of validCities) {
    if (seen.has(city.name)) continue;
    seen.add(city.name);

    const district = getDistrict(city);
    const threatSource = DISTRICT_THREAT[district];

    zones.push({
      hebrewName: city.name,
      englishName: city.name_en || city.name,
      district,
      lat: city.lat || 0,
      lng: city.lng || 0,
      timeToShelterSeconds: city.countdown || 90,
      threatSource,
    });
  }

  // Add regions
  const regions: ZoneEntry[] = [
    {
      hebrewName: '\u05D2\u05D5\u05E9 \u05D3\u05DF',
      englishName: 'Gush Dan',
      district: 'tel_aviv',
      lat: 32.07,
      lng: 34.79,
      timeToShelterSeconds: 90,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05EA\u05DC \u05D0\u05D1\u05D9\u05D1', '\u05E8\u05DE\u05EA \u05D2\u05DF', '\u05D2\u05D1\u05E2\u05EA\u05D9\u05D9\u05DD', '\u05D1\u05E0\u05D9 \u05D1\u05E8\u05E7', '\u05D7\u05D5\u05DC\u05D5\u05DF', '\u05D1\u05EA \u05D9\u05DD', '\u05E4\u05EA\u05D7 \u05EA\u05E7\u05D5\u05D5\u05D4', '\u05E8\u05D0\u05E9\u05D5\u05DF \u05DC\u05E6\u05D9\u05D5\u05DF', '\u05D4\u05E8\u05E6\u05DC\u05D9\u05D4', '\u05E8\u05DE\u05EA \u05D4\u05E9\u05E8\u05D5\u05DF'],
    },
    {
      hebrewName: '\u05E2\u05D5\u05D8\u05E3 \u05E2\u05D6\u05D4',
      englishName: 'Gaza Envelope',
      district: 'south',
      lat: 31.37,
      lng: 34.40,
      timeToShelterSeconds: 15,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05E9\u05D3\u05E8\u05D5\u05EA', '\u05E0\u05EA\u05D9\u05D1\u05D5\u05EA', '\u05D0\u05D5\u05E4\u05E7\u05D9\u05DD', '\u05D9\u05D1\u05D5\u05DC', '\u05DB\u05D9\u05E1\u05D5\u05E4\u05D9\u05DD', '\u05E0\u05D9\u05E8 \u05E2\u05D5\u05D6', '\u05D1\u05D0\u05E8\u05D9', '\u05E8\u05E2\u05D9\u05DD', '\u05E0\u05D7\u05DC \u05E2\u05D5\u05D6'],
    },
    {
      hebrewName: '\u05D4\u05E9\u05E4\u05DC\u05D4',
      englishName: 'Shfela',
      district: 'center',
      lat: 31.88,
      lng: 34.87,
      timeToShelterSeconds: 90,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05E8\u05DE\u05DC\u05D4', '\u05DC\u05D5\u05D3', '\u05DE\u05D5\u05D3\u05D9\u05E2\u05D9\u05DF', '\u05D1\u05D9\u05EA \u05E9\u05DE\u05E9', '\u05D2\u05D3\u05E8\u05D4', '\u05E7\u05E8\u05D9\u05EA \u05D2\u05EA'],
    },
    {
      hebrewName: '\u05D4\u05E9\u05E8\u05D5\u05DF',
      englishName: 'HaSharon',
      district: 'sharon',
      lat: 32.30,
      lng: 34.87,
      timeToShelterSeconds: 90,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05E0\u05EA\u05E0\u05D9\u05D4', '\u05DB\u05E4\u05E8 \u05E1\u05D1\u05D0', '\u05E8\u05E2\u05E0\u05E0\u05D4', '\u05D4\u05D5\u05D3 \u05D4\u05E9\u05E8\u05D5\u05DF', '\u05E8\u05DE\u05EA \u05D4\u05E9\u05E8\u05D5\u05DF', '\u05D4\u05E8\u05E6\u05DC\u05D9\u05D4'],
    },
    {
      hebrewName: '\u05E7\u05D5 \u05D4\u05E2\u05D9\u05DE\u05D5\u05EA',
      englishName: 'Confrontation Line',
      district: 'north',
      lat: 33.10,
      lng: 35.30,
      timeToShelterSeconds: 15,
      threatSource: 'hezbollah',
      isRegion: true,
      regionCities: ['\u05E7\u05E8\u05D9\u05D9\u05EA \u05E9\u05DE\u05D5\u05E0\u05D4', '\u05DE\u05D8\u05D5\u05DC\u05D4', '\u05E9\u05DC\u05D5\u05DE\u05D9', '\u05E0\u05D4\u05E8\u05D9\u05D4', '\u05DE\u05E2\u05DC\u05D5\u05EA'],
    },
    {
      hebrewName: '\u05D7\u05D5\u05E3 \u05D4\u05DB\u05E8\u05DE\u05DC',
      englishName: 'Carmel Coast',
      district: 'haifa',
      lat: 32.76,
      lng: 34.97,
      timeToShelterSeconds: 60,
      threatSource: 'both',
      isRegion: true,
      regionCities: ['\u05D7\u05D9\u05E4\u05D4', '\u05D8\u05D9\u05E8\u05EA \u05DB\u05E8\u05DE\u05DC', '\u05E2\u05EA\u05DC\u05D9\u05EA', '\u05E0\u05E9\u05E8'],
    },
    {
      hebrewName: '\u05D4\u05E0\u05D2\u05D1',
      englishName: 'The Negev',
      district: 'south',
      lat: 31.25,
      lng: 34.79,
      timeToShelterSeconds: 60,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05D1\u05D0\u05E8 \u05E9\u05D1\u05E2', '\u05E2\u05E8\u05D3', '\u05D3\u05D9\u05DE\u05D5\u05E0\u05D4', '\u05D0\u05D9\u05DC\u05EA', '\u05DE\u05E6\u05E4\u05D4 \u05E8\u05DE\u05D5\u05DF'],
    },
    {
      hebrewName: '\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD \u05D5\u05D4\u05E1\u05D1\u05D9\u05D1\u05D4',
      englishName: 'Jerusalem Area',
      district: 'jerusalem',
      lat: 31.77,
      lng: 35.22,
      timeToShelterSeconds: 90,
      threatSource: 'iran',
      isRegion: true,
      regionCities: ['\u05D9\u05E8\u05D5\u05E9\u05DC\u05D9\u05DD', '\u05D1\u05D9\u05EA \u05E9\u05DE\u05E9', '\u05DE\u05E2\u05DC\u05D4 \u05D0\u05D3\u05D5\u05DE\u05D9\u05DD', '\u05DE\u05D1\u05E9\u05E8\u05EA \u05E6\u05D9\u05D5\u05DF'],
    },
  ];

  const allZones = [...regions, ...zones];

  // Generate the TypeScript file
  let output = `// Auto-generated by scripts/build-zones.ts — do not edit manually\n`;
  output += `import { Zone } from './types';\n\n`;
  output += `export const ZONES: Zone[] = [\n`;

  for (const z of allZones) {
    output += `  { hebrewName: ${JSON.stringify(z.hebrewName)}, englishName: ${JSON.stringify(z.englishName)}, district: ${JSON.stringify(z.district)}, lat: ${z.lat}, lng: ${z.lng}, timeToShelterSeconds: ${z.timeToShelterSeconds}, threatSource: ${JSON.stringify(z.threatSource)}`;
    if (z.isRegion) {
      output += `, isRegion: true, regionCities: ${JSON.stringify(z.regionCities)}`;
    }
    output += ` },\n`;
  }

  output += `];\n`;

  const outPath = path.join(process.cwd(), 'src', 'lib', 'zones-generated.ts');
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`Written ${allZones.length} zones (${regions.length} regions + ${zones.length} cities) to ${outPath}`);
}

main();
