import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/services/supabase';
import { signOut } from '@/services/auth';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [mapVisible, setMapVisible] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('map_visible, notifications_enabled')
          .eq('id', user!.id)
          .single();
        if (error) throw error;
        if (data != null) {
          setMapVisible(data.map_visible ?? true);
          setNotificationsEnabled(data.notifications_enabled ?? true);
        }
      } catch (e) {
        // Network error or missing profile row — use defaults, don't block UI
        console.warn('Privacy: failed to load profile settings', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  async function toggleMapVisible(value: boolean) {
    if (!user || saving) return;
    const previous = mapVisible;
    setMapVisible(value);
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ map_visible: value, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      setMapVisible(previous);
      console.warn('Privacy: toggleMapVisible failed', e);
      Alert.alert(t('common.error'), t('error.loadFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifications(value: boolean) {
    if (!user || saving) return;
    const previous = notificationsEnabled;
    setNotificationsEnabled(value);
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ notifications_enabled: value, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
    } catch (e) {
      setNotificationsEnabled(previous);
      console.warn('Privacy: toggleNotifications failed', e);
      Alert.alert(t('common.error'), t('error.loadFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await (supabase as any)
        .from('discoveries')
        .select('created_at, latitude, longitude, plants(name_ja, name_latin, rarity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const json = JSON.stringify(
        { exported_at: new Date().toISOString(), discoveries: data ?? [] },
        null,
        2,
      );
      const path = (FileSystem.cacheDirectory ?? '') + 'herbarium_export.json';
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    } catch (e) {
      console.warn('Privacy: handleExportData failed', e);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('privacy.deleteAccount'),
      t('privacy.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.ok'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await (supabase as any)
                .from('profiles')
                .update({ deletion_requested_at: new Date().toISOString() })
                .eq('id', user!.id);
              if (error) throw error;
              await signOut();
            } catch (e: any) {
              Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
            }
          },
        },
      ],
    );
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/settings');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Back row */}
      <TouchableOpacity onPress={handleBack} style={styles.backRow}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('profile.privacySettings')}</Text>

      {loading ? (
        <ActivityIndicator color={colors.plantPrimary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {/* Map visibility toggle */}
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('privacy.mapVisibility')}</Text>
              <Text style={styles.rowDesc}>{t('privacy.mapVisibilityDesc')}</Text>
            </View>
            <Switch
              value={mapVisible}
              onValueChange={toggleMapVisible}
              trackColor={{ false: colors.border, true: colors.plantPrimary }}
              thumbColor={colors.white}
              disabled={saving}
            />
          </View>

          {/* Notification toggle */}
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('privacy.notifications')}</Text>
              <Text style={styles.rowDesc}>{t('privacy.notificationsDesc')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.plantPrimary }}
              thumbColor={colors.white}
              disabled={saving}
            />
          </View>

          {/* Export data */}
          <TouchableOpacity style={styles.menuRow} onPress={handleExportData} disabled={saving}>
            <Text style={styles.menuText}>{t('privacy.exportData')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Privacy Policy — external link */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Linking.openURL('https://pixel-herbarium.com/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>{t('settings.privacyPolicy')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Delete account — only for authenticated users */}
          {user && (
            <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount}>
              <Text style={styles.deleteText}>{t('privacy.deleteAccount')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, gap: spacing.md },

  backRow:    { alignSelf: 'flex-start' },
  backText:   { color: colors.plantPrimary, fontSize: typography.fontSize.sm },

  title:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text, marginBottom: spacing.sm },

  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  rowText:    { flex: 1, gap: 2 },
  rowLabel:   { fontSize: typography.fontSize.md, color: colors.text },
  rowDesc:    { fontSize: typography.fontSize.xs, color: colors.textSecondary },

  menuRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  menuText:   { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow:  { fontSize: typography.fontSize.lg, color: colors.textSecondary },

  deleteRow:  { marginTop: spacing.lg, alignItems: 'center' },
  deleteText: { color: '#c0392b', fontSize: typography.fontSize.md },
});
