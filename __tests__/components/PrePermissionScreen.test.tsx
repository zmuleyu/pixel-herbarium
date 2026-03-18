jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
            textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
            blushPink: '#f5d5d0' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { md: 15, lg: 18, xl: 22 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import PrePermissionScreen from '../../src/components/PrePermissionScreen';

function shallowRender(el: any, depth = 5): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) {
    return shallowRender(el.type(el.props ?? {}), depth - 1);
  }
  const children = el.props?.children;
  return { type: el.type, props: { ...el.props, children: undefined },
           children: Array.isArray(children)
             ? children.map((c: any) => shallowRender(c, depth))
             : shallowRender(children, depth) };
}

function renderToString(props: Record<string, unknown>) {
  return JSON.stringify(shallowRender(React.createElement(PrePermissionScreen as any, props)));
}

describe('PrePermissionScreen', () => {
  it('renders the title i18n key', () => {
    const html = renderToString({ onAllow: jest.fn(), onSkip: jest.fn() });
    expect(html).toContain('sakura.permission.title');
  });

  it('renders allow and skip buttons', () => {
    const html = renderToString({ onAllow: jest.fn(), onSkip: jest.fn() });
    expect(html).toContain('sakura.permission.allow');
    expect(html).toContain('sakura.permission.skip');
  });
});
