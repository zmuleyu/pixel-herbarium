import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { useCheckinStore } from '@/stores/checkin-store';
import { supabase } from '@/services/supabase';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

const LANGUAGES = [
  { code: 'ja' as const, label: '日本語' },
  { code: 'en' as const, label: 'English' },
];

const DESTRUCTIVE_COLOR = '#ff3b30';

export default function SettingsTabScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session, user } = useAuthStore();
  const appVersion = Constants.expoConfig?.version ?? '1.1.0';

  async function handleExport() {
    try {
      const data = useCheckinStore.getState().history;
      const json = JSON.stringify(data, null, 2);
      const fileUri = (FileSystem.cacheDirectory ?? '') + 'ph-export.json';
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('settings.exportData'),
        });
      } else {
        Alert.alert('', t('settings.exportDataDesc'));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Export failed');
    }
  }

  function handleDeleteData() {
    Alert.alert(t('settings.deleteData'), t('settings.deleteDataConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          useCheckinStore.setState({ history: [] });
          await AsyncStorage.clear();
          Alert.alert('', t('settings.deleteDataDone'));
        },
      },
    ]);
  }

  function handleSignOut() {
    Alert.alert(t('settings.signOut'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(tabs)/home' as any);
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              useCheckinStore.setState({ history: [] });
              await AsyncStorage.clear();
              await supabase.auth.signOut();
              router.replace('/(tabs)/home' as any);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete account');
            }
          },
        },
      ],
    );
  }

  const displayName: string | undefined = user?.user_metadata?.display_name as string | undefined;
  const email = user?.email;

  return (
    <ScrollView
      testID="settings.container"
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Section 1: Account */}
      <Text style={styles.sectionLabel}>{t('settings.accountSection')}</Text>
      {!session ? (
        <TouchableOpacity
          testID="settings.login"
          style={styles.menuRow}
          onPress={() => router.push('/(auth)/login' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuText}>{t('settings.login')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.menuRow}>
          <View style={styles.accountInfo}>
            {displayName ? (
              <Text style={styles.menuText}>{displayName}</Text>
            ) : null}
            {email ? (
              <Text style={[styles.subText, displayName ? styles.subTextSmall : null]}>
                {email}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Section 2: Data Management */}
      <Text style={styles.sectionLabel}>{t('settings.dataSection')}</Text>
      <TouchableOpacity style={styles.menuRow} onPress={handleExport} activeOpacity={0.7}>
        <Text style={styles.menuText}>{t('settings.exportData')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={handleDeleteData} activeOpacity={0.7}>
        <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>
          {t('settings.deleteData')}
        </Text>
        <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
      </TouchableOpacity>

      {/* Section 3: General */}
      <Text style={styles.sectionLabel}>{t('settings.generalSection')}</Text>
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
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => router.push('/privacy' as any)}
        activeOpacity={0.7}
      >
        <Text style={styles.menuText}>{t('profile.privacySettings')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => router.push('/guide' as any)}
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text style={styles.menuText}>{t('guide.settings.title')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Section 4: Other */}
      <Text style={styles.sectionLabel}>{t('settings.otherSection')}</Text>
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => Linking.openURL('mailto:support@pixelherbarium.app')}
        activeOpacity={0.7}
      >
        <Text style={styles.menuText}>{t('settings.feedback')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <View style={styles.menuRow}>
        <Text style={styles.menuText}>{t('settings.version')}</Text>
        <Text style={styles.versionText}>v{appVersion}</Text>
      </View>
      {session && (
        <>
          <TouchableOpacity style={styles.menuRow} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>
              {t('settings.signOut')}
            </Text>
            <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>
              {t('settings.deleteAccount')}
            </Text>
            <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
          </TouchableOpacity>
        </>
      )}
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
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: -spacing.sm / 2,
    paddingHorizontal: spacing.sm,
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
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  subText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  subTextSmall: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
