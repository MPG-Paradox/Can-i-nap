import { Zone, Alert, AlertSource } from './types';
import { ZONES as ALL_ZONES } from './zones-generated';
import { hasRecentPreAlert, registerPreAlert } from './pre-alert-tracker';

export const ZONES = ALL_ZONES;

export function findZoneByName(name: string): Zone | undefined {
  const normalized = name.trim();
  if (!normalized) return undefined;

  // Exact match first
  const exact = ZONES.find(
    (z) => z.hebrewName === normalized || z.englishName === normalized
  );
  if (exact) return exact;

  // Fuzzy match: bidirectional includes on Hebrew and English
  return ZONES.find(
    (z) =>
      z.hebrewName.includes(normalized) ||
      normalized.includes(z.hebrewName) ||
      z.englishName.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(z.englishName.toLowerCase()) ||
      // For regions, also check regionCities
      (z.regionCities && z.regionCities.some(
        (c) => c.includes(normalized) || normalized.includes(c)
      ))
  );
}

export function findNearestZone(lat: number, lng: number): Zone {
  let closest = ZONES[0];
  let minDist = Infinity;
  for (const zone of ZONES) {
    // Skip entries with no coordinates or regions
    if (zone.lat === 0 && zone.lng === 0) continue;
    if (zone.isRegion) continue;
    const dist = Math.sqrt(
      Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = zone;
    }
  }
  return closest;
}

export function getZonesForRegion(regionName: string): Zone[] {
  const region = ZONES.find(
    (z) => z.isRegion && (z.hebrewName === regionName || z.englishName === regionName)
  );
  if (!region || !region.regionCities) return [];

  return ZONES.filter((z) => {
    if (z.isRegion) return false;
    return region.regionCities!.some(
      (prefix) => z.hebrewName.includes(prefix) || prefix.includes(z.hebrewName)
    );
  });
}

// Comprehensive keyword lists for classifying cities NOT in the zone database.
// Many small kibbutzim and communities won't have zone entries.
const NORTHERN_KEYWORDS = [
  // Upper Galilee
  'מטולה', 'שלומי', 'ראש הנקרה', 'מנרה', 'משגב עם', 'יפתח', 'דפנה',
  'דן', 'סנונית', 'בית הלל', 'שדה נחמיה', 'כפר גלעדי', 'תל חי',
  'אביבים', 'יראון', 'ברעם', 'דישון', 'מלכיה', 'רמות נפתלי',
  'אילון', 'גורן', 'שומרה', 'חניתה', 'אדמית',
  'בצת', 'לימן', 'געתון', 'כברי', 'מצובה', 'סאסא',
  'פקיעין', 'חורפיש', 'ירכא', 'כסרא',
  // Finger of Galilee
  'קריית שמונה', 'חצור הגלילית', 'ראש פינה', 'יסוד המעלה',
  'עמיר', 'גדות', 'שדה אליעזר', 'איילת השחר', 'משמר הירדן',
  'מחניים', 'גונן', 'לבנים', 'נאות מרדכי',
  // Hula Valley
  'כפר בלום', 'שמיר', 'חגושרים', 'הגושרים',
  // Golan Heights
  'קצרין', 'מסעדה', 'בוקעתא', 'אל רום',
  'חספין', 'אניעם', 'רמת מגשימים',
  // Western Galilee
  'נהריה', 'עכו', 'מעלות', 'תרשיחא', 'מעלות-תרשיחא',
  'כרמיאל', 'מעיליא',
  // Lower Galilee
  'צפת', 'טבריה', 'מגדל', 'כינרת', 'דגניה',
  // Regional council keywords
  'גליל עליון', 'גליל תחתון', 'גליל מערבי', 'רמת הגולן',
  'מבואות החרמון', 'אצבע הגליל', 'מטה אשר', 'מעלה יוסף',
  'משגב', 'מרום הגליל', 'עמק החולה',
  // General northern keywords (broad catch)
  'גליל', 'גולן',
  // Small communities frequently in alerts
  'נווה זיו', 'שבי ציון', 'בוסתן הגליל', 'עין יעקב',
  'כישור', 'יחיעם', 'גשר הזיו', 'חנותה', 'אבן מנחם',
  'צורית', 'מנות', 'לפידות', 'כמון', 'גילון',
  'יודפת', 'הררית', 'מורשת', 'עילבון', 'ריינה',
  'כפר מנדא', 'דיר אל-אסד', 'מג\'ד אל-כרום',
  'שפרעם', 'סח\'נין', 'עראבה', 'דיר חנא',
  'כאוכב אבו אל-היג\'א', 'טמרה',
  'חרשים', 'שזור', 'עין אל-אסד',
  'כליל', 'טובא-זנגריה',
  'מרגליות', 'מעיין ברוך', 'כפר יובל', 'חוף אכזיב',
  'עין גב', 'האון', 'רמת מגשימים', 'מבוא חמה',
];

