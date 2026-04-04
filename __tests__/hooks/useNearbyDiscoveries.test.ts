/**
 * Tests for useNearbyDiscoveries hook.
 * expo-location and supabase are mocked.
 */

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock('@/services/supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import * as ExpoLocation from 'expo-location';
import { supabase } from '@/services/supabase';
import { useNearbyDiscoveries } from '@/hooks/useNearbyDiscoveries';

const mockGetPosition = ExpoLocation.getCurrentPositionAsync as jest.Mock;
const mockRequestPerm = ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const TOKYO = { latitude: 35.6762, longitude: 139.6503 };
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeGeoJSON(lat: number, lon: number) {
  return { type: 'Point', coordinates: [lon, lat] };
}

const MOCK_RPC_ROWS = [
  {
    id: 'disc-1',
    plant_id: 7,
    location_fuzzy: makeGeoJSON(35.677, 139.651),
    city: 'Tokyo',
    is_public: true,
    created_at: '2026-04-10T10:00:00Z',
  },
  {
    id: 'disc-2',
    plant_id: 42,
    location_fuzzy: makeGeoJSON(35.675, 139.649),
    city: 'Tokyo',
    is_public: true,
    created_at: '2026-04-11T09:00:00Z',
  },
];

const MOCK_PLANTS = [
  { id: 7, name_ja: 'Campanula', hanakotoba: 'Gratitude', rarity: 1 },
  { id: 42, name_ja: 'Snowdrop', hanakotoba: 'Hope', rarity: 3 },
];

function setupMocks(
  rpcRows = MOCK_RPC_ROWS,
  plants = MOCK_PLANTS,
  rpcError: any = null,
  plantsError: any = null,
) {
  mockRequestPerm.mockResolvedValue({ status: 'granted' });
  mockGetPosition.mockResolvedValue({
    coords: { latitude: TOKYO.latitude, longitude: TOKYO.longitude, accuracy: 20 },
  });
  mockRpc.mockResolvedValue({ data: rpcRows, error: rpcError });

  const plantsChain = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: plants, error: plantsError }),
  };
  mockFrom.mockReturnValue(plantsChain);
}

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset();
  mockGetPosition.mockReset();
  mockRequestPerm.mockReset();
  jest.restoreAllMocks();
});

describe('useNearbyDiscoveries initial load', () => {
  it('starts with loading=true', () => {
    mockRequestPerm.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useNearbyDiscoveries());
    expect(result.current.loading).toBe(true);
  });

  it('sets userLocation from GPS', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.userLocation?.latitude).toBe(TOKYO.latitude);
    expect(result.current.userLocation?.longitude).toBe(TOKYO.longitude);
  });

  it('parses GeoJSON coordinates into lat/lon', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries[0].latitude).toBeCloseTo(35.677);
    expect(result.current.discoveries[0].longitude).toBeCloseTo(139.651);
  });

  it('enriches discoveries with plant name, hanakotoba, and rarity', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    const first = result.current.discoveries.find((item) => item.plant_id === 7);
    expect(first?.plant_name_ja).toBe('Campanula');
    expect(first?.hanakotoba).toBe('Gratitude');
    expect(first?.rarity).toBe(1);
    const second = result.current.discoveries.find((item) => item.plant_id === 42);
    expect(second?.rarity).toBe(3);
  });

  it('returns correct count of discoveries', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });
});

describe('useNearbyDiscoveries empty results', () => {
  it('returns empty array when no nearby discoveries', async () => {
    setupMocks([], []);
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});

describe('useNearbyDiscoveries error handling', () => {
  it('sets loading=false on RPC error', async () => {
    setupMocks([], [], new Error('RPC failed'));
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.discoveries).toHaveLength(0);
  });

  it('sets loading=false when location permission denied', async () => {
    mockRequestPerm.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.userLocation).toBeNull();
  });

  it('sets loading=false when permission request throws', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockRequestPerm.mockRejectedValue(new Error('permissions unavailable'));
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.discoveries).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(
      'useNearbyDiscoveries: failed to load nearby discoveries',
      expect.any(Error),
    );
  });

  it('falls back to default metadata when plant lookup fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    setupMocks(MOCK_RPC_ROWS, [], null, new Error('plants failed'));
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.discoveries[0]?.plant_name_ja).toBe('Unknown');
    expect(result.current.discoveries[0]?.rarity).toBe(1);
    expect(warn).toHaveBeenCalledWith(
      'useNearbyDiscoveries: failed to load plant metadata',
      expect.any(Error),
    );
  });
});

describe('useNearbyDiscoveries refresh', () => {
  it('re-fetches when refresh() is called', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(2);

    setupMocks([MOCK_RPC_ROWS[0]], [MOCK_PLANTS[0]]);
    act(() => { result.current.refresh(); });
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(1);
  });
});
