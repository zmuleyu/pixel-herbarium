import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';

export default function CheckinScreen() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgTint }]}>
      <Text style={styles.emoji}>{season.iconEmoji}</Text>
      <Text style={styles.title}>{t('checkin.comingSoon')}</Text>
      <Text style={styles.subtitle}>{t('checkin.comingSoonSub')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
