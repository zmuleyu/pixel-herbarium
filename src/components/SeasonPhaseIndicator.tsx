import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getSeasonPhase, type BloomPhase } from '@/utils/date';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

interface SeasonPhaseIndicatorProps {
  bloomMonths: number[];
  rarity: number;
  availableWindow: string | null;
}

// Petal-shape progress: 3 petals representing 花開き → 見頃 → 花散り
const PHASE_CONFIG: Record<BloomPhase, { petals: number; icon: string; labelKey: string }> = {
  budding:  { petals: 1, icon: '🌱', labelKey: 'season.budding' },
  peak:     { petals: 2, icon: '🌸', labelKey: 'season.peak' },
  falling:  { petals: 3, icon: '🍃', labelKey: 'season.falling' },
  dormant:  { petals: 0, icon: '🌿', labelKey: 'season.dormant' },
  always:   { petals: 3, icon: '🌿', labelKey: 'season.always' },
};

const PETAL_COLOR_ACTIVE = colors.plantPrimary;
const PETAL_COLOR_INACTIVE = colors.border;

export function SeasonPhaseIndicator({ bloomMonths, rarity, availableWindow }: SeasonPhaseIndicatorProps) {
  const { t } = useTranslation();
  const { phase } = getSeasonPhase(bloomMonths, rarity, availableWindow);

  // Don't show for always-available plants (★ common, no seasonal interest)
  if (phase === 'always') return null;

  const config = PHASE_CONFIG[phase];

  return (
    <View style={styles.container}>
      {/* Icon + label */}
      <View style={styles.labelRow}>
        <Text style={styles.icon} accessibilityLabel={phase}>{config.icon}</Text>
        <Text style={styles.label}>{t(config.labelKey)}</Text>
      </View>

      {/* Petal progress: 3 circles */}
      <View style={styles.petalRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.petal,
              { backgroundColor: i <= config.petals ? PETAL_COLOR_ACTIVE : PETAL_COLOR_INACTIVE },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontFamily: typography.fontFamily.display,
  },
  petalRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  petal: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
