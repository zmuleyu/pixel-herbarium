import {
  getBloomStatus,
  getBloomStatusLabel,
  getBloomStatusColor,
  getFeaturedSpot,
} from '../../src/utils/bloom';
import type { FlowerSpot, BloomStatus } from '../../src/types/hanami';

const testSpot: FlowerSpot = {
  id: 1,
  regionId: 'jp',
  seasonId: 'sakura',
  nameJa: 'テスト公園',
  nameEn: 'Test Park',
  prefecture: '東京都',
  prefectureCode: 13,
  city: '千代田区',
  category: 'park' as const,
  treeCount: 100,
  bloomTypical: {
    earlyStart: '03-20',
    peakStart: '03-28',
    peakEnd: '04-05',
    lateEnd: '04-12',
  },
  latitude: 35.68,
  longitude: 139.77,
  tags: ['test'],
};

/** Helper to create a Date in 2026 from "MM-DD". */
function d(mmdd: string): Date {
  return new Date(`2026-${mmdd}T12:00:00`);
}

describe('getBloomStatus', () => {
  it('returns "pre" before earlyStart (March 10)', () => {
    expect(getBloomStatus(testSpot, d('03-10'))).toBe('pre');
  });

  it('returns "budding" between earlyStart and peakStart (March 24)', () => {
    expect(getBloomStatus(testSpot, d('03-24'))).toBe('budding');
  });

  it('returns "peak" between peakStart and peakEnd (April 1)', () => {
    expect(getBloomStatus(testSpot, d('04-01'))).toBe('peak');
  });

  it('returns "falling" between peakEnd and lateEnd (April 8)', () => {
    expect(getBloomStatus(testSpot, d('04-08'))).toBe('falling');
  });

  it('returns "ended" after lateEnd (April 20)', () => {
    expect(getBloomStatus(testSpot, d('04-20'))).toBe('ended');
  });

  it('returns "budding" on exact earlyStart (March 20)', () => {
    expect(getBloomStatus(testSpot, d('03-20'))).toBe('budding');
  });

  it('returns "peak" on exact peakStart (March 28)', () => {
    expect(getBloomStatus(testSpot, d('03-28'))).toBe('peak');
  });

  it('returns "peak" on exact peakEnd — inclusive (April 5)', () => {
    expect(getBloomStatus(testSpot, d('04-05'))).toBe('peak');
  });

  it('returns "falling" on exact lateEnd — inclusive (April 12)', () => {
    expect(getBloomStatus(testSpot, d('04-12'))).toBe('falling');
  });
});

describe('getBloomStatusLabel', () => {
  const allStatuses: BloomStatus[] = [
    'pre',
    'budding',
    'partial',
    'peak',
    'falling',
    'ended',
  ];

  it.each(allStatuses)(
    'returns a string starting with "bloom." for status "%s"',
    (status) => {
      const label = getBloomStatusLabel(status);
      expect(label).toMatch(/^bloom\./);
    },
  );

  it('returns defined (non-undefined) values for every status', () => {
    for (const status of allStatuses) {
      expect(getBloomStatusLabel(status)).toBeDefined();
    }
  });

  it('returns "bloom.pre" for status "pre"', () => {
    expect(getBloomStatusLabel('pre')).toBe('bloom.pre');
  });

  it('returns "bloom.peak" for status "peak"', () => {
    expect(getBloomStatusLabel('peak')).toBe('bloom.peak');
  });
});

describe('getBloomStatusColor', () => {
  const allStatuses: BloomStatus[] = [
    'pre',
    'budding',
    'partial',
    'peak',
    'falling',
    'ended',
  ];

  it.each(allStatuses)(
    'returns a valid 6-digit hex color for status "%s"',
    (status) => {
      const color = getBloomStatusColor(status);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    },
  );

  it('returns a string type for every status', () => {
    for (const status of allStatuses) {
      expect(typeof getBloomStatusColor(status)).toBe('string');
    }
  });
});

describe('getFeaturedSpot', () => {
  it('returns null for an empty array', () => {
    expect(getFeaturedSpot([], new Date())).toBeNull();
  });

  it('returns a spot from the provided array', () => {
    const spots = [testSpot];
    const result = getFeaturedSpot(spots, d('04-01'));
    expect(result).not.toBeNull();
    expect(spots).toContain(result);
  });

  it('is deterministic: same date yields same result', () => {
    const spots = [
      testSpot,
      { ...testSpot, id: 2, nameEn: 'Second Park' },
      { ...testSpot, id: 3, nameEn: 'Third Park' },
    ];
    const date = d('04-01');
    const first = getFeaturedSpot(spots, date);
    const second = getFeaturedSpot(spots, date);
    expect(first).toBe(second);
  });

  it('prefers in-bloom spots when available', () => {
    // Create an out-of-bloom spot (bloom window in January)
    const winterSpot: FlowerSpot = {
      ...testSpot,
      id: 99,
      nameEn: 'Winter Park',
      bloomTypical: {
        earlyStart: '01-01',
        peakStart: '01-05',
        peakEnd: '01-10',
        lateEnd: '01-15',
      },
    };

    // testSpot is in peak on April 1
    const spots = [winterSpot, testSpot];
    const result = getFeaturedSpot(spots, d('04-01'));
    expect(result).toBe(testSpot);
  });
});
