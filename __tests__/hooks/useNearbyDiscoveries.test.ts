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

// GeoJSON Point as PostgREST returns it
function makeGeoJSON(lat: number, lon: number) {
  return { type: 'Point', coordinates: [lon, lat] };
}

// RPC raw rows (location_fuzzy as GeoJSON)
const MOCK_RPC_ROWS = [
  {
    id: 'disc-1',
    plant_id: 7,
    location_fuzzy: makeGeoJSON(35.6770, 139.6510),
    city: '東京都',
    is_public: true,
    created_at: '2026-04-10T10:00:00Z',
  },
  {
    id: 'disc-2',
    plant_id: 42,
    location_fuzzy: makeGeoJSON(35.6750, 139.6490),
    city: '東京都',
    is_public: true,
    created_at: '2026-04-11T09:00:00Z',
  },
];

const MOCK_PLANTS = [
  { id: 7,  name_ja: 'タンポポ',   hanakotoba: '愛の神託' },
  { id: 42, name_ja: 'シバザクラ', hanakotoba: '合意' },
];

function setupMocks(rpcRows = MOCK_RPC_ROWS, plants = MOCK_PLANTS, rpcError: any = null) {
  mockRequestPerm.mockResolvedValue({ status: 'granted' });
  mockGetPosition.mockResolvedValue({
    coords: { latitude: TOKYO.latitude, longitude: TOKYO.longitude, accuracy: 20 },
  });
  mockRpc.mockResolvedValue({ data: rpcRows, error: rpcError });

  const plantsChain = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: plants, error: null }),
  };
  mockFrom.mockReturnValue(plantsChain);
}

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset();
  mockGetPosition.mockReset();
  mockRequestPerm.mockReset();
});

describe('useNearbyDiscoveries – initial load', () => {
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
    expect(result.current.discoveries[0].latitude).toBeCloseTo(35.6770);
    expect(result.current.discoveries[0].longitude).toBeCloseTo(139.6510);
  });

  it('enriches discoveries with plant name and hanakotoba', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    const d = result.current.discoveries.find((x) => x.plant_id === 7);
    expect(d?.plant_name_ja).toBe('タンポポ');
    expect(d?.hanakotoba).toBe('愛の神託');
  });

  it('returns correct count of discoveries', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(2);
    expect(result.current.loading).toBe(false);
  });
});

describe('useNearbyDiscoveries – empty results', () => {
  it('returns empty array when no nearby discoveries', async () => {
    setupMocks([], []);
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});

describe('useNearbyDiscoveries – error handling', () => {
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
});

describe('useNearbyDiscoveries – refresh', () => {
  it('re-fetches when refresh() is called', async () => {
    setupMocks();
    const { result } = renderHook(() => useNearbyDiscoveries());
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(2);

    // On refresh return only 1
    setupMocks(
      [MOCK_RPC_ROWS[0]],
      [MOCK_PLANTS[0]],
    );
    act(() => { result.current.refresh(); });
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries).toHaveLength(1);
  });
});
