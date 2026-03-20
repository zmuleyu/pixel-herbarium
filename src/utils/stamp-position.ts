import type { StampPosition } from '@/types/hanami';
import type { CheckinRecord } from '@/types/hanami';

/**
 * Maps a StampPosition grid name to approximate pixel coordinates
 * representing the center of the stamp within the container.
 * Used for anchoring animations (e.g., petal burst origin).
 */
export function gridPositionToCoords(
  position: StampPosition,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number } {
  const col = position.endsWith('left') ? 0.15
    : position.endsWith('right') ? 0.85
    : 0.5; // center column

  const row = position.startsWith('top') ? 0.15
    : position.startsWith('bottom') ? 0.85
    : 0.5; // middle row

  return {
    x: containerWidth * col,
    y: containerHeight * row,
  };
}

/**
 * Returns the unique calendar years in which the user checked in at a given spot
 * within a given season, sorted descending. Used for the revisit animation.
 */
export function getPreviousVisitYears(
  history: CheckinRecord[],
  spotId: number,
  seasonId: string,
): number[] {
  const years = history
    .filter(r => r.spotId === spotId && r.seasonId === seasonId)
    .map(r => new Date(r.timestamp).getFullYear());
  return [...new Set(years)].sort((a, b) => b - a);
}
