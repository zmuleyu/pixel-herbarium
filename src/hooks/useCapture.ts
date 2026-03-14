import { useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as ExpoLocation from 'expo-location';
import { isValidGPS } from '@/utils/validation';

export type CaptureStatus = 'idle' | 'ready' | 'capturing' | 'processing' | 'error';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface UseCaptureReturn {
  status: CaptureStatus;
  cameraGranted: boolean;
  locationGranted: boolean;
  location: Coordinate | null;
  errorMessage: string | null;
  requestPermissions: () => Promise<void>;
  acquireLocation: () => Promise<void>;
  reset: () => void;
}

export function useCapture(): UseCaptureReturn {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraGranted = cameraPermission?.granted ?? false;

  const requestPermissions = useCallback(async () => {
    if (!cameraGranted) {
      await requestCameraPermission();
    }
    const { status: locStatus } = await ExpoLocation.requestForegroundPermissionsAsync();
    setLocationGranted(locStatus === 'granted');
  }, [cameraGranted, requestCameraPermission]);

  const acquireLocation = useCallback(async () => {
    try {
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      const coord: Coordinate = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      if (!isValidGPS(coord)) {
        setStatus('error');
        setErrorMessage('GPS coordinate invalid. Please enable location and try again.');
        return;
      }
      setLocation(coord);
      setStatus('ready');
    } catch {
      setStatus('error');
      setErrorMessage('Could not acquire GPS location. Please try again.');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setLocation(null);
    setErrorMessage(null);
  }, []);

  return {
    status,
    cameraGranted,
    locationGranted,
    location,
    errorMessage,
    requestPermissions,
    acquireLocation,
    reset,
  };
}
