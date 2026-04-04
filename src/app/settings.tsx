import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { setLanguage } from '@/i18n';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

const LANGUAGES = [
  { code: 'ja' as const, label: '日本語' },
  { code: 'en' as const, label: 'English' },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings' as any);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Back */}
      <TouchableOpacity onPress={handleBack} style={styles.backRow}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>{t('profile.settings')}</Text>

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

      {/* Privacy settings link */}
      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/privacy' as any)}>
        <Text style={styles.menuText}>{t('profile.privacySettings')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Version */}
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{t('settings.version')}</Text>
        <Text style={styles.versionText}>v{appVersion}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  backRow:  { marginBottom: spacing.xs },
  backText: { color: colors.plantPrimary, fontSize: typography.fontSize.sm },

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
  menuText:  { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow: { fontSize: typography.fontSize.lg, color: colors.textSecondary },

  versionText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
});
