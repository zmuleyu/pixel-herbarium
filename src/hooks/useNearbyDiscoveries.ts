import { useState, useEffect, useCallback } from 'react';
import * as ExpoLocation from 'expo-location';
import { supabase } from '@/services/supabase';
import { MAP_RADIUS_METERS } from '@/constants/plants';

interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface NearbyDiscovery {
  id: string;
  plant_id: number;
  plant_name_ja: string;
  hanakotoba: string;
  rarity: number;
  latitude: number;
  longitude: number;
  city: string | null;
}

interface UseNearbyDiscoveriesReturn {
  discoveries: NearbyDiscovery[];
  userLocation: Coordinate | null;
  loading: boolean;
  refresh: () => void;
}

/** Extract lat/lon from PostgREST-serialized PostGIS Geography (GeoJSON Point). */
function parseGeoJSON(geo: { type: string; coordinates: [number, number] }): Coordinate {
  // GeoJSON: coordinates = [longitude, latitude]
  return { latitude: geo.coordinates[1], longitude: geo.coordinates[0] };
}

export function useNearbyDiscoveries(): UseNearbyDiscoveriesReturn {
  const [discoveries, setDiscoveries] = useState<NearbyDiscovery[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setDiscoveries([]);
          }
          return;
        }

        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
        const coord: Coordinate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        if (!cancelled) {
          setUserLocation(coord);
        }

        const { data: rpcRows, error } = await (supabase as any).rpc('get_nearby_discoveries', {
          lat: coord.latitude,
          lon: coord.longitude,
          radius: MAP_RADIUS_METERS,
        });

        if (cancelled) return;
        if (error || !rpcRows || rpcRows.length === 0) {
          setDiscoveries([]);
          return;
        }

        const plantIds: number[] = [...new Set<number>(rpcRows.map((row: any) => row.plant_id as number))];
        const { data: plants, error: plantsError } = await (supabase as any)
          .from('plants')
          .select('id, name_ja, hanakotoba, rarity')
          .in('id', plantIds);

        if (cancelled) return;
        if (plantsError) {
          console.warn('useNearbyDiscoveries: failed to load plant metadata', plantsError);
        }

        const plantMap = new Map<number, { name_ja: string; hanakotoba: string; rarity: number }>(
          (plants ?? []).map((plant: any) => [
            plant.id,
            {
              name_ja: plant.name_ja,
              hanakotoba: plant.hanakotoba,
              rarity: plant.rarity ?? 1,
            },
          ]),
        );

        const result: NearbyDiscovery[] = rpcRows.map((row: any) => {
          const discoveryCoord = parseGeoJSON(row.location_fuzzy);
          const plant = plantMap.get(row.plant_id);
          return {
            id: row.id,
            plant_id: row.plant_id,
            plant_name_ja: plant?.name_ja ?? 'Unknown',
            hanakotoba: plant?.hanakotoba ?? '',
            rarity: plant?.rarity ?? 1,
            latitude: discoveryCoord.latitude,
            longitude: discoveryCoord.longitude,
            city: row.city ?? null,
          };
        });

        setDiscoveries(result);
      } catch (error) {
        if (!cancelled) {
          setDiscoveries([]);
        }
        console.warn('useNearbyDiscoveries: failed to load nearby discoveries', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { discoveries, userLocation, loading, refresh };
}
