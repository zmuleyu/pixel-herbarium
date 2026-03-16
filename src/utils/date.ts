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

// ── Season Phase (三阶段: 花開き → 見頃 → 花散り) ────────────────────

export type BloomPhase = 'budding' | 'peak' | 'falling' | 'dormant' | 'always';

export interface SeasonPhase {
  phase: BloomPhase;
  progress: number;  // 0–1, fraction through the bloom window
}

/**
 * Determines the bloom phase for a plant based on its bloom window and rarity.
 *
 * ★★★ (rarity 3) with available_window: uses DATERANGE for precise phase (thirds).
 * ★★ / ★ with bloom_months: maps current month position within bloom months.
 * ★ with no bloom_months or year-round: returns 'always'.
 */
export function getSeasonPhase(
  bloomMonths: number[],
  rarity: number,
  availableWindow: string | null,
  today: Date = new Date(),
): SeasonPhase {
  const currentMonth = today.getMonth() + 1;

  // ★★★ with explicit DATERANGE window — e.g. '[2026-04-15,2026-05-01)'
  if (rarity === 3 && availableWindow) {
    const match = availableWindow.match(/\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)/);
    if (match) {
      const start = new Date(match[1]);
      const end = new Date(match[2]);
      const todayMs = today.getTime();
      if (todayMs < start.getTime()) return { phase: 'dormant', progress: 0 };
      if (todayMs >= end.getTime()) return { phase: 'dormant', progress: 1 };
      const total = end.getTime() - start.getTime();
      const elapsed = todayMs - start.getTime();
      const progress = Math.min(1, Math.max(0, elapsed / total));
      if (progress < 0.33) return { phase: 'budding', progress };
      if (progress < 0.67) return { phase: 'peak', progress };
      return { phase: 'falling', progress };
    }
  }

  // No bloom months → always available
  if (bloomMonths.length === 0) return { phase: 'always', progress: 0 };

  // Not currently in bloom
  if (!bloomMonths.includes(currentMonth)) return { phase: 'dormant', progress: 0 };

  // In bloom — map position within bloom months to phase
  const sorted = [...bloomMonths].sort((a, b) => a - b);
  const idx = sorted.indexOf(currentMonth);
  const total = sorted.length;
  const progress = (idx + 0.5) / total; // center of the month slot
  if (progress < 0.33) return { phase: 'budding', progress };
  if (progress < 0.67) return { phase: 'peak', progress };
  return { phase: 'falling', progress };
}
