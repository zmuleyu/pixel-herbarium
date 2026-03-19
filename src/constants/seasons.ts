<<<<<<< HEAD
=======
// SeasonConfig is defined in types/region.ts to prevent circular deps; re-exported here.
>>>>>>> feat/line-phase1
import type { SeasonConfig } from '@/types/region';
export type { SeasonConfig } from '@/types/region';

export const SEASONS: SeasonConfig[] = [
  {
    id: 'sakura',
    nameKey: 'season.sakura.name',
    themeColor: '#e8a5b0',
    accentColor: '#f5d5d0',
    bgTint: '#FFF5F3',
    iconEmoji: '\u{1F338}', // 🌸
    dateRange: ['03-15', '04-20'],
    spotsDataKey: 'sakura',
  },
  // Future seasons — add here, zero code changes needed:
  // { id: 'ajisai',   themeColor: '#7B9FCC', dateRange: ['06-01', '07-15'], ... },
  // { id: 'himawari', themeColor: '#d4a645', dateRange: ['07-15', '08-31'], ... },
  // { id: 'momiji',   themeColor: '#c4764a', dateRange: ['10-15', '12-05'], ... },
];

/**
 * Returns the season config whose dateRange contains the given date.
 * Returns null if no season is currently active.
 */
export function getCurrentSeason(date: Date = new Date()): SeasonConfig | null {
  const mmdd = formatMMDD(date);
  return (
    SEASONS.find((s) => {
      const [start, end] = s.dateRange;
      // Handle cross-year ranges (e.g. tsubaki Dec-Feb)
      if (start <= end) {
        return mmdd >= start && mmdd <= end;
      }
      return mmdd >= start || mmdd <= end;
    }) ?? null
  );
}

/**
 * Returns the active season for UI display.
 * Priority: current in-range → nearest future → most recent past → first in array.
 */
export function getActiveSeason(): SeasonConfig {
  const now = new Date();
  const current = getCurrentSeason(now);
  if (current) return current;

  const mmdd = formatMMDD(now);

  // Find nearest future season
  const future = SEASONS.filter((s) => s.dateRange[0] > mmdd).sort((a, b) =>
    a.dateRange[0].localeCompare(b.dateRange[0]),
  );
  if (future.length > 0) return future[0];

  // All seasons are past — return most recent
  const past = SEASONS.filter((s) => s.dateRange[1] < mmdd).sort((a, b) =>
    b.dateRange[1].localeCompare(a.dateRange[1]),
  );
  if (past.length > 0) return past[0];

  return SEASONS[0];
}

function formatMMDD(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}
