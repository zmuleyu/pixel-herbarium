import ja from '../../src/i18n/ja.json';
import en from '../../src/i18n/en.json';

// Recursively collect all leaf key paths from a nested object
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      keys.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('i18n key parity', () => {
  const jaKeys = collectKeys(ja).sort();
  const enKeys = collectKeys(en).sort();

  it('en has all keys that ja has', () => {
    const missingInEn = jaKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('ja has all keys that en has', () => {
    const missingInJa = enKeys.filter((k) => !jaKeys.includes(k));
    expect(missingInJa).toEqual([]);
  });
});

describe('i18n content', () => {
  it('ja has correct tab names', () => {
    expect((ja as unknown as Record<string, Record<string, string>>).tabs.discover).toBe('発見');
    expect((ja as unknown as Record<string, Record<string, string>>).tabs.herbarium).toBe('花図鉑');
  });

  it('en has English tab names', () => {
    expect((en as unknown as Record<string, Record<string, string>>).tabs.discover).toBe('Discover');
    expect((en as unknown as Record<string, Record<string, string>>).tabs.herbarium).toBe('Herbarium');
  });

  it('ja has rarity labels', () => {
    const rarity = (ja as unknown as Record<string, Record<string, string>>).rarity;
    expect(rarity['1']).toBe('★');
    expect(rarity['3']).toContain('限定');
  });

  it('ja has offline.banner key', () => {
    const offline = (ja as unknown as Record<string, Record<string, string>>).offline;
    expect(offline.banner).toBeTruthy();
  });

  it('ja has error.loadFailed key', () => {
    const error = (ja as unknown as Record<string, Record<string, string>>).error;
    expect(error.loadFailed).toBeTruthy();
  });

  it('en has offline.banner key', () => {
    const offline = (en as unknown as Record<string, Record<string, string>>).offline;
    expect(offline.banner).toBeTruthy();
  });
});
