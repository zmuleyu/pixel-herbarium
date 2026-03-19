// Re-export spot-related types from sakura.ts
// These were previously imported from sakura.ts directly; spot.ts is a stable alias.
export type { SpotCheckinResult, SharePosterSpot, OfflineCheckinItem } from './sakura';
