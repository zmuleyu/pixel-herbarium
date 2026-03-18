// Local types for the sakura spot check-in feature.
// FlowerSpot / BloomStatus / BloomWindow live in hanami.ts — import from there.

import type { BloomStatus } from './hanami';

/** Row returned from spot_checkins table (or from checkin_spot RPC response) */
export interface SpotCheckinResult {
  id: string;             // UUID
  user_id: string;
  spot_id: number;        // matches FlowerSpot.id
  checked_in_at: string;  // ISO 8601
  is_mankai: boolean;
  stamp_variant: 'normal' | 'mankai';
  bloom_status_at_checkin: BloomStatus | null;
}

/** Data passed to SharePoster when format === 'spot' */
export interface SharePosterSpot {
  spot_id: number;
  name_ja: string;
  name_en: string;
  prefecture: string;
  checked_in_at: string;       // ISO 8601
  stamp_variant: 'normal' | 'mankai';
  bloom_status: BloomStatus;
  custom_sprite_url?: string;
  is100sen: boolean;           // tags.includes('名所100選')
}

/** Queued offline check-in waiting for network */
export interface OfflineCheckinItem {
  spot_id: number;
  is_peak: boolean;
  bloom_status: BloomStatus;
  queued_at: string;  // ISO 8601
}
