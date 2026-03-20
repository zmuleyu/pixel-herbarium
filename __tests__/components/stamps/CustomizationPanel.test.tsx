/**
 * CustomizationPanel tests.
 * Collapsed: shows title. Expanded: shows all 4 row labels.
 */

// Control useState to test both collapsed and expanded states
let mockIsOpen = false;
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const mock = Object.assign({}, actual, {
    useState: (init: any) => {
      // First useState call in CustomizationPanel is for isOpen
      if (typeof init === 'boolean') return [mockIsOpen, jest.fn()];
      return [typeof init === 'function' ? init() : init, jest.fn()];
    },
    useRef: (init: any) => ({ current: init !== undefined ? init : null }),
    useEffect: () => {},
    useCallback: (fn: any) => fn,
    useMemo: (factory: () => any) => factory(),
  });
  mock.default = mock;
  mock.__esModule = true;
  return mock;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/constants/theme', () => ({
  colors: { text: '#3a3a3a', textSecondary: '#7a7a7a', white: '#ffffff', border: '#e8e6e1' },
  spacing: { xs: 4, sm: 8, md: 16 },
  borderRadius: { sm: 6 },
  STAMP_COLOR_PALETTE: ['#e8a5b0', '#7B9FCC', '#d4a645', '#b07090', '#6b8f5e', '#8899aa', '#c8a060', '#aaaaaa'],
  SEASON_THEMES: {
    sakura: { primary: '#e8a5b0', accent: '#f5d5d0', bgTint: '#FFF5F3' },
  },
}));

import React from 'react';
import { CustomizationPanel } from '@/components/stamps/CustomizationPanel';
import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';

function shallowRender(element: any, depth = 12): any {
  if (element == null || typeof element !== 'object') return element;
  if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    try { return shallowRender(element.type({ ...element.props }), depth - 1); }
    catch { return null; }
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

const panelProps = {
  options: DEFAULT_CUSTOM_OPTIONS,
  onChange: jest.fn(),
  seasonColor: '#e8a5b0',
};

describe('CustomizationPanel – collapsed', () => {
  beforeEach(() => { mockIsOpen = false; });

  it('renders customize title key', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    expect(JSON.stringify(tree)).toContain('customize.title');
  });

  it('does not render line color label when collapsed', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    expect(JSON.stringify(tree)).not.toContain('customize.lineColor');
  });
});

describe('CustomizationPanel – expanded', () => {
  beforeEach(() => { mockIsOpen = true; });

  it('renders all 4 section labels', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    const json = JSON.stringify(tree);
    expect(json).toContain('customize.lineColor');
    expect(json).toContain('customize.effect');
    expect(json).toContain('customize.addText');
    expect(json).toContain('customize.decoration');
  });

  it('renders 8 color swatches', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    const json = JSON.stringify(tree);
    // Each palette color appears as backgroundColor
    expect(json).toContain('#7B9FCC');
    expect(json).toContain('#d4a645');
  });

  it('renders effectNone chip', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    expect(JSON.stringify(tree)).toContain('customize.effectNone');
  });

  it('renders decorPetals chip', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    expect(JSON.stringify(tree)).toContain('customize.decorPetals');
  });

  it('does not render TextInput when textMode is none', () => {
    const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
    const json = JSON.stringify(tree);
    expect(json).not.toContain('TextInput');
  });

  it('renders TextInput when textMode is custom', () => {
    const opts = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'custom' as const };
    const tree = shallowRender(
      React.createElement(CustomizationPanel, { ...panelProps, options: opts })
    );
    expect(JSON.stringify(tree)).toContain('TextInput');
  });
});
