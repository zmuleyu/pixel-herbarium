import '../i18n'; // initialize i18n before any screen renders
import { restoreLanguage } from '../i18n';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/services/supabase';
import { colors } from '@/constants/theme';
import { usePushToken } from '@/hooks/usePushToken';
import { useOTAUpdate } from '@/hooks/useOTAUpdate';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { OTAUpdateBanner } from '@/components/OTAUpdateBanner';
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
  const [isReady, setIsReady] = useState(false);
  usePushToken();
  const { isDownloading } = useOTAUpdate();

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
      restoreLanguage().catch(() => {}), // SecureStore can throw — never let it reject
      supabase.auth.getSession(),
    ]).then(([, { data: { session: s } }]) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If getSession fails, still unblock the app
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect chain — runs after each navigation until final destination reached.
  // segments in deps is safe: isReady gate hides intermediate states from user.
  useEffect(() => {
    if (loading) return;

    async function redirect() {
      const inAuthGroup = segments[0] === '(auth)';
      const inOnboarding = (segments[0] as string) === 'onboarding';

      // Already on onboarding — show it
      if (inOnboarding) {
        setIsReady(true);
        return;
      }

      // First-time launch: check onboarding
      const done = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (!done) {
        router.replace('/onboarding' as any);
        return;
      }

      // Auth redirects
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
        return;
      }
      if (session && inAuthGroup) {
        router.replace('/(tabs)/discover');
        return;
      }

      // Arrived at correct destination
      setIsReady(true);
    }

    redirect();
  }, [session, loading, segments]);

  // Reset on login/logout so redirect chain re-evaluates
  useEffect(() => {
    setIsReady(false);
  }, [session]);

  // Always render Slot (keeps expo-router navigation tree alive).
  // Splash overlay hides content until redirect chain completes.
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <Slot />
      <OTAUpdateBanner isDownloading={isDownloading} isReady={false} />
      {(loading || !isReady) && (
        <View style={[StyleSheet.absoluteFill, styles.splash]}>
          <ActivityIndicator color={colors.plantPrimary} />
        </View>
      )}
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
