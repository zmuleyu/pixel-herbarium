jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_STORAGE_KEYS,
  CHECKIN_HISTORY_KEY,
  ONBOARDING_KEY,
  STAMP_CUSTOM_COLOR_KEY,
  clearAppStorage,
} from '@/utils/app-storage';

describe('app-storage', () => {
  it('includes known app-owned keys in the cleanup whitelist', () => {
    expect(APP_STORAGE_KEYS).toContain(CHECKIN_HISTORY_KEY);
    expect(APP_STORAGE_KEYS).toContain(ONBOARDING_KEY);
    expect(APP_STORAGE_KEYS).toContain(STAMP_CUSTOM_COLOR_KEY);
    expect(APP_STORAGE_KEYS.some((key) => key.startsWith('guide_seen_'))).toBe(true);
  });

  it('clears only the app-owned whitelist via multiRemove', async () => {
    await clearAppStorage();
    expect((AsyncStorage as any).multiRemove).toHaveBeenCalledWith([...APP_STORAGE_KEYS]);
  });
});
