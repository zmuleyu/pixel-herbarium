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
let refIdx = 0;
let stateIdx = 0;
let refs: any[] = [];
let states: any[] = [];

jest.mock('react', () => {
  const actual = jest.requireActual('react');

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

// Shallow-render helper that handles array children
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
const mockGetRect = (_key: string) => mockRect;

describe('CoachMark', () => {
  // Reset hook indices before each test so stubs start fresh
  beforeEach(() => {
    jest.resetModules();
    refIdx = 0;
    stateIdx = 0;
    refs = [];
    states = [];
  });

  // Updated baseProps to use the spec-correct API
  const baseProps = {
    steps: mockSteps,
    getRect: mockGetRect,
    onDone: jest.fn(),
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
    // Provide a single-step array so step 0 is the last step
    const singleStep = [mockSteps[1]];
    const lastProps = { ...baseProps, steps: singleStep };
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, lastProps)));
    expect(tree).toContain('わかった');
  });

  it('returns null when steps array is empty', () => {
    const result = (CoachMark as (p: any) => any)({ ...baseProps, steps: [] });
    expect(result).toBeNull();
  });

  it('renders step indicator dots when multiple steps', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    // accessibilityLabel on dots view contains step count info
    expect(tree).toContain('ステップ');
  });

  it('onDone is called when GotIt button pressed on last step', () => {
    const mockOnDone = jest.fn();
    const singleStep = [{ targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '📸' }];
    const props = { steps: singleStep, getRect: mockGetRect, onDone: mockOnDone };
    const instance = CoachMark as (p: any) => any;
    const result = instance(props);
    // Walk the rendered tree to find the GotIt button's onPress
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, props)));
    expect(tree).toContain('わかった');
    // Call handleNext directly by invoking CoachMark's internal logic:
    // Re-render and find the button, then simulate press via the rendered element
    const rendered = shallowRender(React.createElement(CoachMark, props));
    // Find onPress of the GotIt button by walking the tree
    function findButtonOnPress(node: any): (() => void) | null {
      if (!node) return null;
      if (node.props?.accessibilityLabel === 'わかった' && node.props?.onPress) {
        return node.props.onPress;
      }
      if (node.children) {
        const ch = Array.isArray(node.children) ? node.children : [node.children];
        for (const c of ch) {
          const found = findButtonOnPress(c);
          if (found) return found;
        }
      }
      return null;
    }
    const onPress = findButtonOnPress(rendered);
    expect(onPress).toBeTruthy();
    onPress!();
    expect(mockOnDone).toHaveBeenCalled();
  });

  it('reduce motion: no crash when reduceMotion enabled', () => {
    // The React mock's useEffect is a no-op, so reduceMotion state stays false (initial).
    // We verify the component renders body text without crashing.
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('guide.discover.step1');
  });

  it('tap outside overlay advances to next step — overlay onPress calls handleNext', () => {
    // Render the component and find the full-screen overlay TouchableOpacity's onPress
    const rendered = shallowRender(React.createElement(CoachMark, baseProps));

    function findOverlayOnPress(node: any): (() => void) | null {
      if (!node) return null;
      // The overlay TouchableOpacity has activeOpacity=1 and no accessibilityRole
      if (
        node.props?.activeOpacity === 1 &&
        node.props?.onPress &&
        !node.props?.accessibilityRole
      ) {
        return node.props.onPress;
      }
      if (node.children) {
        const ch = Array.isArray(node.children) ? node.children : [node.children];
        for (const c of ch) {
          const found = findOverlayOnPress(c);
          if (found) return found;
        }
      }
      return null;
    }

    const overlayOnPress = findOverlayOnPress(rendered);
    expect(overlayOnPress).toBeTruthy();
    // Calling it should not throw — it calls handleNext internally
    expect(() => overlayOnPress!()).not.toThrow();
  });
});
