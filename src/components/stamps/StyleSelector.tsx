import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, spacing } from '@/constants/theme';
import type { StampStyle } from '@/types/hanami';

const STYLES: { key: StampStyle; labelKey: string }[] = [
  { key: 'pixel', labelKey: 'stamp.pixel' },
  { key: 'seal', labelKey: 'stamp.seal' },
  { key: 'minimal', labelKey: 'stamp.minimal' },
];

interface StyleSelectorProps {
  selected: StampStyle;
  onSelect: (style: StampStyle) => void;
  themeColor: string;
}

export function StyleSelector({ selected, onSelect, themeColor }: StyleSelectorProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {STYLES.map(({ key, labelKey }) => {
        const active = key === selected;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, active
              ? { backgroundColor: `${themeColor}18`, borderColor: themeColor, borderWidth: 1.5 }
              : { backgroundColor: '#f8f8f8', borderColor: '#e0e0e0', borderWidth: 1 }
            ]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${t(labelKey)}${active ? '、選択中' : ''}`}
          >
            <Text style={[styles.label, { color: active ? themeColor : '#999', fontWeight: active ? 'bold' : 'normal' }]}>
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  label: { fontSize: 12 },
});
