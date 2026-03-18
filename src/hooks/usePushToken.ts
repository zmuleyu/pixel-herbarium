import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/auth-store';

// Registers the device's Expo push token with Supabase on sign-in.
// Safe to call repeatedly — upsert prevents duplicates.
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

    const tokenResult = await Notifications.getExpoPushTokenAsync({
      projectId: 'pixel-herbarium',
    });
    const token = tokenResult.data;

    await (supabase as any)
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token' },
      );
  } catch {
    // Push token registration is non-critical — swallow errors silently
  }
}
