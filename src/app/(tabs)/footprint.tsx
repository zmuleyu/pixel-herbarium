import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '@/constants/theme';

export default function FootprintScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👣</Text>
      <Text style={styles.title}>{t('footprint.title')}</Text>
      <Text style={styles.subtitle}>{t('footprint.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emoji: { fontSize: 48 },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
