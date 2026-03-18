/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      // Project A: hooks/utils/services/stores/components — keep existing node environment
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/hooks/**',
        '<rootDir>/__tests__/utils/**',
        '<rootDir>/__tests__/services/**',
        '<rootDir>/__tests__/stores/**',
        '<rootDir>/__tests__/security/**',
        '<rootDir>/__tests__/i18n/**',
        '<rootDir>/__tests__/constants/**',
        '<rootDir>/__tests__/components/**',
        '<rootDir>/__tests__/debug/**',
        '<rootDir>/__tests__/debug-poster.test.tsx',
        '<rootDir>/__tests__/performance/**',
      ],
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
      },
    },
  ],
};
