import { formatTime, formatBestTime, formatGraphTimeLabel } from '@/lib/utils';

describe('formatTime', () => {
  it('returns 24h format for afternoon', () => {
    const date = new Date(2026, 2, 7, 14, 30);
    expect(formatTime(date)).toBe('14:30');
  });

  it('returns zero-padded morning time', () => {
    const date = new Date(2026, 2, 7, 3, 15);
    expect(formatTime(date)).toBe('03:15');
  });

  it('returns 00:00 for midnight', () => {
    const date = new Date(2026, 2, 7, 0, 0);
    expect(formatTime(date)).toBe('00:00');
  });

  it('returns 23:59 for end of day', () => {
    const date = new Date(2026, 2, 7, 23, 59);
    expect(formatTime(date)).toBe('23:59');
  });

  it('never contains AM or PM', () => {
    for (let h = 0; h < 24; h++) {
      const result = formatTime(new Date(2026, 2, 7, h, 0));
      expect(result).not.toMatch(/AM|PM|am|pm/);
    }
  });
});

describe('formatBestTime', () => {
  it('returns just time for same-day window', () => {
    const now = new Date(2026, 2, 8, 13, 0);
    const start = new Date(2026, 2, 8, 15, 30);
    expect(formatBestTime(start, now, 'Tomorrow')).toBe('15:30');
  });

  it('prepends "Tomorrow" for next-day window', () => {
    const now = new Date(2026, 2, 8, 22, 0);
    const start = new Date(2026, 2, 9, 9, 0);
    expect(formatBestTime(start, now, 'Tomorrow')).toBe('Tomorrow 09:00');
  });

  it('prepends Hebrew tomorrow label', () => {
    const now = new Date(2026, 2, 8, 22, 0);
    const start = new Date(2026, 2, 9, 6, 0);
    expect(formatBestTime(start, now, '\u05DE\u05D7\u05E8')).toBe('\u05DE\u05D7\u05E8 06:00');
  });
});

describe('formatGraphTimeLabel', () => {
  it('returns just time when same day', () => {
    const date = new Date(2026, 2, 8, 14, 0);
    const prev = new Date(2026, 2, 8, 13, 0);
    expect(formatGraphTimeLabel(date, prev)).toBe('14:00');
  });

  it('shows date at midnight crossover', () => {
    const prev = new Date(2026, 2, 8, 23, 0);
    const date = new Date(2026, 2, 9, 0, 0);
    expect(formatGraphTimeLabel(date, prev)).toBe('9/3 00:00');
  });

  it('returns just time when prevDate is null', () => {
    const date = new Date(2026, 2, 8, 1, 0);
    expect(formatGraphTimeLabel(date, null)).toBe('01:00');
  });
});
