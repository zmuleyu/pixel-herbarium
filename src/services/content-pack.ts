// src/services/content-pack.ts
// A+C phase: hardcoded jp region.
// Future: select based on REGION env var at build time.
import jpRegion from '@/data/packs/jp/region';
import sakuraData from '@/data/packs/jp/seasons/sakura.json';
import ajisaiData from '@/data/packs/jp/seasons/ajisai.json';
import himawariData from '@/data/packs/jp/seasons/himawari.json';
import momijiData from '@/data/packs/jp/seasons/momiji.json';
import type { RegionConfig } from '@/types/region';
import type { SpotsData } from '@/types/hanami';

export function getActiveRegion(): RegionConfig {
  return jpRegion;
}

// Static registry — Metro bundler requires static imports
const SPOT_REGISTRY: Record<string, SpotsData> = {
  sakura: sakuraData as SpotsData,
  ajisai: ajisaiData as SpotsData,
  himawari: himawariData as SpotsData,
  momiji: momijiData as SpotsData,
};

export function loadSpotsData(seasonId: string): SpotsData | null {
  return SPOT_REGISTRY[seasonId] ?? null;
}
