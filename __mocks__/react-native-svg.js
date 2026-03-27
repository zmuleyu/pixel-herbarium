// __mocks__/react-native-svg.js
// Lightweight mock — prevents SvgTouchableMixin from resolving Touchable.Mixin.

const React = require('react');

const createComponent = (name) => {
  const C = ({ children, ...props }) => React.createElement(name, props, children);
  C.displayName = name;
  return C;
};

module.exports = {
  __esModule: true,
  default: createComponent('Svg'),
  Svg: createComponent('Svg'),
  Circle: createComponent('Circle'),
  Ellipse: createComponent('Ellipse'),
  G: createComponent('G'),
  Text: createComponent('SvgText'),
  TSpan: createComponent('TSpan'),
  TextPath: createComponent('TextPath'),
  Path: createComponent('Path'),
  Polygon: createComponent('Polygon'),
  Polyline: createComponent('Polyline'),
  Line: createComponent('Line'),
  Rect: createComponent('Rect'),
  Use: createComponent('Use'),
  Image: createComponent('SvgImage'),
  Symbol: createComponent('Symbol'),
  Defs: createComponent('Defs'),
  LinearGradient: createComponent('LinearGradient'),
  RadialGradient: createComponent('RadialGradient'),
  Stop: createComponent('Stop'),
  ClipPath: createComponent('ClipPath'),
  Pattern: createComponent('Pattern'),
  Mask: createComponent('Mask'),
  Marker: createComponent('Marker'),
  ForeignObject: createComponent('ForeignObject'),
};
