import { http, HttpResponse } from 'msw';

export const identifyHandlers = [
  http.post('*/functions/v1/identify-plant', () =>
    HttpResponse.json({
      success: true,
      plant_id: 'plant-1',
      confidence: 0.95,
      name_ja: 'テスト植物1',
    })
  ),
];
