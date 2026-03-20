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

const SEASON_LABEL: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

/**
 * Returns unique 'YYYY 春/夏/秋/冬' labels for all prior visits at a spot,
 * across all seasons, excluding the current year-season.
 * Sorted ascending (earliest first). Used for revisit year pills.
 */
export function getPreviousVisitYears(
  history: CheckinRecord[],
  spotId: number,
  currentSeasonId: string,
): string[] {
  const currentLabel = `${new Date().getFullYear()} ${SEASON_LABEL[currentSeasonId] ?? currentSeasonId}`;
  const labels = new Set<string>();
  for (const r of history) {
    if (r.spotId !== spotId) continue;
    const year = new Date(r.timestamp).getFullYear();
    const label = `${year} ${SEASON_LABEL[r.seasonId] ?? r.seasonId}`;
    if (label !== currentLabel) labels.add(label);
  }
  return [...labels].sort();
}
