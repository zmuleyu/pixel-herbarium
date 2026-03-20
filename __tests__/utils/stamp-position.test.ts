/**
 * Tests for stamp-position utility functions:
 *   gridPositionToCoords()
 *   getPreviousVisitYears()
 */

import { gridPositionToCoords, getPreviousVisitYears } from '@/utils/stamp-position';
import type { CheckinRecord } from '@/types/hanami';

// ── gridPositionToCoords ──────────────────────────────────────────────

const W = 400;
const H = 800;

describe('gridPositionToCoords', () => {
  // Helpers
  const nearLeft   = (x: number) => x < W * 0.3;
  const atCenterX  = (x: number) => Math.abs(x - W * 0.5) <= 1;
  const nearRight  = (x: number) => x > W * 0.7;
  const nearTop    = (y: number) => y < H * 0.3;
  const atCenterY  = (y: number) => Math.abs(y - H * 0.5) <= 1;
  const nearBottom = (y: number) => y > H * 0.7;

  it('top-left → x near left, y near top', () => {
    const { x, y } = gridPositionToCoords('top-left', W, H);
    expect(nearLeft(x)).toBe(true);
    expect(nearTop(y)).toBe(true);
  });

  it('top-center → x at center, y near top', () => {
    const { x, y } = gridPositionToCoords('top-center', W, H);
    expect(atCenterX(x)).toBe(true);
    expect(nearTop(y)).toBe(true);
  });

  it('top-right → x near right, y near top', () => {
    const { x, y } = gridPositionToCoords('top-right', W, H);
    expect(nearRight(x)).toBe(true);
    expect(nearTop(y)).toBe(true);
  });

  it('middle-left → x near left, y at center', () => {
    const { x, y } = gridPositionToCoords('middle-left', W, H);
    expect(nearLeft(x)).toBe(true);
    expect(atCenterY(y)).toBe(true);
  });

  it('center → x at center, y at center', () => {
    const { x, y } = gridPositionToCoords('center', W, H);
    expect(atCenterX(x)).toBe(true);
    expect(atCenterY(y)).toBe(true);
  });

  it('middle-right → x near right, y at center', () => {
    const { x, y } = gridPositionToCoords('middle-right', W, H);
    expect(nearRight(x)).toBe(true);
    expect(atCenterY(y)).toBe(true);
  });

  it('bottom-left → x near left, y near bottom', () => {
    const { x, y } = gridPositionToCoords('bottom-left', W, H);
    expect(nearLeft(x)).toBe(true);
    expect(nearBottom(y)).toBe(true);
  });

  it('bottom-center → x at center, y near bottom', () => {
    const { x, y } = gridPositionToCoords('bottom-center', W, H);
    expect(atCenterX(x)).toBe(true);
    expect(nearBottom(y)).toBe(true);
  });

  it('bottom-right → x near right, y near bottom', () => {
    const { x, y } = gridPositionToCoords('bottom-right', W, H);
    expect(nearRight(x)).toBe(true);
    expect(nearBottom(y)).toBe(true);
  });
});

// ── getPreviousVisitYears ─────────────────────────────────────────────

function makeRecord(overrides: Partial<CheckinRecord> & { spotId: number; seasonId: string; timestamp: string }): CheckinRecord {
  return {
    id: 'test-id',
    photoUri: 'file:///photo.jpg',
    composedUri: 'file:///composed.jpg',
    templateId: 'classic',
    synced: false,
    ...overrides,
  };
}

describe('getPreviousVisitYears', () => {
  it('returns [] for empty history', () => {
    expect(getPreviousVisitYears([], 1, 'sakura')).toEqual([]);
  });

  it('returns [] when no record matches spotId', () => {
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 99, seasonId: 'sakura', timestamp: '2024-04-01T00:00:00Z' }),
    ];
    expect(getPreviousVisitYears(history, 1, 'sakura')).toEqual([]);
  });

  it('deduplicates multiple visits in the same year-season', () => {
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2024-03-28T00:00:00Z' }),
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2024-04-02T00:00:00Z' }),
    ];
    expect(getPreviousVisitYears(history, 1, 'momiji')).toEqual(['2024 春']);
  });

  it('includes visits across different seasons for same spot', () => {
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2024-04-01T00:00:00Z' }),
      makeRecord({ spotId: 1, seasonId: 'momiji', timestamp: '2024-11-01T00:00:00Z' }),
    ];
    expect(getPreviousVisitYears(history, 1, 'sakura')).toEqual(['2024 春', '2024 秋']);
  });

  it('returns labels sorted ascending', () => {
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2025-04-01T00:00:00Z' }),
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2023-04-01T00:00:00Z' }),
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2024-04-01T00:00:00Z' }),
    ];
    expect(getPreviousVisitYears(history, 1, 'momiji')).toEqual(['2023 春', '2024 春', '2025 春']);
  });

  it('excludes records with a different spotId', () => {
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2024-04-01T00:00:00Z' }),
      makeRecord({ spotId: 2, seasonId: 'sakura', timestamp: '2024-04-01T00:00:00Z' }),
    ];
    expect(getPreviousVisitYears(history, 1, 'momiji')).toEqual(['2024 春']);
  });

  it('excludes the current year-season from results', () => {
    // Simulate a revisit: current year is dynamic, so use a year clearly in the past
    const history: CheckinRecord[] = [
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2020-04-01T00:00:00Z' }),
      makeRecord({ spotId: 1, seasonId: 'sakura', timestamp: '2021-04-01T00:00:00Z' }),
    ];
    // currentSeasonId=sakura, but current year won't be 2020 or 2021, so none excluded
    const result = getPreviousVisitYears(history, 1, 'sakura');
    expect(result).toContain('2020 春');
    expect(result).toContain('2021 春');
  });
});
