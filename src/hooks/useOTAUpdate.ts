import { useEffect } from 'react';
import { useUpdates, fetchUpdateAsync, reloadAsync } from 'expo-updates';

/**
 * Watches for OTA updates from expo-updates.
 * Auto-downloads when available, then auto-reloads to apply.
 * Returns download state for rendering a progress banner.
 */
export function useOTAUpdate() {
  const { isUpdateAvailable, isDownloading, downloadedUpdate } = useUpdates();

  // Auto-download when update is detected
  useEffect(() => {
    if (__DEV__) return;
    if (isUpdateAvailable && !isDownloading) {
      fetchUpdateAsync().catch(() => {});
    }
  }, [isUpdateAvailable, isDownloading]);

  // Auto-reload once download completes — no button press needed
  useEffect(() => {
    if (__DEV__) return;
    if (downloadedUpdate) {
      reloadAsync().catch(() => {});
    }
  }, [downloadedUpdate]);

  return {
    isDownloading,
    isReady: false, // auto-reload means we never linger in "ready" state
  };
}
