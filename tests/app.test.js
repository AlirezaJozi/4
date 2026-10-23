import request from 'supertest';
import { app } from '../src/app.js';

describe('API safety contract', () => {
  test('unknown route uses standard error response', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false });
  });
  test('admin route rejects missing session', async () => {
    const response = await request(app).get('/api/v1/admin/auth/me');
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false });
  });
});
