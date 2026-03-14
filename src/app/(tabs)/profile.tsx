import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { email, displayName, avatarUrl, quotaUsed, quotaTotal, loading, updating, handleSignOut, updateDisplayName } = useProfile();
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

  return (
    <View style={styles.container}>
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
                await updateDisplayName(draft);
                setEditing(false);
              }}
            />
            <TouchableOpacity
              onPress={async () => { await updateDisplayName(draft); setEditing(false); }}
              disabled={updating || !draft.trim()}
            >
              {updating
                ? <ActivityIndicator size="small" color={colors.plantPrimary} />
                : <Text style={styles.saveText}>保存</Text>}
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

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.xl, gap: spacing.lg },
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

  // Quota card
  card:           { width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm, alignItems: 'center' },
  cardLabel:      { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  progressTrack:  { width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row' },
  progressFill:   { backgroundColor: colors.plantPrimary },
  progressEmpty:  { backgroundColor: colors.border },
  quotaText:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },

  // Sign out
  signOutButton:  { marginTop: spacing.md, borderWidth: 1.5, borderColor: '#c0392b', borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  signOutText:    { color: '#c0392b', fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
});
