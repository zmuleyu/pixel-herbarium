/**
 * Tests for useDiscovery hook — the full capture→identify→save pipeline.
 * All external services are mocked.
 */

jest.mock('@/services/plantId', () => ({
  identifyPlant: jest.fn(),
}));

jest.mock('@/services/antiCheat', () => ({
  checkCooldown: jest.fn(),
  checkQuota: jest.fn(),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('@/utils/geo', () => ({
  fuzzCoordinate: jest.fn((c) => ({ latitude: c.latitude + 0.0001, longitude: c.longitude + 0.0001 })),
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { identifyPlant } from '@/services/plantId';
import { checkCooldown, checkQuota } from '@/services/antiCheat';
import { supabase } from '@/services/supabase';
import { useDiscovery, DiscoveryStatus } from '@/hooks/useDiscovery';

const mockIdentify = identifyPlant as jest.Mock;
const mockCooldown = checkCooldown as jest.Mock;
const mockQuota = checkQuota as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const PHOTO_URI = 'file:///photo.jpg';
const COORD = { latitude: 35.6762, longitude: 139.6503 };
const USER_ID = 'user-123';

// A matching plant in the DB
const MOCK_PLANT = {
  id: 7,
  name_ja: 'タンポポ',
  name_en: 'Dandelion',
  name_latin: 'Taraxacum officinale',
  rarity: 1,
  hanakotoba: '愛の神託',
  flower_meaning: 'Oracle of Love',
};

function setupFromChain(data: any[], error: any = null) {
  const terminal = jest.fn().mockResolvedValue({ data, error });
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn(function () { return terminal(); }),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(function () { return terminal(); }),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCooldown.mockResolvedValue({ allowed: true });
  mockQuota.mockResolvedValue({ allowed: true, remaining: 4 });
  mockIdentify.mockResolvedValue({
    matched: true,
    plantName: 'Taraxacum officinale',
    confidence: 0.85,
    isPlant: true,
  });
  mockRpc.mockResolvedValue({ data: true, error: null });
});

describe('useDiscovery – initial state', () => {
  it('starts with idle status', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(result.current.status).toBe<DiscoveryStatus>('idle');
    expect(result.current.discoveredPlant).toBeNull();
  });
});

describe('useDiscovery – successful pipeline', () => {
  it('sets status = success and returns plant data', async () => {
    // Plant lookup returns a match
    const chain = setupFromChain([MOCK_PLANT]);
    // Insert discovery returns new row id
    chain.single.mockResolvedValue({ data: { id: 'disc-uuid-1' }, error: null });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('success');
    expect(result.current.discoveredPlant?.name_ja).toBe('タンポポ');
    expect(result.current.discoveredPlant?.hanakotoba).toBe('愛の神託');
  });

  it('calls checkCooldown and checkQuota before identifying', async () => {
    setupFromChain([MOCK_PLANT]);

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(mockCooldown).toHaveBeenCalledWith(USER_ID, COORD);
    expect(mockQuota).toHaveBeenCalledWith(USER_ID);
    expect(mockIdentify).toHaveBeenCalledWith(PHOTO_URI);
  });

  it('calls deduct_quota RPC after successful discovery', async () => {
    setupFromChain([MOCK_PLANT]);

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(mockRpc).toHaveBeenCalledWith(
      'deduct_quota',
      expect.objectContaining({ p_user_id: USER_ID }),
    );
  });

  it('stores fuzzed coordinate (not exact GPS) in discovery', async () => {
    const insertMock = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: { id: 'x' }, error: null }),
    });
    mockFrom.mockReturnValueOnce({ ilike: jest.fn().mockReturnThis(), or: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: [MOCK_PLANT], error: null }) });
    mockFrom.mockReturnValueOnce({ insert: insertMock });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    const insertedRow = insertMock.mock.calls[0][0];
    // Exact coord is stored as-is; fuzzy coord must differ
    expect(insertedRow.location_lat).toBe(COORD.latitude);
    expect(insertedRow.location_fuzzy_lat).not.toBe(COORD.latitude);
  });
});

describe('useDiscovery – blocked by anti-cheat', () => {
  it('sets status = cooldown when GPS cooldown active', async () => {
    mockCooldown.mockResolvedValue({ allowed: false, daysRemaining: 5 });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('cooldown');
    expect(result.current.daysRemaining).toBe(5);
    expect(mockIdentify).not.toHaveBeenCalled();
  });

  it('sets status = quota_exceeded when monthly quota exhausted', async () => {
    mockQuota.mockResolvedValue({ allowed: false, remaining: 0 });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('quota_exceeded');
    expect(mockIdentify).not.toHaveBeenCalled();
  });
});

describe('useDiscovery – no match', () => {
  it('sets status = not_a_plant when isPlant=false', async () => {
    mockIdentify.mockResolvedValue({ matched: false, isPlant: false, confidence: 0.02, plantName: null });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('not_a_plant');
  });

  it('sets status = no_match when plant not in local database', async () => {
    // identifyPlant returns a name but DB lookup returns empty
    setupFromChain([]);

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('no_match');
  });
});

describe('useDiscovery – error handling', () => {
  it('sets status = error on identifyPlant failure', async () => {
    mockIdentify.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('error');
  });

  it('resets to idle on reset()', async () => {
    mockIdentify.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD, USER_ID);
    });
    expect(result.current.status).toBe('error');

    act(() => result.current.reset());
    expect(result.current.status).toBe<DiscoveryStatus>('idle');
  });
});
