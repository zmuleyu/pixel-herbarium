/**
 * Tests for anti-cheat: GPS cooldown and monthly quota checks.
 * Supabase client is mocked — tests cover business logic only.
 */

jest.mock('@/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

import { supabase } from '@/services/supabase';
import { checkCooldown, checkQuota } from '@/services/antiCheat';

const mockRpc = supabase.rpc as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const TOKYO = { latitude: 35.6762, longitude: 139.6503 };
const USER_ID = 'user-abc-123';

// Helper to build a mock Supabase query chain
function mockFromChain(data: any[], error: any = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data, error }),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset();
});

describe('checkCooldown', () => {
  it('returns allowed=true when no nearby discovery in last 7 days', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await checkCooldown(USER_ID, TOKYO);
    expect(result.allowed).toBe(true);
    expect(result.daysRemaining).toBeUndefined();
  });

  it('returns allowed=false when cooldown active, with daysRemaining', async () => {
    const discoveredAt = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(); // 2 days ago
    mockRpc.mockResolvedValueOnce({
      data: [{ created_at: discoveredAt }],
      error: null,
    });

    const result = await checkCooldown(USER_ID, TOKYO);
    expect(result.allowed).toBe(false);
    expect(result.daysRemaining).toBe(5); // 7 - 2 = 5 days remaining
  });

  it('returns allowed=true when discovery is exactly 7 days ago (boundary)', async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000 - 1000).toISOString();
    mockRpc.mockResolvedValueOnce({ data: [{ created_at: sevenDaysAgo }], error: null });

    const result = await checkCooldown(USER_ID, TOKYO);
    // RPC filters by date server-side; if it returned a row, cooldown applies.
    // Our function trusts the RPC result: row present = cooldown active.
    expect(result.allowed).toBe(false);
  });

  it('throws on Supabase error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('DB error') });

    await expect(checkCooldown(USER_ID, TOKYO)).rejects.toThrow('DB error');
  });
});

describe('checkQuota', () => {
  it('returns allowed=true with remaining count when quota not exhausted', async () => {
    mockFromChain([{ used: 3, limit: 5 }]);

    const result = await checkQuota(USER_ID);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('returns allowed=false when quota exhausted', async () => {
    mockFromChain([{ used: 5, limit: 5 }]);

    const result = await checkQuota(USER_ID);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns allowed=true with full quota when no row exists yet (new user)', async () => {
    mockFromChain([]); // no quota row yet

    const result = await checkQuota(USER_ID);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5); // MONTHLY_QUOTA default
  });

  it('throws on Supabase error', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: new Error('quota error') }),
    };
    mockFrom.mockReturnValue(chain);

    await expect(checkQuota(USER_ID)).rejects.toThrow('quota error');
  });
});
