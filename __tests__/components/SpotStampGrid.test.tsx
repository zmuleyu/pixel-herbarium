jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            border: '#e8e6e1', white: '#ffffff', blushPink: '#f5d5d0', plantPrimary: '#9fb69f' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { xs: 11, sm: 13, md: 15 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));
import React from 'react';
import SpotStampGrid from '../../src/components/SpotStampGrid';
import type { FlowerSpot } from '../../src/types/hanami';
import type { SpotCheckinResult } from '../../src/types/sakura';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
  prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
  bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
  latitude: 35.7141, longitude: 139.7734, tags: ['名所100選'],
};
const checkin: SpotCheckinResult = {
  id: 'c1', user_id: 'u1', spot_id: 1,
  checked_in_at: '2026-03-28T10:00:00Z',
  is_mankai: false, stamp_variant: 'normal', bloom_status_at_checkin: null,
};

describe('SpotStampGrid', () => {
  it('renders without crashing with empty spots', () => {
    expect(() => React.createElement(SpotStampGrid, {
      spots: [], checkins: [], onSpotPress: jest.fn()
    })).not.toThrow();
  });

  it('renders progress text key', () => {
    const html = JSON.stringify(React.createElement(SpotStampGrid, {
      spots: [spot], checkins: [checkin], onSpotPress: jest.fn()
    }));
    expect(html).toContain('sakura.collection.progress');
  });
});
