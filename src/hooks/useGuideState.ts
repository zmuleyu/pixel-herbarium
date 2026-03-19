// src/hooks/useGuideState.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'guide_seen_';

interface GuideState {
  seen: boolean;
  loading: boolean;
  markSeen: () => void;
  reset: () => void;
}

export function useGuideState(featureKey: string): GuideState {
  const storageKey = `${KEY_PREFIX}${featureKey}`;
  const [seen, setSeen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((value) => {
      if (!cancelled) {
        setSeen(value === 'true');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [storageKey]);

  const markSeen = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const reset = useCallback(() => {
    setSeen(false);
    AsyncStorage.removeItem(storageKey);
  }, [storageKey]);

  return { seen, loading, markSeen, reset };
}
