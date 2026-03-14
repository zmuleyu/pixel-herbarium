import { isValidGPS, isRecentTimestamp } from '@/utils/validation';

describe('isValidGPS', () => {
  it('accepts valid Tokyo coordinates', () => {
    expect(isValidGPS({ latitude: 35.6762, longitude: 139.6503 })).toBe(true);
  });

  it('accepts boundary values', () => {
    expect(isValidGPS({ latitude: 90, longitude: 180 })).toBe(true);
    expect(isValidGPS({ latitude: -90, longitude: -180 })).toBe(true);
    expect(isValidGPS({ latitude: 0, longitude: 0 })).toBe(true);
  });

  it('rejects latitude out of range', () => {
    expect(isValidGPS({ latitude: 91, longitude: 0 })).toBe(false);
    expect(isValidGPS({ latitude: -91, longitude: 0 })).toBe(false);
  });

  it('rejects longitude out of range', () => {
    expect(isValidGPS({ latitude: 0, longitude: 181 })).toBe(false);
    expect(isValidGPS({ latitude: 0, longitude: -181 })).toBe(false);
  });

  it('rejects NaN values', () => {
    expect(isValidGPS({ latitude: NaN, longitude: 0 })).toBe(false);
    expect(isValidGPS({ latitude: 0, longitude: NaN })).toBe(false);
  });

  it('rejects null/undefined', () => {
    expect(isValidGPS(null as any)).toBe(false);
    expect(isValidGPS(undefined as any)).toBe(false);
  });
});

describe('isRecentTimestamp', () => {
  it('accepts a timestamp from 1 minute ago', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    expect(isRecentTimestamp(oneMinAgo)).toBe(true);
  });

  it('accepts a timestamp from 4 minutes ago (within 5-minute window)', () => {
    const fourMinAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    expect(isRecentTimestamp(fourMinAgo)).toBe(true);
  });

  it('rejects a timestamp older than 5 minutes', () => {
    const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    expect(isRecentTimestamp(sixMinAgo)).toBe(false);
  });

  it('rejects a future timestamp', () => {
    const future = new Date(Date.now() + 60 * 1000).toISOString();
    expect(isRecentTimestamp(future)).toBe(false);
  });

  it('rejects an invalid date string', () => {
    expect(isRecentTimestamp('not-a-date')).toBe(false);
  });
});
