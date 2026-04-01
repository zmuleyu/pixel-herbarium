// Minimal mock for react-native-reanimated used in screen tests
const React = require('react');
const { View } = require('react-native');

const Animated = {
  View: ({ children, style, ...rest }) =>
    React.createElement(View, { style, ...rest }, children),
  createAnimatedComponent: (Component) => Component,
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: (fn) => ({}),
  withTiming: (val) => val,
  withSpring: (val) => val,
  withDelay: (_, val) => val,
  runOnJS: (fn) => fn,
  FadeIn: {},
  FadeOut: {},
};

module.exports = Animated;
module.exports.default = Animated;
