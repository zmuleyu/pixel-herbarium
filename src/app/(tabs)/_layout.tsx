import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  labelKey: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TAB_CONFIG: TabConfig[] = [
  { name: 'discover',  labelKey: 'tabs.discover',  icon: 'camera-outline',  iconActive: 'camera' },
  { name: 'herbarium', labelKey: 'tabs.herbarium', icon: 'leaf-outline',    iconActive: 'leaf' },
  { name: 'map',       labelKey: 'tabs.cityMap',   icon: 'map-outline',     iconActive: 'map' },
  { name: 'social',    labelKey: 'tabs.social',    icon: 'people-outline',  iconActive: 'people' },
  { name: 'profile',   labelKey: 'tabs.profile',   icon: 'person-outline',  iconActive: 'person' },
];

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.plantPrimary,
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
      {TAB_CONFIG.map(({ name, labelKey, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(labelKey),
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? iconActive : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
