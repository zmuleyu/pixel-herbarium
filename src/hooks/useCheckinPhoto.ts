// Hook for picking a photo for check-in: camera or library.
// Handles permission requests internally; returns null if denied or cancelled.

import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface UseCheckinPhotoReturn {
  pickFromCamera: () => Promise<string | null>;
  pickFromLibrary: () => Promise<string | null>;
  requesting: boolean;
}

export function useCheckinPhoto(): UseCheckinPhotoReturn {
  const [requesting, setRequesting] = useState(false);

  const pickFromCamera = async (): Promise<string | null> => {
    setRequesting(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return null;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });
      if (result.canceled) return null;
      return result.assets[0].uri;
    } finally {
      setRequesting(false);
    }
  };

  const pickFromLibrary = async (): Promise<string | null> => {
    setRequesting(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return null;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });
      if (result.canceled) return null;
      return result.assets[0].uri;
    } finally {
      setRequesting(false);
    }
  };

  return { pickFromCamera, pickFromLibrary, requesting };
}
