jest.mock('@/constants/sprites', () => ({
  getPlantSprite: jest.fn(),
}));

import { resolvePlantImage } from '@/utils/plant-image';
import { getPlantSprite } from '@/constants/sprites';

const mockedGetPlantSprite = getPlantSprite as jest.MockedFunction<typeof getPlantSprite>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resolvePlantImage', () => {
  it('returns uri object when pixel_sprite_url is provided', () => {
    const result = resolvePlantImage(1, 'https://cdn.example.com/plant_1.png');
    expect(result).toEqual({ uri: 'https://cdn.example.com/plant_1.png' });
  });

  it('does not call getPlantSprite when URL is available', () => {
    resolvePlantImage(1, 'https://cdn.example.com/plant_1.png');
    expect(mockedGetPlantSprite).not.toHaveBeenCalled();
  });

  it('returns bundled fallback when no URL is provided', () => {
    const fakeBundled = 42; // require() returns a number in RN
    mockedGetPlantSprite.mockReturnValue(fakeBundled);

    const result = resolvePlantImage(5, null);
    expect(result).toBe(fakeBundled);
    expect(mockedGetPlantSprite).toHaveBeenCalledWith(5);
  });

  it('returns null when neither URL nor bundled sprite exists', () => {
    mockedGetPlantSprite.mockReturnValue(undefined);

    const result = resolvePlantImage(999, null);
    expect(result).toBeNull();
  });

  it('prefers remote URL over bundled sprite', () => {
    mockedGetPlantSprite.mockReturnValue(42);

    const result = resolvePlantImage(1, 'https://cdn.example.com/remote.png');
    expect(result).toEqual({ uri: 'https://cdn.example.com/remote.png' });
    expect(mockedGetPlantSprite).not.toHaveBeenCalled();
  });
});
