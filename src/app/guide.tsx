// src/app/guide.tsx
// Full-screen "How to Use" (使い方ガイド) page, reachable from Settings.
// Users can re-watch any feature's coach-mark guide or reset all at once.

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { resetGuide, resetAllGuides } from '@/utils/guide-storage';

const FEATURES = [
  { key: 'discover',  icon: '📷', labelKey: 'guide.settings.featureDiscover'  },
  { key: 'stamp',     icon: '🎨', labelKey: 'guide.settings.featureStamp'     },
  { key: 'herbarium', icon: '🌸', labelKey: 'guide.settings.featureHerbarium' },
  { key: 'map',       icon: '🗺',  labelKey: 'guide.settings.featureMap'       },
] as const;

export default function GuideScreen() {
  const { t } = useTranslation();

  async function handleReset(feature: string) {
    await resetGuide(feature);
    Alert.alert('', t('guide.settings.resetDone'));
  }

  async function handleResetAll() {
    await resetAllGuides();
    Alert.alert('', t('guide.settings.resetDone'));
  }

  return (
    <>
      <Stack.Screen options={{ title: t('guide.settings.title') }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>{t('guide.settings.subtitle')}</Text>

        {FEATURES.map((f) => (
          <View key={f.key} style={styles.card}>
            <Text style={styles.cardIcon}>{f.icon}</Text>
            <Text style={styles.cardLabel}>{t(f.labelKey)}</Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => handleReset(f.key)}
              accessibilityRole="button"
            >
              <Text style={styles.resetBtnText}>もう一度見る</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.resetAllBtn}
          onPress={handleResetAll}
          accessibilityRole="button"
        >
          <Text style={styles.resetAllBtnText}>{t('guide.settings.resetAll')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardIcon: {
    fontSize: typography.fontSize.xl,
  },
  cardLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  resetBtn: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resetBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  resetAllBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetAllBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
  },
});
