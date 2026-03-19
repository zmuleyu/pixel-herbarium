import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '@/constants/theme';

export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // TODO Phase 2: Record referral in share_records
    const timer = setTimeout(() => router.replace('/(tabs)/home'), 2000);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌸</Text>
      <Text style={styles.message}>{t('invite.welcome')}</Text>
      <ActivityIndicator color={colors.plantPrimary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  message: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * typography.lineHeight,
  },
  spinner: { marginTop: spacing.lg },
});
