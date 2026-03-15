import { useState, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Checks connectivity by pinging the Supabase REST endpoint.
// Re-checks when app returns to foreground and every 30s while active.
const PING_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '') + '/rest/v1/';
const INTERVAL_MS = 30_000;

async function checkOnline(): Promise<boolean> {
  if (!PING_URL || PING_URL === '/rest/v1/') return true; // skip in test/web env
  try {
    const res = await fetch(PING_URL, { method: 'HEAD', cache: 'no-store' });
    return res.status < 500;
  } catch {
    return false;
  }
}

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function refresh() {
      const online = await checkOnline();
      setIsOnline(online);
    }

    refresh();
    interval = setInterval(refresh, INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return isOnline;
}
