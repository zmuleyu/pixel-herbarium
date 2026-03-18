jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            border: '#e8e6e1', white: '#ffffff', blushPink: '#f5d5d0', plantPrimary: '#9fb69f' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { sm: 13, md: 15, lg: 18, xl: 22 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));
import React from 'react';
import SpotDetailSheet from '../../src/components/SpotDetailSheet';
import type { FlowerSpot } from '../../src/types/hanami';
import type { SpotCheckinResult } from '../../src/types/sakura';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '新宿御苑', nameEn: 'Shinjuku Gyoen',
  prefecture: '東京都', prefectureCode: 13, city: '新宿区', category: 'garden',
  bloomTypical: { earlyStart: '03-22', peakStart: '03-30', peakEnd: '04-08', lateEnd: '04-15' },
  latitude: 35.6852, longitude: 139.71, tags: ['名所100選'],
};
const checkin: SpotCheckinResult = {
  id: 'c1', user_id: 'u1', spot_id: 1,
  checked_in_at: '2026-03-30T10:00:00Z',
  is_mankai: true, stamp_variant: 'mankai', bloom_status_at_checkin: 'peak',
};

function shallowStr(el: any, depth = 5): string {
  if (el == null || typeof el !== 'object' || !el.type) return String(el ?? '');
  if (typeof el.type === 'function' && depth > 0) return shallowStr(el.type(el.props ?? {}), depth - 1);
  const c = el.props?.children;
  const cs = Array.isArray(c) ? c.map((x: any) => shallowStr(x, depth)).join('') : shallowStr(c, depth);
  return cs;
}

describe('SpotDetailSheet', () => {
  it('renders spot name when visible', () => {
    const html = JSON.stringify(React.createElement(SpotDetailSheet, { spot, checkin, visible: true, onClose: jest.fn(), onViewOnMap: jest.fn() }));
    expect(html).toContain('新宿御苑');
  });

  it('renders visit date key', () => {
    const html = JSON.stringify(React.createElement(SpotDetailSheet, { spot, checkin, visible: true, onClose: jest.fn(), onViewOnMap: jest.fn() }));
    expect(html).toContain('sakura.collection.visitDetail');
  });
});
