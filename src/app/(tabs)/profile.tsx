import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/stores/auth-store';
import { useHerbarium } from '@/hooks/useHerbarium';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { TOTAL_PLANTS } from '@/constants/plants';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { email, displayName, avatarUrl, quotaUsed, quotaTotal, loading, updating, handleSignOut, updateDisplayName } = useProfile();
  const { collected } = useHerbarium(user?.id ?? '');
  const { plants: seasonPlants, season } = useSeasonRecap(user?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.plantPrimary} />
      </View>
    );
  }

  const initial = (displayName[0] ?? '?').toUpperCase();
  const quotaFraction = quotaTotal > 0 ? quotaUsed / quotaTotal : 0;
  const collectFraction = collected.size / TOTAL_PLANTS;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={draft}
              onChangeText={setDraft}
              autoFocus
              maxLength={30}
              onSubmitEditing={async () => {
                try {
                  await updateDisplayName(draft);
                  setEditing(false);
                } catch (e: any) {
                  Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
                }
              }}
            />
            <TouchableOpacity
              onPress={async () => {
                try {
                  await updateDisplayName(draft);
                  setEditing(false);
                } catch (e: any) {
                  Alert.alert(t('common.error'), e.message ?? t('error.loadFailed'));
                }
              }}
              disabled={updating || !draft.trim()}
            >
              {updating
                ? <ActivityIndicator size="small" color={colors.plantPrimary} />
                : <Text style={styles.saveText}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editRow}
            onPress={() => { setDraft(displayName); setEditing(true); }}
          >
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.email}>{email}</Text>
      </View>

      {/* Collection stats card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('profile.collectedCount')}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: collectFraction }]} />
          <View style={[styles.progressEmpty, { flex: 1 - collectFraction }]} />
        </View>
        <Text style={styles.quotaText}>{collected.size} / {TOTAL_PLANTS}</Text>
      </View>

      {/* Season recap card */}
      <TouchableOpacity style={styles.card} onPress={() => router.push('/recap' as any)} activeOpacity={0.7}>
        <Text style={styles.cardLabel}>{season.label} · {t('herbarium.recap')}</Text>
        <Text style={styles.seasonCount}>{seasonPlants.length}</Text>
        <Text style={styles.cardSubLabel}>{t('herbarium.recapCollected', { count: seasonPlants.length })}</Text>
      </TouchableOpacity>

      {/* Quota card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('profile.monthlyQuota')}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: quotaFraction }]} />
          <View style={[styles.progressEmpty, { flex: 1 - quotaFraction }]} />
        </View>
        <Text style={styles.quotaText}>
          {quotaUsed} / {quotaTotal}
        </Text>
      </View>

      {/* Friends link */}
      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/(tabs)/social' as any)}>
        <Text style={styles.menuText}>{t('profile.friends')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Settings link */}
      <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/settings' as any)}>
        <Text style={styles.menuText}>{t('profile.settings')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  center:         { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  // Avatar section
  avatarSection:  { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md },
  avatarImage:    { width: 80, height: 80, borderRadius: 40 },
  avatarCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.plantPrimary, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xxl, color: colors.white },
  editRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  displayName:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  editIcon:       { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  nameInput:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text, borderBottomWidth: 1.5, borderBottomColor: colors.plantPrimary, minWidth: 120, paddingVertical: 2 },
  saveText:       { color: colors.plantPrimary, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.sm },
  email:          { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  // Stats / quota cards
  card:           { width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
  cardLabel:      { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  cardSubLabel:   { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  seasonCount:    { fontFamily: typography.fontFamily.display, fontSize: 40, color: colors.plantPrimary, lineHeight: 48 },
  progressTrack:  { width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  progressFill:   { backgroundColor: colors.plantPrimary },
  progressEmpty:  { backgroundColor: colors.border },
  quotaText:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },

  // Menu row
  menuRow:        { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  menuText:       { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow:      { fontSize: typography.fontSize.lg, color: colors.textSecondary },

  // Sign out
  signOutButton:  { marginTop: spacing.md, borderWidth: 1.5, borderColor: '#c0392b', borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  signOutText:    { color: '#c0392b', fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
});
