import { http, HttpResponse } from 'msw';

export const quotaHandlers = [
  http.get('*/rest/v1/daily_quota*', () =>
    HttpResponse.json([{ date: '2026-03-18', count: 0, limit: 10 }])
  ),
];
