import { getActiveRegion, loadSpotsData } from '../../src/services/content-pack';

describe('content-pack', () => {
  describe('getActiveRegion', () => {
    it('returns jp region config', () => {
      const region = getActiveRegion();
      expect(region.id).toBe('jp');
      expect(region.bounds.latMin).toBe(24.0);
      expect(region.defaultLocale).toBe('ja');
    });

    it('has at least one season', () => {
      const region = getActiveRegion();
      expect(region.seasons.length).toBeGreaterThan(0);
      expect(region.seasons[0].id).toBe('sakura');
    });
  });

  describe('loadSpotsData', () => {
    it('returns sakura spots data', () => {
      const data = loadSpotsData('sakura');
      expect(data).not.toBeNull();
      expect(data!.seasonId).toBe('sakura');
      expect(data!.spots.length).toBeGreaterThan(0);
    });

    it('returns null for unknown season', () => {
      expect(loadSpotsData('nonexistent')).toBeNull();
    });

    it('spots have regionId field', () => {
      const data = loadSpotsData('sakura');
      expect(data!.spots[0].regionId).toBe('jp');
    });
  });
});
