import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth-store';

// Registers the device's Expo push token with Supabase on sign-in.
// Safe to call repeatedly because upsert prevents duplicates.
export function usePushToken() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    registerToken(user.id);
  }, [user?.id]);
}

async function registerToken(userId: string) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResult.data;

    const { error } = await (supabase as any)
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' },
      );
    if (error) throw error;
  } catch (e) {
    // Push token registration is non-critical.
    console.warn('usePushToken: failed to register token', e);
  }
}
