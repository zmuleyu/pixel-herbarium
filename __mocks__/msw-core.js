// __mocks__/msw-core.js
// Stub for the main 'msw' package used by test handlers.
// The screen tests don't make real network requests so we only need
// no-op stubs for http, HttpResponse, and ws.

const http = {
  get: jest.fn(() => ({})),
  post: jest.fn(() => ({})),
  put: jest.fn(() => ({})),
  patch: jest.fn(() => ({})),
  delete: jest.fn(() => ({})),
  all: jest.fn(() => ({})),
};

const HttpResponse = {
  json: jest.fn((data, init) => ({ data, init })),
  text: jest.fn((text, init) => ({ text, init })),
  error: jest.fn(() => ({})),
};

const ws = {
  link: jest.fn(() => ({})),
};

const passthrough = jest.fn(() => ({}));

module.exports = { http, HttpResponse, ws, passthrough };
