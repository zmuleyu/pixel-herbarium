import { http, HttpResponse } from 'msw';

export const authHandlers = [
  http.post('*/auth/v1/token', () =>
    HttpResponse.json({
      access_token: 'test-token',
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'e2e-test@pixelherbarium.dev',
        role: 'authenticated',
      },
    })
  ),
  http.post('*/auth/v1/logout', () => HttpResponse.json({})),
  http.get('*/auth/v1/user', () =>
    HttpResponse.json({
      id: 'test-user-id',
      email: 'e2e-test@pixelherbarium.dev',
      role: 'authenticated',
    })
  ),
];
