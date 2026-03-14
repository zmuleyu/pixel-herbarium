import { colors, spacing, typography, borderRadius } from '../../src/constants/theme';

describe('theme', () => {
  it('has cream white background, not pure white', () => {
    expect(colors.background).toBe('#f5f4f1');
    expect(colors.background).not.toBe('#ffffff');
  });

  it('has sage green as primary plant color', () => {
    expect(colors.plantPrimary).toBe('#9fb69f');
  });

  it('has near-black text, not pure black', () => {
    expect(colors.text).toBe('#3a3a3a');
    expect(colors.text).not.toBe('#000000');
  });

  it('has all required rarity colors', () => {
    expect(colors.rarity).toHaveProperty('common');
    expect(colors.rarity).toHaveProperty('uncommon');
    expect(colors.rarity).toHaveProperty('rare');
  });

  it('has all three seasonal colors', () => {
    expect(colors.seasonal).toHaveProperty('sakura');
    expect(colors.seasonal).toHaveProperty('ajisai');
    expect(colors.seasonal).toHaveProperty('momiji');
  });

  it('has required spacing values', () => {
    expect(spacing).toHaveProperty('xs');
    expect(spacing).toHaveProperty('sm');
    expect(spacing).toHaveProperty('md');
    expect(spacing).toHaveProperty('lg');
    expect(spacing).toHaveProperty('xl');
  });

  it('has Maru-Gothic as display font', () => {
    expect(typography.fontFamily.display).toBe('HiraginoMaruGothicProN');
  });

  it('has spacious line height for Japanese text', () => {
    expect(typography.lineHeight).toBeGreaterThanOrEqual(1.5);
  });

  it('has borderRadius values', () => {
    expect(borderRadius).toHaveProperty('sm');
    expect(borderRadius).toHaveProperty('full');
  });
});
