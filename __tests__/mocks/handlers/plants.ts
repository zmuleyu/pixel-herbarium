import { http, HttpResponse } from 'msw';

const mockPlants = Array.from({ length: 5 }, (_, i) => ({
  id: `plant-${i + 1}`,
  name_ja: `テスト植物${i + 1}`,
  name_latin: `Testus plantus ${i + 1}`,
  rarity: ((i % 3) + 1) as 1 | 2 | 3,
  hanakotoba: 'テスト花言葉',
  bloom_months: [3, 4, 5],
  is_seasonal: false,
  pixel_sprite_url: null,
}));

export const plantsHandlers = [
  http.get('*/rest/v1/plants*', () =>
    HttpResponse.json(mockPlants)
  ),
  http.get('*/rest/v1/user_plants*', () =>
    HttpResponse.json([{ plant_id: 'plant-1', collected_at: '2026-01-01T00:00:00Z' }])
  ),
];