const HAIFA_KEYWORDS = [
  'חיפה', 'קריות', 'קרית', 'טירת כרמל', 'נשר', 'עתלית',
  'רכסים', 'יוקנעם', 'כרמל',
  'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'קריית ים',
];

function isNorthernCity(city: string): boolean {
  return NORTHERN_KEYWORDS.some(kw => city.includes(kw) || kw.includes(city));
}

function isHaifaCity(city: string): boolean {
  return HAIFA_KEYWORDS.some(kw => city.includes(kw) || kw.includes(city));
}

export function classifyAlertSource(
  cities: string[],
  category: number = 1,
  alertCount: number = cities.length,
  timestamp: Date = new Date(),
  allRecentAlerts: Alert[] = []
): AlertSource {
  // Cat:14 = early warning. ONLY Iran ballistic missiles get this.
  // Hezbollah rockets have 0-30s flight time — no time for early warning.
  if (category === 14) {
    registerPreAlert(timestamp, cities);
    return 'iran';
  }

  // Cat:1 following a recent cat:14 within 4 minutes = same Iranian barrage
  if (category === 1 && hasRecentPreAlert(timestamp)) {
    return 'iran';
  }

  // Check alert history for cat:14 in the last 4 minutes
  const fourMinAgo = new Date(timestamp.getTime() - 4 * 60 * 1000);
  const recentPreAlertFromHistory = allRecentAlerts.some(
    (a) => a.category === 14 && a.timestamp > fourMinAgo
  );
  if (category === 1 && recentPreAlertFromHistory) {
    return 'iran';
  }

  // Massive barrage pattern: Iran launches hit 20+ cities simultaneously
  const isMassiveBarrage = alertCount >= 20;

  // Geography-based classification
  let hasNorth = false;
  let hasCentralSouth = false;

  for (const city of cities) {
    // First try the zone database
    const zone = findZoneByName(city);
    if (zone) {
      if (zone.district === 'haifa') {
        hasNorth = true;
        hasCentralSouth = true;
      } else if (zone.district === 'north') {
        hasNorth = true;
      } else {
        hasCentralSouth = true;
      }
      continue;
    }

    // Fallback: keyword-based region detection for cities NOT in our database.
    // Many small kibbutzim and communities in the north aren't in zones-generated.
    if (isNorthernCity(city)) {
      hasNorth = true;
    } else if (isHaifaCity(city)) {
      hasNorth = true;
      hasCentralSouth = true;
    } else {
      // Default: assume central/south (most of Israel's population)
      hasCentralSouth = true;
    }
  }

  // Massive barrage hitting central/south = Iran
  if (isMassiveBarrage && hasCentralSouth) return 'iran';

  if (hasNorth && hasCentralSouth) return 'dual';
  if (hasNorth) return 'hezbollah';
  if (hasCentralSouth) return 'iran';

  return 'unknown';
}
