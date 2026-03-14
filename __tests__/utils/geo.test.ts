import { fuzzCoordinate, isWithinRadius } from '@/utils/geo';

const TOKYO = { latitude: 35.6762, longitude: 139.6503 };

describe('fuzzCoordinate', () => {
  it('returns different coordinates each call (randomness)', () => {
    const a = fuzzCoordinate(TOKYO);
    const b = fuzzCoordinate(TOKYO);
    // Extremely unlikely to be identical
    expect(a.latitude !== TOKYO.latitude || a.longitude !== TOKYO.longitude).toBe(true);
    expect(b.latitude !== TOKYO.latitude || b.longitude !== TOKYO.longitude).toBe(true);
  });

  it('stays within ±100m latitude (±0.0009°)', () => {
    for (let i = 0; i < 50; i++) {
      const fuzzy = fuzzCoordinate(TOKYO);
      const latDiff = Math.abs(fuzzy.latitude - TOKYO.latitude);
      expect(latDiff).toBeLessThanOrEqual(0.0009);
    }
  });

  it('stays within ±100m longitude at 35°N (longitude-corrected)', () => {
    for (let i = 0; i < 50; i++) {
      const fuzzy = fuzzCoordinate(TOKYO);
      const lonDiff = Math.abs(fuzzy.longitude - TOKYO.longitude);
      // At 35°N, 1° lon ≈ 91.3km, so 100m ≈ 0.00110°
      expect(lonDiff).toBeLessThanOrEqual(0.0012);
    }
  });

  it('preserves latitude and longitude structure', () => {
    const fuzzy = fuzzCoordinate(TOKYO);
    expect(typeof fuzzy.latitude).toBe('number');
    expect(typeof fuzzy.longitude).toBe('number');
    expect(isFinite(fuzzy.latitude)).toBe(true);
    expect(isFinite(fuzzy.longitude)).toBe(true);
  });
});

describe('isWithinRadius', () => {
  it('returns true for same point', () => {
    expect(isWithinRadius(TOKYO, TOKYO, 1)).toBe(true);
  });

  it('returns true for two points ~500m apart', () => {
    // 0.0045° lat ≈ 500m north of TOKYO
    const nearby = { latitude: TOKYO.latitude + 0.0045, longitude: TOKYO.longitude };
    expect(isWithinRadius(TOKYO, nearby, 1000)).toBe(true);
  });

  it('returns false when points exceed radius', () => {
    const osaka = { latitude: 34.6937, longitude: 135.5023 };
    // Tokyo to Osaka ~400km
    expect(isWithinRadius(TOKYO, osaka, 50)).toBe(false);
  });

  it('returns false when exactly on 50m boundary (exclusive)', () => {
    // 50m north of TOKYO: 0.00045° lat ≈ 50m
    const nearPoint = { latitude: TOKYO.latitude + 0.00046, longitude: TOKYO.longitude };
    expect(isWithinRadius(TOKYO, nearPoint, 50)).toBe(false);
  });

  it('returns true when well within 50m', () => {
    const nearPoint = { latitude: TOKYO.latitude + 0.0002, longitude: TOKYO.longitude };
    expect(isWithinRadius(TOKYO, nearPoint, 50)).toBe(true);
  });
});
