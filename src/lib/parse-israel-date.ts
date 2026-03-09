// Oref API returns dates in Israel local time WITHOUT timezone indicator
// (e.g. "2026-03-09 14:30:00"). On a UTC server, new Date() parses these
// as UTC, making timestamps ~2h ahead of reality.
//
// Israel timezone: UTC+2 (IST) before DST, UTC+3 (IDT) after.
// DST 2026: starts March 27, ends October 25.
// Using +02:00 for all pre-DST data (Feb 28 - Mar 26) which covers the
// bulk of the war data. ±1h error after DST change is acceptable.

export function parseIsraelDate(raw: string | Date): Date {
  if (raw instanceof Date) return raw;

  const s = String(raw).trim();
  if (!s) return new Date(NaN);

  // Already has timezone indicator — parse as-is
  if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s);
  }

  // Determine Israel offset from the date portion.
  // DST 2026: March 27 02:00 → October 25 02:00
  let offset = '+02:00';
  const match = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if ((month > 3 && month < 10) || (month === 3 && day >= 27) || (month === 10 && day < 25)) {
      offset = '+03:00';
    }
  }

  // Normalize space-separated to ISO format with T separator
  const normalized = s.replace(' ', 'T');
  return new Date(normalized + offset);
}
