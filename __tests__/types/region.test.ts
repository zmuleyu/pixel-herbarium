import type { RegionConfig, GeoBounds } from '../../src/types/region';

describe('RegionConfig type', () => {
  it('accepts a valid Japan RegionConfig', () => {
    const bounds: GeoBounds = { latMin: 24.0, latMax: 46.0, lonMin: 122.0, lonMax: 154.0 };
    const config: RegionConfig = {
      id: 'jp',
      nameKey: 'region.jp.name',
      bounds,
      seasons: [],
      defaultLocale: 'ja',
      adminDivisionKey: 'prefecture',
      adminDivisionStandard: 'JIS-X-0401',
      spotCategories: ['park', 'shrine'],
    };
    expect(config.id).toBe('jp');
    expect(config.bounds.latMin).toBe(24.0);
    expect(config.adminDivisionStandard).toBe('JIS-X-0401');
  });

  it('allows optional adminDivisionStandard', () => {
    const config: RegionConfig = {
      id: 'test',
      nameKey: 'region.test.name',
      bounds: { latMin: 0, latMax: 1, lonMin: 0, lonMax: 1 },
      seasons: [],
      defaultLocale: 'en',
      adminDivisionKey: 'state',
      spotCategories: [],
    };
    expect(config.adminDivisionStandard).toBeUndefined();
  });
});
