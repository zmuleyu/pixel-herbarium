/**
 * Tests for useDiscovery hook — calls /verify and /identify edge functions.
 * External calls are mocked via supabase.functions.invoke and expo-file-system.
 */

jest.mock('@/services/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64imagedata=='),
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { useDiscovery, DiscoveryStatus } from '@/hooks/useDiscovery';

const mockInvoke = supabase.functions.invoke as jest.Mock;

const PHOTO_URI = 'file:///photo.jpg';
const COORD = { latitude: 35.6762, longitude: 139.6503 };

const MOCK_PLANT = {
  id: 7,
  name_ja: 'タンポポ',
  name_en: 'Dandelion',
  name_latin: 'Taraxacum officinale',
  rarity: 1,
  hanakotoba: '愛の神託',
  flower_meaning: 'Oracle of Love',
};

function mockVerifyAllowed() {
  mockInvoke.mockResolvedValueOnce({ data: { allowed: true }, error: null });
}

function mockVerifyCooldown(daysRemaining = 5) {
  mockInvoke.mockResolvedValueOnce({
    data: { allowed: false, reason: 'cooldown', daysRemaining },
    error: null,
  });
}

function mockVerifyQuotaExceeded() {
  mockInvoke.mockResolvedValueOnce({
    data: { allowed: false, reason: 'quota_exceeded' },
    error: null,
  });
}

function mockIdentifySuccess() {
  mockInvoke.mockResolvedValueOnce({
    data: { status: 'success', plant: MOCK_PLANT, discoveryId: 'disc-uuid-1' },
    error: null,
  });
}

function mockIdentifyNotAPlant() {
  mockInvoke.mockResolvedValueOnce({
    data: { status: 'not_a_plant' },
    error: null,
  });
}

function mockIdentifyNoMatch() {
  mockInvoke.mockResolvedValueOnce({
    data: { status: 'no_match' },
    error: null,
  });
}

function mockPixelateSuccess() {
  // Pixelate is fire-and-forget; mock it to resolve cleanly
  mockInvoke.mockResolvedValueOnce({
    data: { pixelUrl: 'https://example.com/pixel.png' },
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------

describe('useDiscovery – initial state', () => {
  it('starts with idle status and no plant', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(result.current.status).toBe<DiscoveryStatus>('idle');
    expect(result.current.discoveredPlant).toBeNull();
  });
});

// ---------------------------------------------------------------------------

describe('useDiscovery – successful pipeline', () => {
  it('calls /verify then /identify and returns plant on success', async () => {
    mockVerifyAllowed();
    mockIdentifySuccess();
    mockPixelateSuccess();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('success');
    expect(result.current.discoveredPlant?.name_ja).toBe('タンポポ');
    expect(result.current.discoveredPlant?.hanakotoba).toBe('愛の神託');
  });

  it('calls /verify first with correct coordinates', async () => {
    mockVerifyAllowed();
    mockIdentifySuccess();
    mockPixelateSuccess();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'verify', {
      body: { lat: COORD.latitude, lon: COORD.longitude },
    });
  });

  it('calls /identify second with imageBase64 and coords', async () => {
    mockVerifyAllowed();
    mockIdentifySuccess();
    mockPixelateSuccess();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'identify', {
      body: {
        imageBase64: 'base64imagedata==',
        lat: COORD.latitude,
        lon: COORD.longitude,
      },
    });
  });

  it('fires /pixelate without awaiting (fire-and-forget)', async () => {
    mockVerifyAllowed();
    mockIdentifySuccess();
    mockPixelateSuccess();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    // pixelate is the third invocation
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'pixelate', {
      body: { discoveryId: 'disc-uuid-1' },
    });
  });
});

// ---------------------------------------------------------------------------

describe('useDiscovery – blocked by /verify', () => {
  it('sets status = cooldown with daysRemaining when GPS cooldown active', async () => {
    mockVerifyCooldown(5);

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('cooldown');
    expect(result.current.daysRemaining).toBe(5);
    // /identify must NOT have been called
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('sets status = quota_exceeded when monthly quota exhausted', async () => {
    mockVerifyQuotaExceeded();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('quota_exceeded');
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------

describe('useDiscovery – plant not identified', () => {
  it('sets status = not_a_plant when /identify returns not_a_plant', async () => {
    mockVerifyAllowed();
    mockIdentifyNotAPlant();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('not_a_plant');
    // pixelate must NOT have been called
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it('sets status = no_match when /identify returns no_match', async () => {
    mockVerifyAllowed();
    mockIdentifyNoMatch();

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('no_match');
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------

describe('useDiscovery – error handling', () => {
  it('sets status = error when /verify throws', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Network error') });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('error');
  });

  it('sets status = error when /identify throws', async () => {
    mockVerifyAllowed();
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('Identify failed') });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    expect(result.current.status).toBe<DiscoveryStatus>('error');
  });

  it('does NOT set status = error when /pixelate fails (non-fatal)', async () => {
    mockVerifyAllowed();
    mockIdentifySuccess();
    // pixelate fails
    mockInvoke.mockRejectedValueOnce(new Error('Replicate timeout'));

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });

    // success because pixelate failure is swallowed
    expect(result.current.status).toBe<DiscoveryStatus>('success');
  });

  it('resets to idle on reset()', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error('fail') });

    const { result } = renderHook(() => useDiscovery());
    await act(async () => {
      await result.current.runDiscovery(PHOTO_URI, COORD);
    });
    expect(result.current.status).toBe('error');

    act(() => result.current.reset());
    expect(result.current.status).toBe<DiscoveryStatus>('idle');
    expect(result.current.discoveredPlant).toBeNull();
  });
});
