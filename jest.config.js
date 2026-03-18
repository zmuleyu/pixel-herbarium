/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      // Project A: hooks/utils/services/stores/components — keep existing node environment
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.tsx',
        '<rootDir>/__tests__/**/*.test.ts',
      ],
      testPathIgnorePatterns: ['<rootDir>/__tests__/screens/'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-native$': '<rootDir>/__mocks__/react-native.js',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', resolveJsonModule: true } }],
      },
    },
    {
      // Project B: screens — uses jest-expo for React Native component environment
      displayName: 'screens',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/__tests__/screens/**'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/mocks/server.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
      },
      // msw v2 and until-async ship ESM; transform them so CJS jest can consume them
      transformIgnorePatterns: [
        '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|msw|until-async|@mswjs))',
        '/node_modules/react-native-reanimated/plugin/',
      ],
    },
  ],
};
