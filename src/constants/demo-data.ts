import type { CheckinRecord } from '@/types/hanami';

// Mock date: April 3, 2026 — peak sakura bloom period
// All spots with peakStart "03-29" to peakEnd "04-07" will show 満開
export const SCREENSHOT_DATE = new Date('2026-04-03T10:00:00+09:00');

// Mock checkin records to populate footprint tab and home recent section
export const DEMO_CHECKIN_RECORDS: CheckinRecord[] = [
  {
    id: 'demo-1',
    seasonId: 'sakura',
    spotId: 1, // Ueno Park
    photoUri: '', // Empty — footprint card will show placeholder
    composedUri: '',
    templateId: 'pixel',
    timestamp: '2026-04-01T10:30:00+09:00',
    synced: false,
    stampStyle: 'pixel',
    stampPosition: 'bottom-right',
  },
  {
    id: 'demo-2',
    seasonId: 'sakura',
    spotId: 3, // Shinjuku Gyoen
    photoUri: '',
    composedUri: '',
    templateId: 'seal',
    timestamp: '2026-04-02T14:15:00+09:00',
    synced: false,
    stampStyle: 'seal',
    stampPosition: 'top-left',
  },
  {
    id: 'demo-3',
    seasonId: 'sakura',
    spotId: 4, // Meguro River
    photoUri: '',
    composedUri: '',
    templateId: 'minimal',
    timestamp: '2026-04-03T09:00:00+09:00',
    synced: false,
    stampStyle: 'minimal',
    stampPosition: 'bottom-center',
  },
];
