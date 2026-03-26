import * as FileSystem from 'expo-file-system/legacy';

const SIGNAL_NAMES = [
  'screenshot_ready_home',
  'screenshot_ready_checkin',
  'screenshot_ready_settings',
  'screenshot_ready_detail',
] as const;

/**
 * Write a signal file to Documents directory, then poll until CI deletes it.
 *
 * Handshake protocol:
 *   1. App writes signal file  → "I'm ready, capture now"
 *   2. CI detects file         → captures screenshot
 *   3. CI deletes signal file  → "captured, you can proceed"
 *   4. App detects deletion    → navigates to next screen
 *
 * On non-CI environments (Expo Go / real device), the signal file is never
 * deleted, so this falls through after timeout — the app continues normally.
 */
export async function signalAndWait(
  name: string,
  timeoutMs = 30000,
): Promise<void> {
  const path = `${FileSystem.documentDirectory}${name}`;
  await FileSystem.writeAsStringAsync(path, Date.now().toString());
  console.log(`[SCREENSHOT_SIGNAL] Wrote: ${name}`);

  // Poll until CI deletes the file (= screenshot captured)
  const interval = 500;
  let elapsed = 0;
  while (elapsed < timeoutMs) {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      console.log(`[SCREENSHOT_SIGNAL] Ack received: ${name}`);
      return;
    }
    await new Promise<void>(r => setTimeout(r, interval));
    elapsed += interval;
  }

  // Timeout: continue anyway (not running in CI, or CI failed)
  console.warn(`[SCREENSHOT_SIGNAL] Timeout (${timeoutMs}ms): ${name}`);
}

/** Remove all signal files. Call at sequence start to clear stale state. */
export async function clearScreenshotSignals(): Promise<void> {
  await Promise.all(
    SIGNAL_NAMES.map(name =>
      FileSystem.deleteAsync(`${FileSystem.documentDirectory}${name}`, {
        idempotent: true,
      }),
    ),
  );
  console.log('[SCREENSHOT_SIGNAL] Cleared all signals');
}
