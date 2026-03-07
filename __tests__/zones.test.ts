import { findZoneByName, findNearestZone, classifyAlertSource } from '@/lib/zones';

describe('findZoneByName', () => {
  it('finds zone by exact Hebrew name', () => {
    const zone = findZoneByName('קריית שמונה');
    expect(zone).toBeDefined();
    expect(zone!.englishName).toBe('Kiryat Shmona');
  });

  it('finds zone by partial Hebrew name (prefix match)', () => {
    const zone = findZoneByName('אשדוד');
    expect(zone).toBeDefined();
    expect(zone!.hebrewName).toContain('אשדוד');
  });

  it('finds zone by English name', () => {
    const zone = findZoneByName('Tel Aviv - Center');
    expect(zone).toBeDefined();
    expect(zone!.district).toBe('tel_aviv');
  });

  it('returns undefined for unknown name', () => {
    const zone = findZoneByName('NonexistentCity');
    expect(zone).toBeUndefined();
  });
});

describe('findNearestZone', () => {
  it('returns a Tel Aviv zone for coords near Tel Aviv', () => {
    const zone = findNearestZone(32.08, 34.78);
    expect(zone.district).toBe('tel_aviv');
  });

  it('returns a northern zone for coords near Kiryat Shmona', () => {
    const zone = findNearestZone(33.21, 35.57);
    expect(zone.district).toBe('north');
  });
});

describe('classifyAlertSource', () => {
  it('classifies only northern cities as hezbollah', () => {
    const source = classifyAlertSource(['קריית שמונה', 'נהריה']);
    expect(source).toBe('hezbollah');
  });

  it('classifies only central cities as iran', () => {
    const source = classifyAlertSource(['תל אביב - מרכז העיר', 'רמת גן - מרכז']);
    expect(source).toBe('iran');
  });

  it('classifies north + central as dual', () => {
    const source = classifyAlertSource(['קריית שמונה', 'תל אביב - מרכז העיר']);
    expect(source).toBe('dual');
  });

  it('classifies Haifa as dual (both fronts)', () => {
    const source = classifyAlertSource(['חיפה - מרכז']);
    expect(source).toBe('dual');
  });

  it('returns unknown for unrecognized cities', () => {
    const source = classifyAlertSource(['עיר לא קיימת']);
    expect(source).toBe('unknown');
  });
});
