# Pixel Herbarium - Codex Project Context

## Tech Stack
- **Framework**: Expo 55.0.6, React Native 0.83.2, React 19.2.0
- **Language**: TypeScript 5.9.2
- **State**: Zustand 5.0.11
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **i18n**: i18next 25.8.18 (ja primary, en secondary)
- **Maps**: React Native Maps 1.26.20
- **Test**: Jest 29.7.0, ts-jest 29.4.6, @testing-library/react-native 13.3.3, @testing-library/react-hooks 8.0.1, MSW 2.12.13

## Module Alias
`@/` resolves to `src/` (configured in jest.config.js moduleNameMapper).

## Jest Dual-Project Configuration

### Project A: "unit"
- **Scope**: hooks, utils, services, stores, components (everything EXCEPT screens)
- **Test location**: `__tests__/**/*.test.{ts,tsx}` (excluding `__tests__/screens/`)
- **Environment**: node
- **React**: Real React (from node_modules)
- **RN mock**: `__mocks__/react-native.js` (string stubs for components, jest.fn() for APIs)
- **Supabase mock**: `__mocks__/supabase-js.js` (chained builder pattern)
- **SVG mock**: `__mocks__/react-native-svg.js` (createElement-based stubs)
- **Haptics mock**: `__mocks__/expo-haptics.js`

### Project B: "screens"
- **Scope**: Screen/page component tests only
- **Test location**: `__tests__/screens/**`
- **Environment**: node (NOT jsdom)
- **React**: `__mocks__/react-screen-test.js` (stub hooks: useState returns [initial, jest.fn()], useEffect is no-op, useMemo calls factory)
- **MSW**: `__mocks__/msw-node.js` + `__mocks__/msw-core.js` (no-op stubs)
- **Setup**: `__tests__/mocks/server.ts` (runs beforeAll/afterEach/afterAll)
- **Pattern**: shallowRender (see screen-test-pattern.md)

## Critical Rules for Codex
1. ALL `jest.mock()` calls MUST come BEFORE any `import` statements
2. Screen tests go in `__tests__/screens/`, everything else in `__tests__/<category>/`
3. Never use `render()` from @testing-library/react-native in screen tests
4. Hook tests use `renderHook` from `@testing-library/react-hooks`
5. Use `(global as any).__DEV__ = false;` at top of screen tests
6. Japanese fixture data (spot names, plant names) for consistency with the app's market

## Verification Command
```bash
npx jest --ci --passWithNoTests
```

## sessions.jsonl Record Format
```json
{"date":"2026-03-28","task":"<task-id>","tests":<count>,"passed":<count>,"duration_s":<seconds>,"agent":"codex","file":"<test-file-path>","status":"pass|fail"}
```
