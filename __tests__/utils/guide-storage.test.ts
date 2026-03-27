jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetGuide, resetAllGuides } from '@/utils/guide-storage';

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resetGuide', () => {
  it('removes the correct AsyncStorage key for a given feature', async () => {
    await resetGuide('discover');
    expect(mockedStorage.removeItem).toHaveBeenCalledWith('guide_seen_discover');
  });

  it('removes key for stamp feature', async () => {
    await resetGuide('stamp');
    expect(mockedStorage.removeItem).toHaveBeenCalledWith('guide_seen_stamp');
  });

  it('calls removeItem exactly once', async () => {
    await resetGuide('map');
    expect(mockedStorage.removeItem).toHaveBeenCalledTimes(1);
  });
});

describe('resetAllGuides', () => {
  it('removes all known guide keys via multiRemove', async () => {
    await resetAllGuides();
    expect(mockedStorage.multiRemove).toHaveBeenCalledWith([
      'guide_seen_discover',
      'guide_seen_stamp',
      'guide_seen_herbarium',
      'guide_seen_map',
    ]);
  });

  it('calls multiRemove exactly once', async () => {
    await resetAllGuides();
    expect(mockedStorage.multiRemove).toHaveBeenCalledTimes(1);
  });
});
