/**
 * ErrorBoundary component tests.
 * Uses direct class instantiation since ErrorBoundary is a class component.
 * Render output is inspected via JSON.stringify on instance.render().
 */

import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', white: '#ffffff', plantPrimary: '#9fb69f' },
  typography: { fontSize: { md: 15 }, fontFamily: { display: 'HiraginoMaruGothicProN' } },
  spacing: { sm: 8, md: 16, xl: 32 },
  borderRadius: { md: 12 },
}));

import { ErrorBoundary } from '@/components/ErrorBoundary';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeInstance(
  props: { children?: React.ReactNode; fallbackLabel?: string; onRetry?: () => void } = {},
  state: { hasError: boolean } = { hasError: false },
): ErrorBoundary {
  const defaultProps = {
    children: React.createElement('View', null, 'child content'),
    ...props,
  };
  const instance = new ErrorBoundary(defaultProps);
  // Directly set state to control render path without triggering lifecycle
  (instance as any).state = state;
  return instance;
}

function renderToString(instance: ErrorBoundary): string {
  return JSON.stringify(instance.render());
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ErrorBoundary – normal render', () => {
  it('renders children when hasError is false', () => {
    const child = React.createElement('View', null, 'child content');
    const instance = makeInstance({ children: child }, { hasError: false });
    const output = instance.render();
    expect(output).toBe(child);
  });
});

describe('ErrorBoundary – error state render', () => {
  it('renders fallback UI when hasError is true', () => {
    const instance = makeInstance({}, { hasError: true });
    const output = renderToString(instance);
    // i18n mock returns key as value, so we expect the key strings
    expect(output).toContain('error.loadFailed');
    expect(output).toContain('common.retry');
  });

  it('does not contain hardcoded Japanese strings in fallback', () => {
    const instance = makeInstance({}, { hasError: true });
    const output = renderToString(instance);
    expect(output).not.toContain('読み込みに失敗しました');
    expect(output).not.toContain('もう一度');
  });

  it('uses custom fallbackLabel when provided', () => {
    const instance = makeInstance({ fallbackLabel: 'Custom Error Label' }, { hasError: true });
    const output = renderToString(instance);
    expect(output).toContain('Custom Error Label');
    // Should not fall back to i18n key when custom label is provided
    expect(output).not.toContain('error.loadFailed');
  });
});

describe('ErrorBoundary – handleRetry', () => {
  it('handleRetry resets hasError to false', () => {
    const instance = makeInstance({}, { hasError: true });
    const setStateSpy = jest.spyOn(instance, 'setState').mockImplementation(() => {});
    instance.handleRetry();
    expect(setStateSpy).toHaveBeenCalledWith({ hasError: false });
  });

  it('handleRetry calls onRetry prop', () => {
    const onRetry = jest.fn();
    const instance = makeInstance({ onRetry }, { hasError: true });
    // Stub setState to avoid missing fiber context
    jest.spyOn(instance, 'setState').mockImplementation(() => {});
    instance.handleRetry();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('handleRetry does not throw without onRetry prop', () => {
    const instance = makeInstance({}, { hasError: true });
    jest.spyOn(instance, 'setState').mockImplementation(() => {});
    expect(() => instance.handleRetry()).not.toThrow();
  });
});

describe('ErrorBoundary – getDerivedStateFromError', () => {
  it('returns hasError: true', () => {
    const result = ErrorBoundary.getDerivedStateFromError();
    expect(result).toEqual({ hasError: true });
  });
});
