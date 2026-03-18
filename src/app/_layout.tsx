import '../i18n'; // initialize i18n before any screen renders
import { restoreLanguage } from '../i18n';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/services/supabase';
import { colors } from '@/constants/theme';
import { usePushToken } from '@/hooks/usePushToken';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ONBOARDING_KEY } from './onboarding';

/** Resolves to fallback after ms milliseconds if promise hasn't settled. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms))]);
}

// Show notifications as banners when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading, setSession, setUser, setLoading } = useAuthStore();
  usePushToken();

  // Handle push notification taps — navigate to herbarium
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'plant' && data?.plantId) {
        router.push(`/plant/${data.plantId}` as any);
      } else {
        router.push('/(tabs)/herbarium' as any);
      }
    });
    return () => subscription.remove();
  }, []);

  // Bootstrap auth session + language from Supabase on first load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      restoreLanguage().catch(() => {}),
      withTimeout(supabase.auth.getSession(), 8000, { data: { session: null }, error: null }),
    ]).then(([, { data: { session: s } }]) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect based on auth state — simple, no extra state
  useEffect(() => {
    if (loading) return;

    async function redirect() {
      if ((segments[0] as string) === 'onboarding') return;

      const done = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (!done) {
        router.replace('/onboarding' as any);
        return;
      }

      if (!session && segments[0] !== '(auth)') {
        router.replace('/(auth)/login');
      } else if (session && segments[0] === '(auth)') {
        router.replace('/(tabs)/discover');
      }
    }

    redirect();
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.plantPrimary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Slot />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
