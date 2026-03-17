import { useEffect } from 'react';
import { useUpdates, fetchUpdateAsync } from 'expo-updates';

/**
 * Watches for OTA updates from expo-updates.
 * When an update is available, auto-triggers download.
 * Returns state for rendering a progress UI.
 */
export function useOTAUpdate() {
  const { isUpdateAvailable, isDownloading, downloadedUpdate } = useUpdates();

  useEffect(() => {
    if (__DEV__) return;
    if (isUpdateAvailable && !isDownloading) {
      fetchUpdateAsync().catch(() => {});
    }
  }, [isUpdateAvailable, isDownloading]);

  return {
    isDownloading,
    isReady: !!downloadedUpdate,
  };
}
