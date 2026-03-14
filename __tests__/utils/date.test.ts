import { isInSeasonWindow, getCurrentSeason } from '@/utils/date';

describe('isInSeasonWindow', () => {
  it('returns true when today is inside the window', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect(isInSeasonWindow(yesterday, tomorrow)).toBe(true);
  });

  it('returns false when today is before the window', () => {
    const start = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    expect(isInSeasonWindow(start, end)).toBe(false);
  });

  it('returns false when today is after the window', () => {
    const start = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    expect(isInSeasonWindow(start, end)).toBe(false);
  });

  it('returns true when today equals start date (inclusive)', () => {
    const today = new Date().toISOString().slice(0, 10);
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    expect(isInSeasonWindow(today, future)).toBe(true);
  });

  it('returns false when today equals end date (exclusive, like DATERANGE)', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    expect(isInSeasonWindow(past, today)).toBe(false);
  });

  it('returns true when window is null (no restriction)', () => {
    expect(isInSeasonWindow(null, null)).toBe(true);
  });
});

describe('getCurrentSeason', () => {
  it('returns spring for March', () => {
    expect(getCurrentSeason(new Date('2026-03-15'))).toBe('spring');
  });

  it('returns spring for May', () => {
    expect(getCurrentSeason(new Date('2026-05-15'))).toBe('spring');
  });

  it('returns summer for June', () => {
    expect(getCurrentSeason(new Date('2026-06-01'))).toBe('summer');
  });

  it('returns summer for August', () => {
    expect(getCurrentSeason(new Date('2026-08-31'))).toBe('summer');
  });

  it('returns autumn for September', () => {
    expect(getCurrentSeason(new Date('2026-09-01'))).toBe('autumn');
  });

  it('returns autumn for November', () => {
    expect(getCurrentSeason(new Date('2026-11-30'))).toBe('autumn');
  });

  it('returns winter for December', () => {
    expect(getCurrentSeason(new Date('2026-12-01'))).toBe('winter');
  });

  it('returns winter for February', () => {
    expect(getCurrentSeason(new Date('2026-02-28'))).toBe('winter');
  });

  it('uses today if no date provided', () => {
    const season = getCurrentSeason();
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(season);
  });
});
