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
import { setLanguage } from '@/i18n';
import { useAuthStore } from '@/stores/auth-store';
import { useCheckinStore } from '@/stores/checkin-store';
import { supabase } from '@/services/supabase';
import { colors, typography, spacing, borderRadius, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearAppStorage } from '@/utils/app-storage';

const LANGUAGES = [
  { code: 'ja' as const, label: '日本語' },
  { code: 'en' as const, label: 'English' },
];

const DESTRUCTIVE_COLOR = '#ff3b30';

export default function SettingsTabScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, user } = useAuthStore();
  const appVersion = Constants.expoConfig?.version ?? '1.1.0';

  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);

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
      Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
    }
  }

  function handleDeleteData() {
    Alert.alert(t('settings.deleteData'), t('settings.deleteDataConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.ok'),
        style: 'destructive',
        onPress: async () => {
          try {
            await useCheckinStore.getState().reset();
            await clearAppStorage();
            Alert.alert('', t('settings.deleteDataDone'));
          } catch (e: any) {
            Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
          }
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
          text: t('common.ok'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.functions.invoke('delete-account');
              if (error) throw error;
              await useCheckinStore.getState().reset();
              await clearAppStorage();
              await supabase.auth.signOut();
              router.replace('/(tabs)/home' as any);
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
    >
      {/* App Identity Card */}
      <View
        testID="settings.appIdentityCard"
        style={[styles.identityCard, { backgroundColor: theme.bgTint, borderColor: theme.accent }]}
      >
        <Text style={styles.identityEmoji}>{season.iconEmoji}</Text>
        <Text style={styles.identityName}>{t('auth.appName')}</Text>
        <Text style={styles.identitySubtitle}>{t('settings.title')}</Text>
        <Text style={styles.identityVersion}>
          {t('settings.version')} {appVersion} · {t('settings.appCardSeason', { season: t(season.nameKey), year: new Date().getFullYear() })}
        </Text>
      </View>

      {/* アカウント section */}
      <Text style={styles.sectionLabel}>{t('settings.accountSection')}</Text>
      <View style={styles.group}>
        {!session ? (
          <TouchableOpacity
            testID="settings.login"
            style={styles.groupRow}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>{t('settings.login')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.groupRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{season.iconEmoji}</Text>
            </View>
            <View style={styles.accountInfo}>
              {displayName ? <Text style={styles.menuText}>{displayName}</Text> : null}
              {email ? <Text style={[styles.menuText, displayName ? styles.subTextSmall : null]}>{email}</Text> : null}
            </View>
          </View>
        )}
        {session && (
          <>
            <View style={styles.groupDivider} />
            <TouchableOpacity style={styles.groupRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.signOut')}</Text>
              <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
            </TouchableOpacity>
            <View style={styles.groupDivider} />
            <TouchableOpacity style={styles.groupRow} onPress={handleDeleteData} activeOpacity={0.7}>
              <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.deleteData')}</Text>
              <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
            </TouchableOpacity>
            <View style={styles.groupDivider} />
            <TouchableOpacity style={styles.groupRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.deleteAccount')}</Text>
              <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 一般 section */}
      <Text style={styles.sectionLabel}>{t('settings.generalSection')}</Text>
      <View style={styles.group}>
        <View style={styles.groupRow}>
          <Text style={styles.menuText}>{t('settings.language')}</Text>
          <View testID="settings.langToggle" style={styles.langPills}>
            {LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langPill, isActive && { backgroundColor: colors.plantPrimary }]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langPillText, isActive && styles.langPillTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.groupDivider} />
        <TouchableOpacity style={styles.groupRow} onPress={() => router.push('/privacy' as any)} activeOpacity={0.7}>
          <Text style={styles.menuText}>{t('profile.privacySettings')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.groupDivider} />
        <TouchableOpacity style={styles.groupRow} onPress={() => router.push('/guide' as any)} activeOpacity={0.7}>
          <Text style={styles.menuText}>{t('guide.settings.title')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* サポート section */}
      <Text style={styles.sectionLabel}>{t('settings.otherSection')}</Text>
      <View style={styles.group}>
        <TouchableOpacity style={styles.groupRow} onPress={() => Linking.openURL('mailto:support@pixelherbarium.app')} activeOpacity={0.7}>
          <Text style={styles.menuText}>{t('settings.feedback')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.groupDivider} />
        <TouchableOpacity testID="settings.exportData" style={styles.groupRow} onPress={handleExport} activeOpacity={0.7}>
          <Text style={styles.menuText}>{t('settings.exportData')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  identityCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  identityEmoji: { fontSize: 32 },
  identityName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  identitySubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  identityVersion: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  menuText: { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow: { fontSize: typography.fontSize.lg, color: colors.textSecondary },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#c1e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarEmoji: { fontSize: 18 },
  accountInfo: { flex: 1, gap: 2 },
  subTextSmall: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  langPills: { flexDirection: 'row', gap: spacing.xs },
  langPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  langPillTextActive: { color: colors.white },
});
