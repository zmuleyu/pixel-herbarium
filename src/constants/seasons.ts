// src/constants/seasons.ts
// Season utilities — delegates to the active region's season list.
// SeasonConfig lives in types/region.ts; re-exported here for backward compatibility.

import { getActiveRegion } from '@/services/content-pack';
import type { SeasonConfig } from '@/types/region';

export type { SeasonConfig };

/** All configured seasons for the active region. Convenience alias for getSeasons(). */
export const SEASONS: SeasonConfig[] = (() => {
  try {
    return getActiveRegion().seasons;
  } catch {
    return [];
  }
})();

export function getSeasons(): SeasonConfig[] {
  const seasons = getActiveRegion().seasons;
  if (seasons.length === 0) {
    throw new Error('Region has no seasons configured');
  }
  return seasons;
}

export function getCurrentSeason(date: Date = new Date()): SeasonConfig | null {
  const mmdd = formatMMDD(date);
  return (
    getSeasons().find((s) => {
      const [start, end] = s.dateRange;
      if (start <= end) return mmdd >= start && mmdd <= end;
      return mmdd >= start || mmdd <= end;
    }) ?? null
  );
}

export function getActiveSeason(): SeasonConfig {
  const now = new Date();
  const current = getCurrentSeason(now);
  if (current) return current;

  const mmdd = formatMMDD(now);
  const seasons = getSeasons();

  const future = seasons
    .filter((s) => s.dateRange[0] > mmdd)
    .sort((a, b) => a.dateRange[0].localeCompare(b.dateRange[0]));
  if (future.length > 0) return future[0];

  const past = seasons
    .filter((s) => s.dateRange[1] < mmdd)
    .sort((a, b) => b.dateRange[1].localeCompare(a.dateRange[1]));
  if (past.length > 0) return past[0];

  return seasons[0];
}

function formatMMDD(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}
