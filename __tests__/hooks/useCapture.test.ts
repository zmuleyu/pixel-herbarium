/**
 * Tests for useCapture hook logic.
 * expo-camera and expo-location are mocked — we test state transitions only.
 */

// Mock expo modules before importing hook
jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
  CameraType: { back: 'back' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 6 },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import * as ExpoCamera from 'expo-camera';
import * as ExpoLocation from 'expo-location';
import { useCapture, CaptureStatus } from '@/hooks/useCapture';

const mockRequestCamera = jest.fn();

function setupCameraPermission(granted: boolean) {
  (ExpoCamera.useCameraPermissions as jest.Mock).mockReturnValue([
    { granted },
    mockRequestCamera,
  ]);
}

describe('useCapture – initial state', () => {
  beforeEach(() => {
    setupCameraPermission(false);
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: 'denied' }
    );
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useCapture());
    expect(result.current.status).toBe<CaptureStatus>('idle');
  });

  it('exposes cameraGranted = false when permission not granted', () => {
    const { result } = renderHook(() => useCapture());
    expect(result.current.cameraGranted).toBe(false);
  });
});

describe('useCapture – requestPermissions', () => {
  it('sets locationGranted = true when location permission granted', async () => {
    setupCameraPermission(true);
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: 'granted' }
    );

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.locationGranted).toBe(true);
  });

  it('sets locationGranted = false when location permission denied', async () => {
    setupCameraPermission(true);
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: 'denied' }
    );

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(result.current.locationGranted).toBe(false);
  });
});

describe('useCapture – acquireLocation', () => {
  beforeEach(() => {
    setupCameraPermission(true);
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: 'granted' }
    );
  });

  it('stores valid GPS coordinate and sets status = ready', async () => {
    (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 35.6762, longitude: 139.6503, accuracy: 10 },
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
      await result.current.acquireLocation();
    });

    expect(result.current.location?.latitude).toBe(35.6762);
    expect(result.current.location?.longitude).toBe(139.6503);
    expect(result.current.status).toBe<CaptureStatus>('ready');
  });

  it('sets status = error when GPS returns null coords', async () => {
    (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: NaN, longitude: NaN, accuracy: 0 },
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
      await result.current.acquireLocation();
    });

    expect(result.current.status).toBe<CaptureStatus>('error');
    expect(result.current.errorMessage).toMatch(/GPS/);
  });

  it('sets status = error when location throws', async () => {
    (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error('Location unavailable')
    );

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
      await result.current.acquireLocation();
    });

    expect(result.current.status).toBe<CaptureStatus>('error');
  });
});

describe('useCapture – reset', () => {
  it('resets to idle state', async () => {
    setupCameraPermission(true);
    (ExpoLocation.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: 'granted' }
    );
    (ExpoLocation.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 35.6762, longitude: 139.6503, accuracy: 5 },
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCapture());
    await act(async () => {
      await result.current.requestPermissions();
      await result.current.acquireLocation();
    });
    expect(result.current.status).toBe('ready');

    act(() => result.current.reset());
    expect(result.current.status).toBe<CaptureStatus>('idle');
    expect(result.current.location).toBeNull();
  });
});
