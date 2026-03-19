import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { plantsHandlers } from './handlers/plants';
import { identifyHandlers } from './handlers/identify';
import { quotaHandlers } from './handlers/quota';

export const server = setupServer(
  ...authHandlers,
  ...plantsHandlers,
  ...identifyHandlers,
  ...quotaHandlers,
);

// Start server before all tests in this setup file (used by screens project)
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
