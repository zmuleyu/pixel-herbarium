// Mock React hooks so shallowRender (plain function call) works without a fiber dispatcher.
jest.mock('react', () => {
  const path = require('path');
  const reactPath = path.resolve(__dirname, '../../node_modules/react/index.js');
  // Load React directly by absolute path to bypass jest.requireActual recursion
  const r = jest.requireActual('react');
  return {
    ...r,
    default: { ...r },
    __esModule: true,
    useState: (init: any) => [typeof init === 'function' ? init() : init, jest.fn()],
    useRef: (init: any) => ({ current: init !== undefined ? init : null }),
    useEffect: () => {},
    useLayoutEffect: () => {},
    useMemo: (factory: any) => factory(),
    useCallback: (fn: any) => fn,
    useContext: () => undefined,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            white: '#ffffff', blushPink: '#f5d5d0', creamYellow: '#fff8dc',
            plantPrimary: '#9fb69f', border: '#e8e6e1' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import SpotCheckinAnimation from '../../src/components/SpotCheckinAnimation';
import type { FlowerSpot } from '../../src/types/hanami';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
  prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
  treeCount: 800,
  bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
  latitude: 35.7141, longitude: 139.7734,
  tags: ['名所100選'],
};

function shallowRender(el: any, depth = 5): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) return shallowRender(el.type(el.props ?? {}), depth - 1);
  const children = el.props?.children;
  return { type: el.type, props: { ...el.props, children: undefined },
           children: Array.isArray(children) ? children.map((c: any) => shallowRender(c, depth)) : shallowRender(children, depth) };
}

describe('SpotCheckinAnimation', () => {
  it('renders spot name', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: false, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('上野恩賜公園');
  });

  it('shows mankai text when isMankai is true', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: true, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('sakura.stampCard.mankai');
  });

  it('shows first-visit text (default case)', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: false, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('sakura.stampCard.saved');
  });
});
