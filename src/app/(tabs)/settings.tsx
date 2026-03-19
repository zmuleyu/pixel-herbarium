import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { setLanguage } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

const LANGUAGES = [
  { code: 'ja' as const, label: '日本語' },
  { code: 'en' as const, label: 'English' },
];

export default function SettingsTabScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session } = useAuthStore();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView testID="settings.container" style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Language selector */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('settings.language')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, isActive && styles.langBtnActive]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langBtnText, isActive && styles.langBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Login (guest-first: only when not logged in) */}
      {!session && (
        <TouchableOpacity
          testID="settings.login"
          style={styles.menuRow}
          onPress={() => router.push('/(auth)/login' as any)}
        >
          <Text style={styles.menuText}>{t('settings.login')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Privacy settings */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => router.push('/privacy' as any)}
      >
        <Text style={styles.menuText}>{t('profile.privacySettings')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Version */}
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{t('settings.version')}</Text>
        <Text style={styles.versionText}>v{appVersion}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLabel: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: colors.plantPrimary,
    borderColor: colors.plantPrimary,
  },
  langBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  langBtnTextActive: { color: colors.white },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuText: { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow: { fontSize: typography.fontSize.lg, color: colors.textSecondary },
  versionText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
});
