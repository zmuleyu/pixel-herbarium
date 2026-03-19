import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { stamp as stampTheme, colors, spacing } from '@/constants/theme';
import type { StampPosition } from '@/types/hanami';

// 3×3 grid positions in row-major order
const GRID: StampPosition[][] = [
  ['top-left', 'top-center', 'top-right'],
  ['middle-left', 'center', 'middle-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
];

const POSITION_LABELS: Record<StampPosition, string> = {
  'top-left': '左上', 'top-center': '上', 'top-right': '右上',
  'middle-left': '左', 'center': '中央', 'middle-right': '右',
  'bottom-left': '左下', 'bottom-center': '下', 'bottom-right': '右下',
};

// Map grid position to row/col index for thumbnail indicator
function posToGridIndex(pos: StampPosition): { row: number; col: number } {
  for (let r = 0; r < GRID.length; r++) {
    const c = GRID[r].indexOf(pos);
    if (c !== -1) return { row: r, col: c };
  }
  return { row: 2, col: 2 }; // fallback: bottom-right
}

interface PositionSelectorProps {
  selected: StampPosition;
  onSelect: (pos: StampPosition) => void;
  themeColor: string;
}

export function PositionSelector({ selected, onSelect, themeColor }: PositionSelectorProps) {
  const { row: selRow, col: selCol } = posToGridIndex(selected);

  return (
    <View style={styles.wrapper}>
      {/* 3×3 Grid */}
      <View style={styles.grid}>
        {GRID.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map((pos) => {
              const active = pos === selected;
              const isCenter = pos === 'center';
              return (
                <TouchableOpacity
                  key={pos}
                  style={[styles.cell, isCenter && styles.cellCenter]}
                  onPress={() => onSelect(pos)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${POSITION_LABELS[pos]}位置${active ? '、選択中' : ''}`}
                >
                  <View style={[
                    styles.dot,
                    active
                      ? { backgroundColor: themeColor, borderColor: themeColor }
                      : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]} />
                  {active && <View style={[styles.glow, { backgroundColor: `${themeColor}4D` }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Thumbnail preview */}
      <View style={styles.thumbnail}>
        <View style={styles.thumbBorder}>
          <View style={[
            styles.thumbIndicator,
            {
              backgroundColor: themeColor,
              top: 2 + selRow * 10,
              left: 2 + selCol * 12,
            },
          ]} />
        </View>
        <Text style={styles.thumbLabel}>{POSITION_LABELS[selected]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: stampTheme.padding,
    left: stampTheme.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // 3×3 Grid
  grid: { gap: 2 },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  cellCenter: {
    backgroundColor: 'rgba(255,248,220,0.25)', // subtle warning for center position
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  // Thumbnail preview
  thumbnail: {
    alignItems: 'center',
    gap: 2,
  },
  thumbBorder: {
    width: 40,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  thumbIndicator: {
    position: 'absolute',
    width: 10,
    height: 8,
    borderRadius: 2,
  },
  thumbLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
