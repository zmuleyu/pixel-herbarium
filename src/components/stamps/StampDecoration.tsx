import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
import type { StampStyleId } from '@/types/hanami';

interface StampDecorationProps {
  decorationKey: 'petals' | 'branch' | 'stars'; // 'none' filtered out before render
  color: string;
  styleId: StampStyleId;
}

/** Stamp dimensions used for SVG sizing. Fallback to classic if unknown. */
const STAMP_SIZES: Record<StampStyleId, { w: number; h: number }> = {
  classic:   { w: 130, h: 96 },
  relief:    { w: 120, h: 90 },
  postcard:  { w: 120, h: 130 },
  medallion: { w: 72,  h: 72 },
  window:    { w: 116, h: 130 },
  minimal:   { w: 100, h: 40 }, // petals not meaningful; renders simple row
};

function PetalsDecoration({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      {/* top-left corner petals */}
      <Ellipse cx={8} cy={8} rx={5} ry={3} fill={color} opacity={0.35} rotation={-30} originX={8} originY={8} />
      <Ellipse cx={14} cy={5} rx={4} ry={2.5} fill={color} opacity={0.30} rotation={15} originX={14} originY={5} />
      {/* bottom-right corner petals */}
      <Ellipse cx={w - 8} cy={h - 8} rx={5} ry={3} fill={color} opacity={0.35} rotation={150} originX={w - 8} originY={h - 8} />
      <Ellipse cx={w - 14} cy={h - 5} rx={4} ry={2.5} fill={color} opacity={0.30} rotation={-165} originX={w - 14} originY={h - 5} />
      {/* top-right accent */}
      <Ellipse cx={w - 7} cy={9} rx={3.5} ry={2} fill={color} opacity={0.25} rotation={60} originX={w - 7} originY={9} />
    </Svg>
  );
}

function BranchDecoration({ w, h, color }: { w: number; h: number; color: string }) {
  const mid = w / 2;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      {/* thin arc along top edge */}
      <Path
        d={`M ${mid - 22} 6 Q ${mid} 2 ${mid + 22} 6`}
        stroke={color}
        strokeWidth={1}
        fill="none"
        opacity={0.45}
      />
      {/* small flower circles */}
      <Circle cx={mid - 20} cy={6} r={2.5} fill={color} opacity={0.35} />
      <Circle cx={mid} cy={3} r={2} fill={color} opacity={0.30} />
      <Circle cx={mid + 20} cy={6} r={2.5} fill={color} opacity={0.35} />
    </Svg>
  );
}

function StarsDecoration({ w, h, color }: { w: number; h: number; color: string }) {
  const star = (cx: number, cy: number, r: number) => (
    <Path
      d={`M ${cx} ${cy - r} L ${cx + r * 0.35} ${cy - r * 0.35} L ${cx + r} ${cy} L ${cx + r * 0.35} ${cy + r * 0.35} L ${cx} ${cy + r} L ${cx - r * 0.35} ${cy + r * 0.35} L ${cx - r} ${cy} L ${cx - r * 0.35} ${cy - r * 0.35} Z`}
      fill={color}
      opacity={0.30}
      key={`${cx}-${cy}`}
    />
  );
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      {star(6, 6, 4)}
      {star(w - 6, 6, 4)}
      {star(6, h - 6, 4)}
      {star(w - 6, h - 6, 4)}
    </Svg>
  );
}

export function StampDecoration({ decorationKey, color, styleId }: StampDecorationProps) {
  const { w, h } = STAMP_SIZES[styleId] ?? STAMP_SIZES.classic;

  switch (decorationKey) {
    case 'petals':
      return <PetalsDecoration w={w} h={h} color={color} />;
    case 'branch':
      return <BranchDecoration w={w} h={h} color={color} />;
    case 'stars':
      return <StarsDecoration w={w} h={h} color={color} />;
  }
}
