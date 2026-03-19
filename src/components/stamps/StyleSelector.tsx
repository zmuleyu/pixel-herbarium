import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { STAMP_STYLES } from '@/constants/stamp-styles';
import { spacing, borderRadius } from '@/constants/theme';
import type { StampStyleId } from '@/types/hanami';

interface StyleSelectorProps {
  selected: StampStyleId | string;
  onSelect: (style: StampStyleId) => void;
  themeColor: string;
}

export function StyleSelector({ selected, onSelect, themeColor }: StyleSelectorProps) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {STAMP_STYLES.map(({ id, nameKey }) => {
        const active = id === selected;
        return (
          <TouchableOpacity
            key={id}
            style={[
              styles.card,
              active
                ? { borderColor: themeColor, borderWidth: 1.5, backgroundColor: `${themeColor}15` }
                : styles.cardInactive,
            ]}
            onPress={() => onSelect(id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${t(nameKey)}${active ? '、選択中' : ''}`}
          >
            <Text
              style={[
                styles.label,
                { color: active ? themeColor : '#999', fontWeight: active ? 'bold' : 'normal' },
              ]}
            >
              {t(nameKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  cardInactive: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  label: {
    fontSize: 12,
  },
});
