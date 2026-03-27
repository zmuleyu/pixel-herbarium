// __mocks__/react-native.js
// Minimal React Native mock for ts-jest (avoids ESM import in react-native/index.js).
// Only mocks the APIs actually used by the hooks under test.

const React = require('react');

// Animated.Value mock
function AnimatedValue(value) {
  this._value = value;
  this._listeners = [];
}
AnimatedValue.prototype.setValue = function (val) { this._value = val; };
AnimatedValue.prototype.addListener = function (cb) { return 0; };
AnimatedValue.prototype.removeListener = function () {};
AnimatedValue.prototype.interpolate = function () { return this; };

// Animated namespace mock
const Animated = {
  Value: AnimatedValue,
  ValueXY: function (val) { this.x = new AnimatedValue(val.x || 0); this.y = new AnimatedValue(val.y || 0); },
  timing: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  spring: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  decay: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  sequence: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  parallel: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  stagger: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  delay: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  loop: jest.fn().mockReturnValue({ start: jest.fn(cb => cb && cb({ finished: true })) }),
  event: jest.fn(),
  multiply: jest.fn((...args) => new AnimatedValue(1)),
  add: jest.fn((...args) => new AnimatedValue(0)),
  subtract: jest.fn((...args) => new AnimatedValue(0)),
  divide: jest.fn((...args) => new AnimatedValue(1)),
  modulo: jest.fn((...args) => new AnimatedValue(0)),
  diffClamp: jest.fn((...args) => new AnimatedValue(0)),
  createAnimatedComponent: jest.fn(component => component),
  View: 'Animated.View',
  Text: 'Animated.Text',
  Image: 'Animated.Image',
  ScrollView: 'Animated.ScrollView',
  FlatList: 'Animated.FlatList',
};

const Easing = {
  linear: t => t,
  ease: t => t,
  quad: t => t,
  cubic: t => t,
  poly: () => t => t,
  sin: t => t,
  circle: t => t,
  exp: t => t,
  elastic: () => t => t,
  back: () => t => t,
  bounce: t => t,
  bezier: () => t => t,
  in: fn => fn,
  out: fn => fn,
  inOut: fn => fn,
};

const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

const StyleSheet = {
  create: styles => styles,
  flatten: style => style,
  hairlineWidth: 1,
  absoluteFill: {},
  absoluteFillObject: {},
};

const Platform = {
  OS: 'ios',
  Version: 14,
  select: obj => obj.ios ?? obj.default,
  isPad: false,
  isTVOS: false,
};

const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
};

module.exports = {
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
  Platform,
  AppState,
  // Common components (stubs)
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  FlatList: 'FlatList',
  SectionList: 'SectionList',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  Modal: 'Modal',
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Alert: { alert: jest.fn() },
  Keyboard: { dismiss: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) },
  Vibration: { vibrate: jest.fn(), cancel: jest.fn() },
  Share: { share: jest.fn() },
  Linking: { openURL: jest.fn(), canOpenURL: jest.fn(), addEventListener: jest.fn() },
  PixelRatio: { get: jest.fn(() => 2), getFontScale: jest.fn(() => 1), roundToNearestPixel: jest.fn(x => x) },
  useColorScheme: jest.fn(() => 'light'),
  useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, scale: 2, fontScale: 1 })),
  NativeScrollEvent: {},
  NativeSyntheticEvent: {},
  AccessibilityInfo: {
    isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    fetch: jest.fn(() => Promise.resolve(false)),
    setAccessibilityFocus: jest.fn(),
    announceForAccessibility: jest.fn(),
  },
};
