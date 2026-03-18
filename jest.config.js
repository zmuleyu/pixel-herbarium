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
      // Project B: screens — ts-jest + react-native mock + patched React hooks
      // shallowRender calls function components as plain functions (no fiber dispatcher).
      // The setup file patches React.useState/useRef/etc. to work without a reconciler.
      displayName: 'screens',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/screens/**'],
      testPathIgnorePatterns: ['<rootDir>/__tests__/screens/setup.ts'],
      setupFilesAfterEnv: [
        '<rootDir>/__tests__/mocks/server.ts',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-native$': '<rootDir>/__mocks__/react-native.js',
        '^react$': '<rootDir>/__mocks__/react-screen-test.js',
        '^msw/node$': '<rootDir>/__mocks__/msw-node.js',
        '^msw$': '<rootDir>/__mocks__/msw-core.js',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', resolveJsonModule: true } }],
      },
    },
  ],
};
