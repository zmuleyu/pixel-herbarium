// __tests__/components/guide/CoachMark.test.tsx
import React from 'react';

jest.mock('@/constants/theme', () => ({
  colors: {
    white: '#ffffff', text: '#3a3a3a', textSecondary: '#7a7a7a',
    border: '#e8e6e1', plantPrimary: '#9fb69f', background: '#f5f4f1',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { sm: 13, md: 15, lg: 18 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  borderRadius: { sm: 6, md: 12, lg: 20 },
  shadows: { cardSubtle: { shadowOpacity: 0.05 } },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'guide.next': '次へ',
      'guide.gotIt': 'わかった',
    }[key] ?? key),
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

// Mock React hooks so they work when called outside the reconciler (shallowRender pattern)
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  // Provide lightweight hook stubs safe for direct function-call tests
  const refs: any[] = [];
  let refIdx = 0;
  const states: any[] = [];
  let stateIdx = 0;

  return {
    ...actual,
    useRef: (initial: any) => {
      if (refs[refIdx] === undefined) refs[refIdx] = { current: initial };
      return refs[refIdx++];
    },
    useState: (initial: any) => {
      if (states[stateIdx] === undefined) states[stateIdx] = initial;
      const idx = stateIdx++;
      return [states[idx], (v: any) => { states[idx] = v; }];
    },
    useEffect: (_fn: any) => { /* no-op in test */ },
    createElement: actual.createElement,
  };
});

// Shallow-render helper (same pattern as HanakotobaFlipCard tests)
function shallowRender(el: any, depth = 8): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0)
    return shallowRender(el.type({ ...el.props }), depth - 1);
  return {
    type: typeof el.type === 'string' ? el.type : (el.type?.name ?? 'Unknown'),
    props: { ...el.props, children: undefined },
    children: el.props?.children != null
      ? (Array.isArray(el.props.children)
          ? el.props.children.map((c: any) => shallowRender(c, depth))
          : shallowRender(el.props.children, depth))
      : undefined,
  };
}

let CoachMark: any;
beforeAll(async () => {
  const mod = await import('@/components/guide/CoachMark');
  CoachMark = mod.CoachMark;
});

const mockSteps = [
  { targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '📸' },
  { targetKey: 'discover.gpsBadge', body: 'guide.discover.step2', icon: '📍' },
];

const mockRect = { x: 75, y: 200, width: 240, height: 240 };

describe('CoachMark', () => {
  // Reset hook indices before each test so stubs start fresh
  beforeEach(() => {
    jest.resetModules();
  });

  const baseProps = {
    steps: mockSteps,
    currentStep: 0,
    targetRect: mockRect,
    onNext: jest.fn(),
    onDismiss: jest.fn(),
    visible: true,
  };

  it('renders body text for current step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('guide.discover.step1');
  });

  it('renders icon for current step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('📸');
  });

  it('shows "次へ" when not on last step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('次へ');
  });

  it('shows "わかった" on last step', () => {
    const lastProps = { ...baseProps, currentStep: 1 };
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, lastProps)));
    expect(tree).toContain('わかった');
  });

  it('returns null when visible=false', () => {
    const result = (CoachMark as (p: any) => any)({ ...baseProps, visible: false });
    expect(result).toBeNull();
  });

  it('renders step indicator numbers', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('1');
    expect(tree).toContain('2');
  });
});
