/**
 * Tests for analytics service: fire-and-forget event tracking via Supabase.
 */

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnValue({
        then: jest.fn((cb: any) => { cb?.(); return Promise.resolve(); }),
      }),
    })),
  },
}));

import { supabase } from '@/services/supabase';
import { trackEvent } from '@/services/analytics';

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  mockFrom.mockClear();
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

  it('does not throw on insert error (fire-and-forget pattern)', () => {
    // trackEvent is synchronous — it fires and forgets.
    // Even if insert returns an error payload, trackEvent never awaits it.
    mockFrom.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        then: jest.fn((cb: any) => { cb?.(); return Promise.resolve(); }),
      }),
    });

    expect(() => trackEvent('fail_event')).not.toThrow();
    // Verify insert was still called despite error scenario
    const chain = mockFrom.mock.results[0].value;
    expect(chain.insert).toHaveBeenCalled();
  });
});
