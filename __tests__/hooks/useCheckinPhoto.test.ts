/**
 * Tests for useCheckinPhoto hook.
 * expo-image-picker is mocked — tests cover permission + pick logic only.
 */

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///lib.jpg' }] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: { Images: 'Images' },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import * as ImagePicker from 'expo-image-picker';
import { useCheckinPhoto } from '@/hooks/useCheckinPhoto';

const mockCameraPermission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockLibraryPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default happy-path mocks
  mockCameraPermission.mockResolvedValue({ status: 'granted' });
  mockLibraryPermission.mockResolvedValue({ status: 'granted' });
  mockLaunchCamera.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
  mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///lib.jpg' }] });
});

describe('useCheckinPhoto – initial state', () => {
  it('requesting is false initially', () => {
    const { result } = renderHook(() => useCheckinPhoto());
    expect(result.current.requesting).toBe(false);
  });
});

describe('useCheckinPhoto – pickFromCamera', () => {
  it('returns URI on success', async () => {
    const { result } = renderHook(() => useCheckinPhoto());
    let uri: string | null = null;
    await act(async () => {
      uri = await result.current.pickFromCamera();
    });
    expect(uri).toBe('file:///photo.jpg');
  });

  it('returns null when permission denied', async () => {
    mockCameraPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useCheckinPhoto());
    let uri: string | null = 'initial';
    await act(async () => {
      uri = await result.current.pickFromCamera();
    });
    expect(uri).toBeNull();
    expect(mockLaunchCamera).not.toHaveBeenCalled();
  });

  it('returns null when user cancels', async () => {
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: [] });
    const { result } = renderHook(() => useCheckinPhoto());
    let uri: string | null = 'initial';
    await act(async () => {
      uri = await result.current.pickFromCamera();
    });
    expect(uri).toBeNull();
  });
});

describe('useCheckinPhoto – pickFromLibrary', () => {
  it('returns URI on success', async () => {
    const { result } = renderHook(() => useCheckinPhoto());
    let uri: string | null = null;
    await act(async () => {
      uri = await result.current.pickFromLibrary();
    });
    expect(uri).toBe('file:///lib.jpg');
  });

  it('returns null when cancelled', async () => {
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });
    const { result } = renderHook(() => useCheckinPhoto());
    let uri: string | null = 'initial';
    await act(async () => {
      uri = await result.current.pickFromLibrary();
    });
    expect(uri).toBeNull();
  });
});

describe('useCheckinPhoto – requesting flag', () => {
  it('requesting toggles during pickFromCamera operation', async () => {
    // Use a deferred promise to observe the requesting=true state
    let resolveCamera!: (val: any) => void;
    mockLaunchCamera.mockReturnValue(
      new Promise((resolve) => { resolveCamera = resolve; }),
    );

    const { result } = renderHook(() => useCheckinPhoto());
    expect(result.current.requesting).toBe(false);

    let pickPromise: Promise<string | null>;
    act(() => {
      pickPromise = result.current.pickFromCamera();
    });

    // requesting should be true while awaiting
    expect(result.current.requesting).toBe(true);

    // Resolve and finish
    await act(async () => {
      resolveCamera({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
      await pickPromise!;
    });

    expect(result.current.requesting).toBe(false);
  });

  it('requesting resets to false even when permission denied', async () => {
    mockCameraPermission.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useCheckinPhoto());
    await act(async () => {
      await result.current.pickFromCamera();
    });
    expect(result.current.requesting).toBe(false);
  });
});
