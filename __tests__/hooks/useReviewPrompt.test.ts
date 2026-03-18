// __tests__/hooks/useReviewPrompt.test.ts
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem:  jest.fn((k: string) => Promise.resolve(mockStorage[k] ?? null)),
    setItem:  jest.fn((k: string, v: string) => { mockStorage[k] = v; return Promise.resolve(); }),
  },
}));
jest.mock('expo-store-review', () => ({
  requestReview: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

import { maybeRequestReview } from '../../src/hooks/useReviewPrompt';
import * as StoreReview from 'expo-store-review';

beforeEach(() => {
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  jest.clearAllMocks();
});

describe('maybeRequestReview', () => {
  it('calls requestReview on first trigger', async () => {
    await maybeRequestReview('firstCheckin');
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });

  it('does NOT call requestReview a second time within 30 days', async () => {
    await maybeRequestReview('firstCheckin'); // first call
    await maybeRequestReview('firstCheckin'); // within 30 days
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });

  it('calls requestReview again after 30+ days have passed', async () => {
    const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    mockStorage['ph_review_last_shown'] = past;
    await maybeRequestReview('fiveCheckins');
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });
});
