interface Coordinate {
  latitude: number;
  longitude: number;
}

/** Returns true if the coordinate is a valid GPS point. */
export function isValidGPS(coord: Coordinate | null | undefined): boolean {
  if (!coord) return false;
  const { latitude, longitude } = coord;
  if (!isFinite(latitude) || !isFinite(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Returns true if the ISO timestamp is within the last 5 minutes and not in the future.
 * Used to verify that a photo was just taken (anti-cheat).
 */
export function isRecentTimestamp(isoString: string): boolean {
  const ts = Date.parse(isoString);
  if (isNaN(ts)) return false;
  const now = Date.now();
  return ts <= now && now - ts <= MAX_AGE_MS;
}
