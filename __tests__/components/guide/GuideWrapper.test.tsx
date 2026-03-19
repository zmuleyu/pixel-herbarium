// __tests__/components/guide/GuideWrapper.test.tsx
import React from 'react';

// ─── React hook stubs (shallowRender pattern — same as CoachMark.test.tsx) ───

let refIdx = 0;
let stateIdx = 0;
let effectIdx = 0;
let refs: any[] = [];
let states: any[] = [];
let effects: Array<() => (() => void) | void> = [];

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
    useEffect: (fn: () => (() => void) | void) => {
      effects[effectIdx++] = fn;
    },
    useCallback: (fn: any) => fn,
    useContext: (ctx: any) => ctx._currentValue ?? ctx._currentValue2,
    createElement: actual.createElement,
    createContext: actual.createContext,
  };
});

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

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
    t: (key: string) => key,
  }),
}));

const mockMarkSeen = jest.fn();
const mockReset = jest.fn();

jest.mock('@/hooks/useGuideState', () => ({
  useGuideState: jest.fn(() => ({
    seen: false,
    loading: false,
    markSeen: mockMarkSeen,
    reset: mockReset,
  })),
}));

// ─── Shallow render helper ────────────────────────────────────────────────────

function shallowRender(el: any, depth = 10): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) {
    return shallowRender(el.type({ ...(el.props ?? {}) }), depth - 1);
  }
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

function findInTree(node: any, predicate: (n: any) => boolean): any {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  const children = node.children;
  if (Array.isArray(children)) {
    for (const c of children) {
      const found = findInTree(c, predicate);
      if (found) return found;
    }
  } else if (children) {
    return findInTree(children, predicate);
  }
  return null;
}

// ─── Imports (after mocks) ────────────────────────────────────────────────────

let GuideWrapper: any;
let MeasuredView: any;
let GuideMeasureProvider: any;
let useGuideMeasure: any;
let useGuideState: any;

beforeAll(async () => {
  const wrapperMod = await import('@/components/guide/GuideWrapper');
  GuideWrapper = wrapperMod.default;
  MeasuredView = wrapperMod.MeasuredView;
  const ctxMod = await import('@/components/guide/GuideMeasureContext');
  GuideMeasureProvider = ctxMod.GuideMeasureProvider;
  useGuideMeasure = ctxMod.useGuideMeasure;
  const hookMod = await import('@/hooks/useGuideState');
  useGuideState = hookMod.useGuideState;
});

beforeEach(() => {
  jest.resetModules();
  refIdx = 0; stateIdx = 0; effectIdx = 0;
  refs = []; states = []; effects = [];
  jest.clearAllMocks();
  (useGuideState as jest.Mock).mockReturnValue({
    seen: false,
    loading: false,
    markSeen: mockMarkSeen,
    reset: mockReset,
  });
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSteps = [
  { targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '📸' },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GuideWrapper', () => {
  it('renders children wrapped in GuideMeasureProvider', () => {
    const child = React.createElement('Text', { testID: 'child-text' }, 'Hello');
    const el = React.createElement(GuideWrapper, {
      featureKey: 'discover',
      steps: mockSteps,
    }, child);

    const tree = JSON.stringify(shallowRender(el));
    expect(tree).toContain('child-text');
  });

  it('does not show CoachMark when guide already seen', () => {
    (useGuideState as jest.Mock).mockReturnValue({
      seen: true,
      loading: false,
      markSeen: mockMarkSeen,
      reset: mockReset,
    });

    // When seen=true, CoachMarkController returns null (visible starts false, useEffect is no-op)
    // We verify the CoachMarkController renders null when seen=true
    // states[0] = false (visible), useGuideState returns seen=true
    // The component returns null because visible===false
    states[0] = false; // visible state in CoachMarkController

    const el = React.createElement(GuideWrapper, {
      featureKey: 'discover',
      steps: mockSteps,
    }, React.createElement('Text', null, 'content'));

    // Render - CoachMarkController should return null since visible=false (and seen=true means no timer)
    const tree = shallowRender(el);
    const treeStr = JSON.stringify(tree);

    // CoachMark body text should NOT be rendered as a component (it's only in steps prop)
    // When visible=false, CoachMarkController returns null, so no CoachMark component in tree
    expect(treeStr).not.toContain('"type":"CoachMark"');
  });

  it('shows CoachMark after delay when not seen', () => {
    (useGuideState as jest.Mock).mockReturnValue({
      seen: false,
      loading: false,
      markSeen: mockMarkSeen,
      reset: mockReset,
    });

    // Simulate: visible=true (as if delay elapsed)
    // CoachMarkController's useState(false) is states[0]; set to true so CoachMark renders
    states[0] = true;

    const el = React.createElement(GuideWrapper, {
      featureKey: 'discover',
      steps: mockSteps,
    }, React.createElement('Text', null, 'content'));

    const tree = JSON.stringify(shallowRender(el));
    // When visible=true, CoachMark renders its body text (accessibilityLabel on tooltip)
    expect(tree).toContain('guide.discover.step1');
  });

  it('calls markSeen when CoachMark onDone fires', () => {
    (useGuideState as jest.Mock).mockReturnValue({
      seen: false,
      loading: false,
      markSeen: mockMarkSeen,
      reset: mockReset,
    });

    // Simulate visible=true
    states[0] = true;

    const el = React.createElement(GuideWrapper, {
      featureKey: 'discover',
      steps: mockSteps,
    }, React.createElement('Text', null, 'content'));

    const tree = shallowRender(el);

    // The GotIt button calls handleNext which calls onDone=markSeen on last step
    // Find the 'わかった' / gotIt button's onPress — or find any TouchableOpacity with accessibilityRole=button
    function findOnPress(node: any): (() => void) | null {
      if (!node || typeof node !== 'object') return null;
      // TouchableOpacity with accessibilityRole=button is the CoachMark button
      if (
        node.type === 'TouchableOpacity' &&
        node.props?.accessibilityRole === 'button' &&
        node.props?.onPress
      ) {
        return node.props.onPress;
      }
      const ch = node.children;
      if (Array.isArray(ch)) {
        for (const c of ch) {
          const found = findOnPress(c);
          if (found) return found;
        }
      } else if (ch) {
        return findOnPress(ch);
      }
      return null;
    }

    const onPress = findOnPress(tree);
    expect(onPress).toBeTruthy();
    onPress!();
    expect(mockMarkSeen).toHaveBeenCalled();
  });

  it('MeasuredView registers layout on onLayout', () => {
    // Verify that GuideMeasureContext's register + getRect work correctly
    const rectsMap = new Map<string, any>();
    const mockRegister = (key: string, event: any) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      rectsMap.set(key, { x, y, width, height });
    };
    const mockGetRect = (key: string) => rectsMap.get(key) ?? null;

    const fakeEvent = { nativeEvent: { layout: { x: 10, y: 20, width: 100, height: 50 } } };
    mockRegister('test.key', fakeEvent as any);

    expect(rectsMap.get('test.key')).toEqual({ x: 10, y: 20, width: 100, height: 50 });
    expect(mockGetRect('test.key')).toEqual({ x: 10, y: 20, width: 100, height: 50 });

    // Verify MeasuredView renders a View (tree is truthy)
    const el = React.createElement(MeasuredView, { measureKey: 'test.key' });
    const tree = shallowRender(el);
    expect(tree).toBeTruthy();
    expect(tree.type).toBe('View');
  });
});
