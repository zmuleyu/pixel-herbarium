import { FEATURES } from '../../src/constants/features';

describe('FEATURES', () => {
  it('CHECKIN_MODE is true', () => {
    expect(FEATURES.CHECKIN_MODE).toBe(true);
  });

  it('IDENTIFICATION_MODE is false', () => {
    expect(FEATURES.IDENTIFICATION_MODE).toBe(false);
  });

  it('all feature values are booleans', () => {
    for (const value of Object.values(FEATURES)) {
      expect(typeof value).toBe('boolean');
    }
  });

  it('has exactly 3 keys', () => {
    expect(Object.keys(FEATURES)).toHaveLength(3);
  });

  it('contains the expected keys', () => {
    expect(Object.keys(FEATURES)).toEqual(
      expect.arrayContaining(['CHECKIN_MODE', 'IDENTIFICATION_MODE', 'SCREENSHOT_MODE']),
    );
  });

  it('SCREENSHOT_MODE is false by default', () => {
    expect(FEATURES.SCREENSHOT_MODE).toBe(false);
  });
});
