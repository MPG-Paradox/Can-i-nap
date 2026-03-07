import { formatTime } from '@/lib/utils';

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
