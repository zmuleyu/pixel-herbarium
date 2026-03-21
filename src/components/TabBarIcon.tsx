import React from 'react';
import Svg, { Rect, Line, Circle, Ellipse, Path, G } from 'react-native-svg';

export type TabIconName = 'home' | 'checkin' | 'settings';

interface TabBarIconProps {
  name: TabIconName;
  focused: boolean;
  color: string;
  size: number;
}

function HomeIcon({ focused, color, size }: Omit<TabBarIconProps, 'name'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Open journal book */}
      <Rect
        x={3} y={5} width={18} height={15} rx={2}
        stroke={color} strokeWidth={1.5}
        fill={focused ? color : 'none'} fillOpacity={focused ? 0.1 : 0}
      />
      {/* Spine */}
      <Line x1={12} y1={5} x2={12} y2={20} stroke={color} strokeWidth={1} opacity={0.6} />
      {/* Flower on left page */}
      <Circle cx={7.5} cy={11} r={2.5} fill="#f5d5d0" opacity={focused ? 0.9 : 0.6} />
      <Circle cx={7.5} cy={11} r={1} fill="#d4a645" opacity={0.5} />
      {/* Lines on right page */}
      <Line x1={14} y1={10} x2={19} y2={10} stroke={color} strokeWidth={1} opacity={0.35} />
      <Line x1={14} y1={13} x2={18} y2={13} stroke={color} strokeWidth={1} opacity={0.35} />
      <Line x1={14} y1={16} x2={17} y2={16} stroke={color} strokeWidth={1} opacity={0.25} />
    </Svg>
  );
}

function CheckinIcon({ focused, color, size }: Omit<TabBarIconProps, 'name'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dashed stamp circle */}
      <Circle
        cx={12} cy={12} r={9}
        stroke={color} strokeWidth={1.5}
        strokeDasharray="3 2"
        fill={focused ? color : 'none'} fillOpacity={focused ? 0.08 : 0}
      />
      {/* Sakura in center */}
      <G transform="translate(12, 11)">
        <Ellipse cx={0} cy={-4} rx={2.5} ry={3.5} fill="#f5d5d0" opacity={focused ? 0.9 : 0.65} />
        <Ellipse cx={0} cy={-4} rx={2.5} ry={3.5} fill="#f5d5d0" opacity={focused ? 0.9 : 0.65} rotation={72} origin="0, 0" />
        <Ellipse cx={0} cy={-4} rx={2.5} ry={3.5} fill="#f5d5d0" opacity={focused ? 0.85 : 0.6} rotation={144} origin="0, 0" />
        <Ellipse cx={0} cy={-4} rx={2.5} ry={3.5} fill="#f5d5d0" opacity={focused ? 0.85 : 0.6} rotation={216} origin="0, 0" />
        <Ellipse cx={0} cy={-4} rx={2.5} ry={3.5} fill="#f5d5d0" opacity={focused ? 0.9 : 0.65} rotation={288} origin="0, 0" />
        <Circle cx={0} cy={0} r={1.5} fill="#d4a645" opacity={0.5} />
      </G>
    </Svg>
  );
}

function SettingsIcon({ focused, color, size }: Omit<TabBarIconProps, 'name'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Gear */}
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.5} />
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color} strokeWidth={1.2} strokeLinecap="round"
      />
      {/* Leaf accent */}
      <Path
        d="M17 7c1-2 3-2 3-2s0 2-2 3"
        stroke="#9fb69f" strokeWidth={1} fill="none"
        opacity={focused ? 0.7 : 0.45}
      />
    </Svg>
  );
}

export default function TabBarIcon({ name, focused, color, size }: TabBarIconProps) {
  const props = { focused, color, size };
  switch (name) {
    case 'home': return <HomeIcon {...props} />;
    case 'checkin': return <CheckinIcon {...props} />;
    case 'settings': return <SettingsIcon {...props} />;
  }
}
