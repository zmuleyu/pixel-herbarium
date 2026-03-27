/**
 * Tests for useGuideState hook.
 * AsyncStorage is mocked — tests cover load/persist logic only.
 */

const mockGetItem = jest.fn().mockResolvedValue(null);
const mockSetItem = jest.fn().mockResolvedValue(undefined);
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { useGuideState } from '@/hooks/useGuideState';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
});

describe('useGuideState – initial load', () => {
  it('starts with loading=true', () => {
    // Use a never-resolving promise so loading stays true
    mockGetItem.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useGuideState('checkin'));
    expect(result.current.loading).toBe(true);
  });

  it('returns seen=false when nothing in storage', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useGuideState('checkin'));
    await act(async () => { await flushPromises(); });
    expect(result.current.seen).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('returns seen=true when stored value is "true"', async () => {
    mockGetItem.mockResolvedValue('true');
    const { result } = renderHook(() => useGuideState('checkin'));
    await act(async () => { await flushPromises(); });
    expect(result.current.seen).toBe(true);
    expect(result.current.loading).toBe(false);
  });
});

describe('useGuideState – markSeen', () => {
  it('persists "true" to AsyncStorage', async () => {
    const { result } = renderHook(() => useGuideState('checkin'));
    await act(async () => { await flushPromises(); });

    act(() => { result.current.markSeen(); });

    expect(result.current.seen).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith('guide_seen_checkin', 'true');
  });
});

describe('useGuideState – reset', () => {
  it('removes the key from storage', async () => {
    mockGetItem.mockResolvedValue('true');
    const { result } = renderHook(() => useGuideState('checkin'));
    await act(async () => { await flushPromises(); });
    expect(result.current.seen).toBe(true);

    act(() => { result.current.reset(); });

    expect(result.current.seen).toBe(false);
    expect(mockRemoveItem).toHaveBeenCalledWith('guide_seen_checkin');
  });
});

describe('useGuideState – storage key', () => {
  it('uses correct storage key per guide ID', async () => {
    renderHook(() => useGuideState('herbarium'));
    await act(async () => { await flushPromises(); });
    expect(mockGetItem).toHaveBeenCalledWith('guide_seen_herbarium');

    jest.clearAllMocks();
    renderHook(() => useGuideState('bouquet'));
    await act(async () => { await flushPromises(); });
    expect(mockGetItem).toHaveBeenCalledWith('guide_seen_bouquet');
  });
});
