import type { FlowerSpot, BloomStatus } from '@/types/hanami';

/**
 * Determine bloom status for a spot based on its typical bloom window.
 */
export function getBloomStatus(
  spot: FlowerSpot,
  date: Date = new Date(),
): BloomStatus {
  const mmdd = formatMMDD(date);
  const { earlyStart, peakStart, peakEnd, lateEnd } = spot.bloomTypical;

  if (mmdd < earlyStart) return 'pre';
  if (mmdd >= earlyStart && mmdd < peakStart) return 'budding';
  if (mmdd >= peakStart && mmdd <= peakEnd) return 'peak';
  if (mmdd > peakEnd && mmdd <= lateEnd) return 'falling';
  return 'ended';
}

/**
 * Returns the i18n key for a bloom status label.
 */
export function getBloomStatusLabel(status: BloomStatus): string {
  const map: Record<BloomStatus, string> = {
    pre: 'bloom.pre',
    budding: 'bloom.budding',
    partial: 'bloom.partial',
    peak: 'bloom.peak',
    falling: 'bloom.falling',
    ended: 'bloom.ended',
  };
  return map[status];
}

/**
 * Returns a hex color for a bloom status badge.
 */
export function getBloomStatusColor(status: BloomStatus): string {
  switch (status) {
    case 'pre':
      return '#c0c0c0';
    case 'budding':
      return '#c1e8d8';
    case 'partial':
      return '#d4e4f7';
    case 'peak':
      return '#f5d5d0';
    case 'falling':
      return '#e8a87c';
    case 'ended':
      return '#c0c0c0';
  }
}

/**
 * Select a "featured" spot deterministically for a given date.
 * Prefers in-bloom spots. Falls back to any spot.
 */
export function getFeaturedSpot(
  spots: FlowerSpot[],
  date: Date = new Date(),
): FlowerSpot | null {
  if (spots.length === 0) return null;

  const inBloom = spots.filter((s) => {
    const status = getBloomStatus(s, date);
    return status === 'peak' || status === 'budding';
  });

  const pool = inBloom.length > 0 ? inBloom : spots;
  const dayOfYear = getDayOfYear(date);
  return pool[dayOfYear % pool.length];
}

function formatMMDD(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
