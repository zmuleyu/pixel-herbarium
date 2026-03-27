import * as Haptics from 'expo-haptics';
import { HapticPatterns } from '@/utils/haptics';

// expo-haptics is already mapped to __mocks__/expo-haptics.js via moduleNameMapper

const mockedHaptics = Haptics as jest.Mocked<typeof Haptics>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HapticPatterns', () => {
  it('exports expected function names', () => {
    expect(typeof HapticPatterns.plantCollected).toBe('function');
    expect(typeof HapticPatterns.cardFlip).toBe('function');
    expect(typeof HapticPatterns.rarePlantFound).toBe('function');
    expect(typeof HapticPatterns.seasonChange).toBe('function');
    expect(typeof HapticPatterns.stampPress).toBe('function');
    expect(typeof HapticPatterns.posterSaved).toBe('function');
    expect(typeof HapticPatterns.error).toBe('function');
  });

  it('plantCollected calls impactAsync with Heavy', async () => {
    await HapticPatterns.plantCollected();
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it('cardFlip calls selectionAsync', async () => {
    await HapticPatterns.cardFlip();
    expect(mockedHaptics.selectionAsync).toHaveBeenCalled();
  });

  it('rarePlantFound calls impactAsync 3 times with Medium', async () => {
    await HapticPatterns.rarePlantFound();
    expect(mockedHaptics.impactAsync).toHaveBeenCalledTimes(3);
    expect(mockedHaptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it('does not throw when haptics module rejects', async () => {
    mockedHaptics.impactAsync.mockRejectedValueOnce(new Error('unavailable'));
    await expect(HapticPatterns.plantCollected()).resolves.toBeUndefined();
  });
});
