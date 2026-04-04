/**
 * Tests for analytics service: fire-and-forget event tracking via Supabase.
 */

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import { supabase } from '@/services/supabase';
import { trackEvent } from '@/services/analytics';

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  mockFrom.mockClear();
  jest.restoreAllMocks();
});

describe('trackEvent', () => {
  it('calls supabase.from("analytics_events").insert()', () => {
    trackEvent('page_view');

    expect(mockFrom).toHaveBeenCalledWith('analytics_events');
    const chain = mockFrom.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalled();
  });

  it('includes event_type in the insert payload', () => {
    trackEvent('button_click');

    const chain = mockFrom.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'button_click' }),
    );
  });

  it('includes properties object in the insert payload', () => {
    const props = { screen: 'home', count: 3 };
    trackEvent('nav', props);

    const chain = mockFrom.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ properties: props }),
    );
  });

  it('defaults properties to empty object when not provided', () => {
    trackEvent('app_open');

    const chain = mockFrom.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ properties: {} }),
    );
  });

  it('does not throw on insert error payload and logs a warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockResolvedValue({ error: new Error('insert failed') }),
    });

    expect(() => trackEvent('fail_event')).not.toThrow();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledWith(
      'trackEvent: failed to persist analytics event',
      expect.any(Error),
    );
  });

  it('does not throw on rejected insert promise and logs a warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockRejectedValue(new Error('network down')),
    });

    expect(() => trackEvent('reject_event')).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(warn).toHaveBeenCalledWith(
      'trackEvent: unexpected analytics failure',
      expect.any(Error),
    );
  });
});
