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

  // Bootstrap auth session from Supabase on first load
  useEffect(() => {
    restoreLanguage(); // fire-and-forget, non-blocking
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect based on auth state once loading is complete
  useEffect(() => {
    if (loading) return;

    async function redirect() {
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = (segments[0] as string) === 'onboarding';

      // First-time launch: show onboarding before auth
      if (!inOnboarding) {
        const done = await SecureStore.getItemAsync(ONBOARDING_KEY);
        if (!done) {
          router.replace('/onboarding' as any);
          return;
        }
      }

      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
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
