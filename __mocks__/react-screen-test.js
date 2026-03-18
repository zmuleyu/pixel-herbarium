// __mocks__/react-screen-test.js
// A React mock for screen tests that replaces hooks with stub implementations.
// Allows shallowRender to call function components without a live React dispatcher.

// Use absolute path to bypass any moduleNameMapper that might affect jest.requireActual
const path = require('path');
const reactPath = path.resolve(__dirname, '../node_modules/react/index.js');
const actual = require(reactPath);

// Stub hooks that require an active fiber dispatcher
function useState(initialValue) {
  const value = typeof initialValue === 'function' ? initialValue() : initialValue;
  return [value, jest.fn()];
}

function useRef(initialValue) {
  return { current: initialValue !== undefined ? initialValue : null };
}

function useEffect() {}
function useLayoutEffect() {}
function useMemo(factory) { return factory(); }
function useCallback(fn) { return fn; }
function useContext() { return undefined; }
function useReducer(reducer, initialState) {
  const init = typeof initialState === 'function' ? initialState() : initialState;
  return [init, jest.fn()];
}
function useImperativeHandle() {}
function useDebugValue() {}
function useDeferredValue(value) { return value; }
function useTransition() { return [false, jest.fn()]; }
function useId() { return 'mock-id'; }
function useSyncExternalStore(subscribe, getSnapshot) { return getSnapshot(); }
function useInsertionEffect() {}

// Build mock by combining real React with stub hooks
const mock = Object.assign({}, actual, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useContext,
  useReducer,
  useImperativeHandle,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId,
  useSyncExternalStore,
  useInsertionEffect,
});

// For esModuleInterop: import React from 'react' compiles to
//   const react_1 = __importDefault(require('react'))
// Since __esModule=true, __importDefault returns the module as-is,
// so react_1 = module.exports, and react_1.default must have createElement.
module.exports = mock;
module.exports.default = mock;
module.exports.__esModule = true;
