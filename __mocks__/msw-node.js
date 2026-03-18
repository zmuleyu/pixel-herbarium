// __mocks__/msw-node.js
// Stub for msw/node used by screens jest project.
// The screen tests don't make real network requests so we only need
// a no-op setupServer.
const setupServer = (...handlers) => ({
  listen: jest.fn(),
  close: jest.fn(),
  resetHandlers: jest.fn(),
  use: jest.fn(),
});

module.exports = { setupServer };
