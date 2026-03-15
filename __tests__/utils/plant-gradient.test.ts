import { getPlantGradientColors } from '@/utils/plant-gradient';

describe('getPlantGradientColors', () => {
  it('returns sage green gradient for common rarity', () => {
    const result = getPlantGradientColors(1, [], 1);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('returns sky blue gradient for uncommon rarity', () => {
    const result = getPlantGradientColors(2, [], 1);
    expect(result).toEqual(['#e0eaf5', '#f5f4f1']);
  });

  it('returns blush pink gradient for rare rarity', () => {
    const result = getPlantGradientColors(3, [], 1);
    expect(result).toEqual(['#f5e0dd', '#f5f4f1']);
  });

  it('falls back to common for unknown rarity', () => {
    const result = getPlantGradientColors(99, [], 1);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('enhances common start color when in bloom', () => {
    const result = getPlantGradientColors(1, [3, 4], 3);
    expect(result).toEqual(['#e6f2e6', '#f5f4f1']);
  });

  it('enhances uncommon start color when in bloom', () => {
    const result = getPlantGradientColors(2, [6, 7], 6);
    expect(result).toEqual(['#deeaf7', '#f5f4f1']);
  });

  it('enhances rare start color when in bloom', () => {
    const result = getPlantGradientColors(3, [3, 4], 3);
    expect(result).toEqual(['#f7dedb', '#f5f4f1']);
  });

  it('uses base color when not in bloom', () => {
    const result = getPlantGradientColors(1, [3, 4], 7);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('never enhances with empty bloom array', () => {
    const result = getPlantGradientColors(2, [], 6);
    expect(result).toEqual(['#e0eaf5', '#f5f4f1']);
  });

  it('returns tuple of two strings', () => {
    const result = getPlantGradientColors(1, [1], 1);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('string');
  });
});
