import { isInSeasonWindow, getCurrentSeason, getSeasonPhase } from '@/utils/date';

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

// ── getSeasonPhase ────────────────────────────────────────────────────

describe('getSeasonPhase – ★★★ with DATERANGE window', () => {
  const window = '[2026-04-01,2026-04-30)';

  it('returns dormant before window starts', () => {
    const result = getSeasonPhase([4], 3, window, new Date('2026-03-20'));
    expect(result.phase).toBe('dormant');
  });

  it('returns budding in first third of window', () => {
    const result = getSeasonPhase([4], 3, window, new Date('2026-04-05'));
    expect(result.phase).toBe('budding');
    expect(result.progress).toBeGreaterThan(0);
    expect(result.progress).toBeLessThan(0.33);
  });

  it('returns peak in middle third of window', () => {
    const result = getSeasonPhase([4], 3, window, new Date('2026-04-15'));
    expect(result.phase).toBe('peak');
    expect(result.progress).toBeGreaterThanOrEqual(0.33);
    expect(result.progress).toBeLessThan(0.67);
  });

  it('returns falling in last third of window', () => {
    const result = getSeasonPhase([4], 3, window, new Date('2026-04-25'));
    expect(result.phase).toBe('falling');
    expect(result.progress).toBeGreaterThanOrEqual(0.67);
  });

  it('returns dormant after window ends', () => {
    const result = getSeasonPhase([4], 3, window, new Date('2026-05-01'));
    expect(result.phase).toBe('dormant');
  });
});

describe('getSeasonPhase – bloom_months based', () => {
  it('returns dormant when not in bloom month', () => {
    const result = getSeasonPhase([3, 4, 5], 2, null, new Date('2026-01-15'));
    expect(result.phase).toBe('dormant');
  });

  it('returns budding in first bloom month of 3-month range', () => {
    const result = getSeasonPhase([3, 4, 5], 2, null, new Date('2026-03-15'));
    expect(result.phase).toBe('budding');
  });

  it('returns peak in middle bloom month of 3-month range', () => {
    const result = getSeasonPhase([3, 4, 5], 2, null, new Date('2026-04-15'));
    expect(result.phase).toBe('peak');
  });

  it('returns falling in last bloom month of 3-month range', () => {
    const result = getSeasonPhase([3, 4, 5], 2, null, new Date('2026-05-15'));
    expect(result.phase).toBe('falling');
  });

  it('returns peak for single-month bloom', () => {
    // Single month → progress = 0.5 → peak
    const result = getSeasonPhase([4], 1, null, new Date('2026-04-15'));
    expect(result.phase).toBe('peak');
  });
});

describe('getSeasonPhase – always available', () => {
  it('returns always when no bloom months', () => {
    const result = getSeasonPhase([], 1, null);
    expect(result.phase).toBe('always');
  });
});
