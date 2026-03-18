import { SEASON_THEMES, getSeasonTheme } from '../../src/constants/theme';

describe('SEASON_THEMES', () => {
  it('sakura exists with primary, accent, bgTint', () => {
    expect(SEASON_THEMES.sakura).toBeDefined();
    expect(SEASON_THEMES.sakura).toHaveProperty('primary');
    expect(SEASON_THEMES.sakura).toHaveProperty('accent');
    expect(SEASON_THEMES.sakura).toHaveProperty('bgTint');
  });

  it('all 5 seasons are defined', () => {
    const expectedSeasons = ['sakura', 'ajisai', 'himawari', 'momiji', 'tsubaki'];
    for (const season of expectedSeasons) {
      expect(SEASON_THEMES).toHaveProperty(season);
    }
    expect(Object.keys(SEASON_THEMES)).toHaveLength(5);
  });

  it('all colors are valid hex strings', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [, theme] of Object.entries(SEASON_THEMES)) {
      expect(theme.primary).toMatch(hexPattern);
      expect(theme.accent).toMatch(hexPattern);
      expect(theme.bgTint).toMatch(hexPattern);
    }
  });

  it('bgTint colors are all light (high RGB values)', () => {
    for (const [, theme] of Object.entries(SEASON_THEMES)) {
      // bgTint should be a very light color: R >= 0xF0
      const r = parseInt(theme.bgTint.slice(1, 3), 16);
      expect(r).toBeGreaterThanOrEqual(0xf0);
    }
  });
});

describe('getSeasonTheme', () => {
  it('returns SEASON_THEMES.sakura for "sakura"', () => {
    expect(getSeasonTheme('sakura')).toBe(SEASON_THEMES.sakura);
  });

  it('returns SEASON_THEMES.sakura as fallback for unknown ID', () => {
    expect(getSeasonTheme('unknown')).toBe(SEASON_THEMES.sakura);
  });

  it('returns correct theme for each known season', () => {
    for (const [id, theme] of Object.entries(SEASON_THEMES)) {
      expect(getSeasonTheme(id)).toBe(theme);
    }
  });

  it('returns an object with primary, accent, bgTint for any input', () => {
    const result = getSeasonTheme('nonexistent');
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('accent');
    expect(result).toHaveProperty('bgTint');
  });
});
