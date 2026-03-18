import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, getSeasonTheme } from '@/constants/theme';
import { FEATURES } from '@/constants/features';
import { getActiveSeason } from '@/constants/seasons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  labelKey: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const CHECKIN_TABS: TabConfig[] = [
  { name: 'home',      labelKey: 'tabs.home',      icon: 'home-outline',      iconActive: 'home' },
  { name: 'checkin',   labelKey: 'tabs.checkin',    icon: 'camera-outline',    iconActive: 'camera' },
  { name: 'footprint', labelKey: 'tabs.footprint',  icon: 'footsteps-outline', iconActive: 'footsteps' },
  { name: 'settings',  labelKey: 'tabs.settings',   icon: 'settings-outline',  iconActive: 'settings' },
];

const LEGACY_TABS: TabConfig[] = [
  { name: 'discover',  labelKey: 'tabs.discover',  icon: 'camera-outline',  iconActive: 'camera' },
  { name: 'herbarium', labelKey: 'tabs.herbarium', icon: 'leaf-outline',    iconActive: 'leaf' },
  { name: 'map',       labelKey: 'tabs.cityMap',   icon: 'map-outline',     iconActive: 'map' },
  { name: 'social',    labelKey: 'tabs.social',    icon: 'people-outline',  iconActive: 'people' },
  { name: 'profile',   labelKey: 'tabs.profile',   icon: 'person-outline',  iconActive: 'person' },
];

const activeTabs = FEATURES.CHECKIN_MODE ? CHECKIN_TABS : LEGACY_TABS;
const hiddenTabNames = FEATURES.CHECKIN_MODE
  ? LEGACY_TABS.map((t) => t.name)
  : CHECKIN_TABS.map((t) => t.name);

export default function TabLayout() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: FEATURES.CHECKIN_MODE
          ? theme.primary
          : colors.plantPrimary,
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
      {/* Active tabs */}
      {activeTabs.map(({ name, labelKey, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(labelKey),
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? iconActive : icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
      {/* Hidden tabs — files preserved, not shown in tab bar */}
      {hiddenTabNames.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
