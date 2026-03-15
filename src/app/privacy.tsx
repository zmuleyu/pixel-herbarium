import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/services/supabase';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  const [mapVisible, setMapVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('map_visible')
        .eq('id', user!.id)
        .single();
      if (data != null) setMapVisible(data.map_visible ?? true);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  async function toggleMapVisible(value: boolean) {
    if (!user || saving) return;
    setMapVisible(value);
    setSaving(true);
    await (supabase as any)
      .from('profiles')
      .update({ map_visible: value, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('privacy.deleteAccount'),
      t('privacy.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.ok'), style: 'destructive', onPress: () => {} },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* Back row */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
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

          {/* Export data */}
          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuText}>{t('privacy.exportData')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Delete account */}
          <TouchableOpacity style={styles.deleteRow} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>{t('privacy.deleteAccount')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },

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
