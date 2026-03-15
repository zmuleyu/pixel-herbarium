import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/services/supabase';

export type DiscoveryStatus =
  | 'idle'
  | 'checking'
  | 'identifying'
  | 'saving'
  | 'success'
  | 'cooldown'
  | 'quota_exceeded'
  | 'not_a_plant'
  | 'no_match'
  | 'error';

interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DiscoveredPlant {
  id: number;
  name_ja: string;
  name_en: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  flower_meaning: string;
  pixel_sprite_url: string | null;
}

interface UseDiscoveryReturn {
  status: DiscoveryStatus;
  discoveredPlant: DiscoveredPlant | null;
  daysRemaining?: number;
  runDiscovery: (photoUri: string, coord: Coordinate) => Promise<void>;
  reset: () => void;
}

export function useDiscovery(): UseDiscoveryReturn {
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [discoveredPlant, setDiscoveredPlant] = useState<DiscoveredPlant | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | undefined>(undefined);

  const runDiscovery = useCallback(async (photoUri: string, coord: Coordinate) => {
    setStatus('checking');
    setDiscoveredPlant(null);
    setDaysRemaining(undefined);

    try {
      // 1. Anti-cheat + quota check via /verify edge function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify', {
        body: { lat: coord.latitude, lon: coord.longitude },
      });

      if (verifyError) throw verifyError;

      if (!verifyData.allowed) {
        if (verifyData.reason === 'cooldown') {
          setDaysRemaining(verifyData.daysRemaining);
          setStatus('cooldown');
        } else {
          setStatus('quota_exceeded');
        }
        return;
      }

      // 2. Read photo as base64 and send to /identify edge function
      setStatus('identifying');
      const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: 'base64',
      });

      const { data: identifyData, error: identifyError } = await supabase.functions.invoke(
        'identify',
        { body: { imageBase64, lat: coord.latitude, lon: coord.longitude } },
      );

      if (identifyError) throw identifyError;

      if (identifyData.status === 'not_a_plant') {
        setStatus('not_a_plant');
        return;
      }
      if (identifyData.status !== 'success') {
        setStatus('no_match');
        return;
      }

      setDiscoveredPlant(identifyData.plant);
      setStatus('success');

      // 3. Kick off async pixel art generation (fire-and-forget, don't await)
      supabase.functions
        .invoke('pixelate', { body: { discoveryId: identifyData.discoveryId } })
        .catch(() => {
          // Pixel art failure is non-fatal; herbarium falls back to sprite
        });
    } catch {
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setDiscoveredPlant(null);
    setDaysRemaining(undefined);
  }, []);

  return { status, discoveredPlant, daysRemaining, runDiscovery, reset };
}
