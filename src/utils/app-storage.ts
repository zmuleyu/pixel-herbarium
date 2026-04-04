import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEY_PREFIX as GUIDE_KEY_PREFIX, ALL_GUIDE_FEATURE_KEYS } from '@/utils/guide-storage';

export const CHECKIN_HISTORY_KEY = 'ph_checkin_history';
export const SPOT_OFFLINE_QUEUE_KEY = 'ph_spot_checkin_queue';
export const ONBOARDING_KEY = 'onboarding_done_v1';
export const STAMP_STYLE_STORAGE_KEY = 'stamp_style_preference';
export const STAMP_POSITION_STORAGE_KEY = 'stamp_position_preference';
export const STAMP_CUSTOM_COLOR_KEY = 'stamp_custom_color_preference';
export const STAMP_EFFECT_TYPE_KEY = 'stamp_effect_type_preference';
export const STAMP_TEXT_MODE_KEY = 'stamp_text_mode_preference';
export const STAMP_DECORATION_KEY = 'stamp_decoration_key_preference';
export const REVIEW_PROMPT_KEY = 'ph_review_last_shown';

const GUIDE_STORAGE_KEYS = ALL_GUIDE_FEATURE_KEYS.map((featureKey) => `${GUIDE_KEY_PREFIX}${featureKey}`);

export const APP_STORAGE_KEYS = [
  CHECKIN_HISTORY_KEY,
  SPOT_OFFLINE_QUEUE_KEY,
  STAMP_STYLE_STORAGE_KEY,
  STAMP_POSITION_STORAGE_KEY,
  STAMP_CUSTOM_COLOR_KEY,
  STAMP_EFFECT_TYPE_KEY,
  STAMP_TEXT_MODE_KEY,
  STAMP_DECORATION_KEY,
  ONBOARDING_KEY,
  REVIEW_PROMPT_KEY,
  ...GUIDE_STORAGE_KEYS,
] as const;

export async function clearAppStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...APP_STORAGE_KEYS]);
}
