import { Zone, AlertSource } from './types';

export const ZONES: Zone[] = [
  // Northern zones (hezbollah)
  { hebrewName: 'קריית שמונה', englishName: 'Kiryat Shmona', arabicName: 'كريات شمونة', district: 'north', lat: 33.2087, lng: 35.5714, timeToShelterSeconds: 15, threatSource: 'hezbollah' },
  { hebrewName: 'נהריה', englishName: 'Nahariya', arabicName: 'نهاريا', district: 'north', lat: 33.0059, lng: 35.0931, timeToShelterSeconds: 15, threatSource: 'hezbollah' },
  { hebrewName: 'מעלות-תרשיחא', englishName: "Ma'alot-Tarshiha", arabicName: 'معالوت ترشيحا', district: 'north', lat: 33.0167, lng: 35.2750, timeToShelterSeconds: 15, threatSource: 'hezbollah' },
  { hebrewName: 'צפת', englishName: 'Safed', arabicName: 'صفد', district: 'north', lat: 32.9646, lng: 35.4968, timeToShelterSeconds: 30, threatSource: 'hezbollah' },
  { hebrewName: 'טבריה', englishName: 'Tiberias', arabicName: 'طبريا', district: 'north', lat: 32.7940, lng: 35.5300, timeToShelterSeconds: 30, threatSource: 'hezbollah' },
  { hebrewName: 'כרמיאל', englishName: 'Karmiel', arabicName: 'كرميئيل', district: 'north', lat: 32.9191, lng: 35.2991, timeToShelterSeconds: 30, threatSource: 'hezbollah' },
  { hebrewName: 'עכו', englishName: 'Acre', arabicName: 'عكا', district: 'north', lat: 32.9262, lng: 35.0839, timeToShelterSeconds: 30, threatSource: 'hezbollah' },

  // Haifa (both)
  { hebrewName: 'חיפה - כרמל ועיר תחתית', englishName: 'Haifa - Carmel', arabicName: 'حيفا - الكرمل', district: 'haifa', lat: 32.7940, lng: 34.9896, timeToShelterSeconds: 60, threatSource: 'both' },
  { hebrewName: 'חיפה - מרכז', englishName: 'Haifa - Center', arabicName: 'حيفا - المركز', district: 'haifa', lat: 32.8191, lng: 34.9983, timeToShelterSeconds: 60, threatSource: 'both' },
  { hebrewName: 'חיפה - קריות', englishName: 'Haifa - Krayot', arabicName: 'حيفا - كريوت', district: 'haifa', lat: 32.8353, lng: 35.0739, timeToShelterSeconds: 60, threatSource: 'both' },

  // Central (iran)
  { hebrewName: 'תל אביב - מרכז העיר', englishName: 'Tel Aviv - Center', arabicName: 'تل أبيب - المركز', district: 'tel_aviv', lat: 32.0798, lng: 34.7722, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'תל אביב - מזרח', englishName: 'Tel Aviv - East', arabicName: 'تل أبيب - شرق', district: 'tel_aviv', lat: 32.0700, lng: 34.7900, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'תל אביב - דרום', englishName: 'Tel Aviv - South', arabicName: 'تل أبيب - جنوب', district: 'tel_aviv', lat: 32.0500, lng: 34.7700, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'תל אביב - יפו', englishName: 'Tel Aviv - Jaffa', arabicName: 'تل أبيب - يافا', district: 'tel_aviv', lat: 32.0530, lng: 34.7510, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'רמת גן - מרכז', englishName: 'Ramat Gan - Center', arabicName: 'رمات غان - المركز', district: 'center', lat: 32.0833, lng: 34.8117, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'רמת גן - דרום', englishName: 'Ramat Gan - South', arabicName: 'رمات غان - جنوب', district: 'center', lat: 32.0700, lng: 34.8100, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'פתח תקווה', englishName: 'Petah Tikva', arabicName: 'بيتح تكفا', district: 'center', lat: 32.0841, lng: 34.8878, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'ראשון לציון', englishName: 'Rishon LeZion', arabicName: 'ريشون لتسيون', district: 'center', lat: 31.9710, lng: 34.7896, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'נתניה', englishName: 'Netanya', arabicName: 'نتانيا', district: 'sharon', lat: 32.3340, lng: 34.8578, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'רחובות', englishName: 'Rehovot', arabicName: 'رحوفوت', district: 'center', lat: 31.8928, lng: 34.8113, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'מודיעין', englishName: "Modi'in", arabicName: 'موديعين', district: 'center', lat: 31.8988, lng: 35.0103, timeToShelterSeconds: 90, threatSource: 'iran' },

  // Jerusalem (iran)
  { hebrewName: 'ירושלים - מרכז', englishName: 'Jerusalem - Center', arabicName: 'القدس - المركز', district: 'jerusalem', lat: 31.7767, lng: 35.2345, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'ירושלים - דרום', englishName: 'Jerusalem - South', arabicName: 'القدس - جنوب', district: 'jerusalem', lat: 31.7500, lng: 35.2200, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'ירושלים - מזרח', englishName: 'Jerusalem - East', arabicName: 'القدس - شرق', district: 'jerusalem', lat: 31.7800, lng: 35.2400, timeToShelterSeconds: 90, threatSource: 'iran' },
  { hebrewName: 'בית שמש', englishName: 'Beit Shemesh', arabicName: 'بيت شيمش', district: 'jerusalem', lat: 31.7461, lng: 34.9877, timeToShelterSeconds: 90, threatSource: 'iran' },

  // South (iran)
  { hebrewName: 'אשדוד - א,ב,ד,ה', englishName: 'Ashdod - A,B,D,H', arabicName: 'أشدود - أ,ب,د,ه', district: 'south', lat: 31.8040, lng: 34.6500, timeToShelterSeconds: 45, threatSource: 'iran' },
  { hebrewName: 'אשדוד - ג,ו,ז', englishName: 'Ashdod - C,F,G', arabicName: 'أشدود - ج,و,ز', district: 'south', lat: 31.8100, lng: 34.6400, timeToShelterSeconds: 45, threatSource: 'iran' },
  { hebrewName: 'אשדוד - ח,ט,י', englishName: 'Ashdod - H,T,Y', arabicName: 'أشدود - ح,ط,ي', district: 'south', lat: 31.7900, lng: 34.6450, timeToShelterSeconds: 45, threatSource: 'iran' },
  { hebrewName: 'אשדוד - יא,יב,טו,יז,מרינה', englishName: 'Ashdod - 11,12,15,17,Marina', arabicName: 'أشدود - 11,12,15,17,مارينا', district: 'south', lat: 31.8010, lng: 34.6350, timeToShelterSeconds: 45, threatSource: 'iran' },
  { hebrewName: 'אשקלון - צפון', englishName: 'Ashkelon - North', arabicName: 'عسقلان - شمال', district: 'south', lat: 31.6700, lng: 34.5700, timeToShelterSeconds: 30, threatSource: 'iran' },
  { hebrewName: 'אשקלון - דרום', englishName: 'Ashkelon - South', arabicName: 'عسقلان - جنوب', district: 'south', lat: 31.6600, lng: 34.5650, timeToShelterSeconds: 30, threatSource: 'iran' },
  { hebrewName: 'באר שבע - מזרח', englishName: "Be'er Sheva - East", arabicName: 'بئر السبع - شرق', district: 'south', lat: 31.2530, lng: 34.7913, timeToShelterSeconds: 60, threatSource: 'iran' },
  { hebrewName: 'באר שבע - מערב', englishName: "Be'er Sheva - West", arabicName: 'بئر السبع - غرب', district: 'south', lat: 31.2520, lng: 34.7700, timeToShelterSeconds: 60, threatSource: 'iran' },
];

