import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, STAMP_COLOR_PALETTE } from '@/constants/theme';
import type { CustomOptions } from '@/types/hanami';

interface CustomizationPanelProps {
  options: CustomOptions;
  onChange: (patch: Partial<CustomOptions>) => void;
  /** Always season.themeColor — used to identify the season-default swatch */
  seasonColor: string;
}

// ── Chip component ───────────────────────────────────────────────────────────

function Chip({
  label, selected, onPress, themeColor,
}: { label: string; selected: boolean; onPress: () => void; themeColor: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: themeColor + '22', borderColor: themeColor, borderWidth: 1.5 }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && { color: themeColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CustomizationPanel({ options, onChange, seasonColor }: CustomizationPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const themeColor = seasonColor || '#e8a5b0'; // sakura fallback

  return (
    <View>
      {/* Toggle row */}
      <TouchableOpacity
        style={[styles.toggleRow, { borderColor: themeColor }]}
        onPress={() => setIsOpen(v => !v)}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={[styles.toggleLabel, { color: themeColor }]}>
          ✎ {t('customize.title')}
        </Text>
        <Text style={[styles.chevron, { color: themeColor }]}>{isOpen ? '▴' : '▾'}</Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {isOpen && (
        <View style={styles.panel}>

          {/* ── Row 1: Line color ── */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('customize.lineColor')}</Text>
            <View style={styles.colorRow}>
              {STAMP_COLOR_PALETTE.map((hex, i) => {
                const isSelected = options.customColor === hex;
                const isSeasonDefault = i === 0 && options.customColor === undefined;
                return (
                  <TouchableOpacity
                    key={hex}
                    onPress={() => onChange({ customColor: i === 0 && isSeasonDefault ? undefined : hex })}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: hex },
                      (isSelected || isSeasonDefault) && { borderWidth: 2, borderColor: '#333' },
                    ]}
                    activeOpacity={0.7}
                  >
                    {isSeasonDefault && (
                      <Text style={styles.seasonBadge}>季</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => onChange({ customColor: undefined })}
                style={styles.resetColor}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetText, { color: themeColor }]}>
                  {t('customize.seasonDefault')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Row 2: Effect ── */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('customize.effect')}</Text>
            <View style={styles.chipRow}>
              {([ 'none', 'shadow', 'glow' ] as const).map(v => (
                <Chip
                  key={v}
                  label={t(`customize.effect${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                  selected={options.effectType === v}
                  onPress={() => onChange({ effectType: v })}
                  themeColor={themeColor}
                />
              ))}
            </View>
          </View>

          {/* ── Row 3: Caption text ── */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('customize.addText')}</Text>
            <View style={styles.chipRow}>
              {([ 'none', 'hanakotoba', 'custom' ] as const).map(v => (
                <Chip
                  key={v}
                  label={t(`customize.text${v === 'none' ? 'None' : v === 'hanakotoba' ? 'Hanakotoba' : 'Custom'}` as any)}
                  selected={options.textMode === v}
                  onPress={() => onChange({ textMode: v })}
                  themeColor={themeColor}
                />
              ))}
            </View>
            {options.textMode === 'custom' && (
              <TextInput
                style={[styles.textInput, { borderColor: themeColor }]}
                value={options.customTextValue}
                onChangeText={text => onChange({ customTextValue: text.slice(0, 12) })}
                placeholder={t('customize.textPlaceholder')}
                maxLength={12}
                returnKeyType="done"
                placeholderTextColor={colors.textSecondary}
              />
            )}
          </View>

          {/* ── Row 4: Decoration ── */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('customize.decoration')}</Text>
            <View style={styles.chipRow}>
              {([ 'none', 'petals', 'branch', 'stars' ] as const).map(v => (
                <Chip
                  key={v}
                  label={t(`customize.decor${v === 'none' ? 'None' : v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                  selected={options.decorationKey === v}
                  onPress={() => onChange({ decorationKey: v })}
                  themeColor={themeColor}
                />
              ))}
            </View>
          </View>

        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minHeight: 36,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 12,
  },
  panel: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonBadge: {
    fontSize: 7,
    color: '#fff',
    fontWeight: 'bold',
  },
  resetColor: {
    marginLeft: spacing.xs,
  },
  resetText: {
    fontSize: 9,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  textInput: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    color: colors.text,
    height: 34,
  },
});
