# Mock Catalog

All available mocks for PH tests. Reuse these — do NOT create new mock files.

## Global Mocks (via moduleNameMapper in jest.config.js)

| Module | Mock File | Both Projects |
|--------|-----------|---------------|
| `react-native` | `__mocks__/react-native.js` | Yes |
| `@supabase/supabase-js` | `__mocks__/supabase-js.js` | Yes |
| `react-native-url-polyfill/auto` | `__mocks__/empty.js` | Yes |
| `expo-secure-store` | `__mocks__/empty.js` | Yes |
| `expo-haptics` | `__mocks__/expo-haptics.js` | Unit only |
| `react-native-svg` | `__mocks__/react-native-svg.js` | Unit only |
| `@react-native-community/slider` | `__mocks__/empty.js` | Unit only |
| `react` (→ react-screen-test.js) | `__mocks__/react-screen-test.js` | Screens only |
| `msw/node` | `__mocks__/msw-node.js` | Screens only |
| `msw` | `__mocks__/msw-core.js` | Screens only |

## Inline Mocks (jest.mock in test files)

### react-i18next
```typescript
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

### expo-router
```typescript
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Stack: { Screen: 'Stack.Screen' },
  Tabs: { Screen: 'Tabs.Screen' },
  Redirect: 'Redirect',
}));
```

### @/constants/theme (full stanza)
```typescript
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
    textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
    seasonal: { sakura: '#f5d5d0' },
    plantSecondary: '#c1e8d8', creamYellow: '#fff8dc',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLifted: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  },
}));
```

### @/constants/theme (stamp only — for component tests)
```typescript
jest.mock('@/constants/theme', () => ({
  stamp: {
    opacity: { pixel: 0.93, seal: 0.90, minimal: 1 },
    sealDiameter: 72, sealBorder: 2.5, minimalBarWidth: 2.5,
    pixelBorder: 2, padding: 16,
    defaultPosition: 'bottom-right', defaultStyle: 'pixel',
    storageKey: 'stamp_style_preference',
    positionStorageKey: 'stamp_position_preference',
  },
}));
```

### @/constants/seasons
```typescript
jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({
    id: 'sakura', emoji: '🌸', label: '桜の季節',
    color: '#f5d5d0', startMonth: 3, endMonth: 5,
  }),
  SEASONS: [{ id: 'sakura', emoji: '🌸', label: '桜の季節', color: '#f5d5d0', startMonth: 3, endMonth: 5 }],
}));
```

### @/services/supabase (for hook/service tests)
```typescript
jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn(), auth: { getSession: jest.fn() } },
}));
```

### @/utils/stamp-colors
```typescript
jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: jest.fn(() => ({ brandDeep: '#c45070', brandMid: '#d46080' })),
}));
```

### expo-camera
```typescript
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));
```

### expo-image-picker
```typescript
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images' },
}));
```

### expo-linear-gradient
```typescript
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
```

### @expo/vector-icons
```typescript
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));
```

### expo-constants
```typescript
jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.1.0', extra: {} } },
}));
```

### @/components/guide
```typescript
jest.mock('@/components/guide', () => ({
  GuideWrapper: ({ children }: { children: any }) => children,
  MeasuredView: ({ children }: { children: any }) => children,
}));
```

### @/components/ErrorBoundary
```typescript
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
```

### @react-native-async-storage/async-storage
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    multiRemove: jest.fn().mockResolvedValue(undefined),
  },
}));
```

### expo-file-system
```typescript
jest.mock('expo-file-system/legacy', () => ({
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  cacheDirectory: '/cache/',
  documentDirectory: '/docs/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));
```

### expo-sharing
```typescript
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));
```