export function findZoneByName(name: string): Zone | undefined {
  const normalized = name.trim();
  return ZONES.find(
    (zone) =>
      zone.hebrewName === normalized ||
      zone.englishName.toLowerCase() === normalized.toLowerCase() ||
      zone.hebrewName.includes(normalized) ||
      normalized.includes(zone.hebrewName) ||
      zone.englishName.toLowerCase().includes(normalized.toLowerCase()) ||
      normalized.toLowerCase().includes(zone.englishName.toLowerCase())
  );
}

export function findNearestZone(lat: number, lng: number): Zone {
  let closest = ZONES[0];
  let minDist = Infinity;
  for (const zone of ZONES) {
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

export function classifyAlertSource(cities: string[]): AlertSource {
  let hasNorth = false;
  let hasCentralSouth = false;

  for (const city of cities) {
    const zone = findZoneByName(city);
    if (!zone) continue;

    if (zone.district === 'haifa') {
      hasNorth = true;
      hasCentralSouth = true;
    } else if (zone.district === 'north') {
      hasNorth = true;
    } else {
      hasCentralSouth = true;
    }
  }

  if (hasNorth && hasCentralSouth) return 'dual';
  if (hasNorth) return 'hezbollah';
  if (hasCentralSouth) return 'iran';
  return 'unknown';
}
