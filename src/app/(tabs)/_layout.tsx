import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  labelKey: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

// Single source of truth — order is fixed and must never change (OTA safety).
// To show/hide a tab via OTA: toggle its `visible` flag in FEATURES, never add/remove entries.
const ALL_TABS: (TabConfig & { visible: boolean })[] = [
  { name: 'home',      labelKey: 'tabs.home',      icon: 'home-outline',      iconActive: 'home',      visible: true },
  { name: 'checkin',   labelKey: 'tabs.checkin',    icon: 'camera-outline',    iconActive: 'camera',    visible: true },
  { name: 'footprint', labelKey: 'tabs.footprint',  icon: 'footsteps-outline', iconActive: 'footsteps', visible: true },
  { name: 'settings',  labelKey: 'tabs.settings',   icon: 'settings-outline',  iconActive: 'settings',  visible: true },
  { name: 'discover',  labelKey: 'tabs.discover',   icon: 'camera-outline',    iconActive: 'camera',    visible: false },
  { name: 'herbarium', labelKey: 'tabs.herbarium',  icon: 'leaf-outline',      iconActive: 'leaf',      visible: false },
  { name: 'map',       labelKey: 'tabs.cityMap',    icon: 'map-outline',       iconActive: 'map',       visible: false },
  { name: 'social',    labelKey: 'tabs.social',     icon: 'people-outline',    iconActive: 'people',    visible: false },
  { name: 'profile',   labelKey: 'tabs.profile',    icon: 'person-outline',    iconActive: 'person',    visible: false },
];

export default function TabLayout() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize.xs,
        },
      }}
    >
      {/* All tabs rendered in fixed order — never add/remove entries (OTA hook safety).
          Toggle visibility only via the `visible` flag above. */}
      {ALL_TABS.map(({ name, labelKey, icon, iconActive, visible }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={visible ? {
            title: t(labelKey),
            tabBarTestID: `tab.${name}`,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? iconActive : icon} size={size} color={color} />
            ),
          } : { href: null }}
        />
      ))}
    </Tabs>
  );
}
