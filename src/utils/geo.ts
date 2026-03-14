import { FUZZ_RADIUS_METERS } from '@/constants/plants';

interface Coordinate {
  latitude: number;
  longitude: number;
}

// Meters per degree latitude (constant)
const METERS_PER_LAT_DEGREE = 111_320;

/**
 * Adds ±FUZZ_RADIUS_METERS random offset to a GPS coordinate.
 * Longitude offset is corrected for latitude to ensure true ~100m max radius.
 */
export function fuzzCoordinate(coord: Coordinate): Coordinate {
  const maxLatDelta = FUZZ_RADIUS_METERS / METERS_PER_LAT_DEGREE; // ≈0.000898°
  const metersPerLonDegree =
    METERS_PER_LAT_DEGREE * Math.cos((coord.latitude * Math.PI) / 180);
  const maxLonDelta = FUZZ_RADIUS_METERS / metersPerLonDegree;

  // Random offsets in range [-max, +max]
  const latOffset = (Math.random() * 2 - 1) * maxLatDelta;
  const lonOffset = (Math.random() * 2 - 1) * maxLonDelta;

  return {
    latitude: coord.latitude + latOffset,
    longitude: coord.longitude + lonOffset,
  };
}

/**
 * Returns true if the great-circle distance between two points is within radiusMeters.
 * Uses the Haversine formula.
 */
export function isWithinRadius(a: Coordinate, b: Coordinate, radiusMeters: number): boolean {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;

  const distance = 2 * R * Math.asin(Math.sqrt(h));
  return distance < radiusMeters;
}
