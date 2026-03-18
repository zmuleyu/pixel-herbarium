import {
  SEASONS,
  getCurrentSeason,
  getActiveSeason,
  SeasonConfig,
} from '../../src/constants/seasons';

describe('SEASONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SEASONS)).toBe(true);
    expect(SEASONS.length).toBeGreaterThan(0);
  });

  it('each entry has all required SeasonConfig fields', () => {
    const requiredKeys: (keyof SeasonConfig)[] = [
      'id',
      'nameKey',
      'themeColor',
      'accentColor',
      'bgTint',
      'iconEmoji',
      'dateRange',
      'spotsDataKey',
    ];
    for (const season of SEASONS) {
      for (const key of requiredKeys) {
        expect(season).toHaveProperty(key);
      }
    }
  });

  it('has no duplicate season IDs', () => {
    const ids = SEASONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('dateRange values match MM-DD pattern', () => {
    const mmddPattern = /^\d{2}-\d{2}$/;
    for (const season of SEASONS) {
      expect(season.dateRange).toHaveLength(2);
      expect(season.dateRange[0]).toMatch(mmddPattern);
      expect(season.dateRange[1]).toMatch(mmddPattern);
    }
  });

  it('each season has a valid iconEmoji (non-empty string)', () => {
    for (const season of SEASONS) {
      expect(typeof season.iconEmoji).toBe('string');
      expect(season.iconEmoji.length).toBeGreaterThan(0);
    }
  });
});

describe('getCurrentSeason', () => {
  it('returns sakura config for March 25', () => {
    const result = getCurrentSeason(new Date(2026, 2, 25));
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sakura');
  });

  it('returns sakura for April 10', () => {
    const result = getCurrentSeason(new Date(2026, 3, 10));
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sakura');
  });

  it('returns null for January 15 (no season active)', () => {
    const result = getCurrentSeason(new Date(2026, 0, 15));
    expect(result).toBeNull();
  });

  it('returns null for July 1 (no season active)', () => {
    const result = getCurrentSeason(new Date(2026, 6, 1));
    expect(result).toBeNull();
  });

  // Boundary tests for sakura dateRange: ['03-15', '04-20']
  it('returns sakura on exact start date (March 15)', () => {
    const result = getCurrentSeason(new Date(2026, 2, 15));
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sakura');
  });

  it('returns sakura on exact end date (April 20)', () => {
    const result = getCurrentSeason(new Date(2026, 3, 20));
    expect(result).not.toBeNull();
    expect(result!.id).toBe('sakura');
  });

  it('returns null the day before start (March 14)', () => {
    const result = getCurrentSeason(new Date(2026, 2, 14));
    expect(result).toBeNull();
  });

  it('returns null the day after end (April 21)', () => {
    const result = getCurrentSeason(new Date(2026, 3, 21));
    expect(result).toBeNull();
  });
});

describe('getActiveSeason', () => {
  it('never returns null', () => {
    const result = getActiveSeason();
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
  });

  it('returns sakura during sakura season (March 25)', () => {
    // getActiveSeason uses new Date() internally, so we mock it
    const realDate = globalThis.Date;
    const mockDate = new Date(2026, 2, 25);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    const result = getActiveSeason();
    expect(result.id).toBe('sakura');

    jest.useRealTimers();
  });

  it('returns a valid SeasonConfig even outside any season', () => {
    const realDate = globalThis.Date;
    const mockDate = new Date(2026, 0, 1); // Jan 1, outside all seasons
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    const result = getActiveSeason();
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('dateRange');

    jest.useRealTimers();
  });
});
