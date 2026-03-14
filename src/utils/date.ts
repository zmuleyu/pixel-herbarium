export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Checks if today falls within [start, end) — same semantics as PostgreSQL DATERANGE.
 * Pass null/null for plants with no seasonal restriction.
 */
export function isInSeasonWindow(
  start: string | null,
  end: string | null,
): boolean {
  if (start === null && end === null) return true;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return today >= (start ?? '') && today < (end ?? '');
}

/**
 * Returns the current Japanese season based on the month.
 * Spring: Mar–May, Summer: Jun–Aug, Autumn: Sep–Nov, Winter: Dec–Feb
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1–12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}
