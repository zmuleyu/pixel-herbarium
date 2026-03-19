import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { stamp as stampTheme } from '@/constants/theme';
import type { StampPosition } from '@/types/hanami';

const POSITIONS: { key: StampPosition; style: object }[] = [
  { key: 'top-left', style: { top: stampTheme.padding, left: stampTheme.padding } },
  { key: 'top-right', style: { top: stampTheme.padding, right: stampTheme.padding } },
  { key: 'bottom-left', style: { bottom: stampTheme.padding, left: stampTheme.padding } },
  { key: 'bottom-right', style: { bottom: stampTheme.padding, right: stampTheme.padding } },
];

const CORNER_LABELS: Record<StampPosition, string> = {
  'top-left': '左上', 'top-right': '右上', 'bottom-left': '左下', 'bottom-right': '右下',
};

interface PositionSelectorProps {
  selected: StampPosition;
  onSelect: (pos: StampPosition) => void;
  themeColor: string;
}

export function PositionSelector({ selected, onSelect, themeColor }: PositionSelectorProps) {
  return (
    <>
      {POSITIONS.map(({ key, style }) => {
        const active = key === selected;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.dot, style, { position: 'absolute' }]}
            onPress={() => onSelect(key)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`${CORNER_LABELS[key]}位置${active ? '、選択中' : ''}`}
          >
            <View style={[styles.inner, active
              ? { backgroundColor: themeColor, borderColor: themeColor }
              : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.5)' }
            ]} />
            {active && <View style={[styles.glow, { backgroundColor: `${themeColor}4D` }]} />}
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  dot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  glow: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
});
