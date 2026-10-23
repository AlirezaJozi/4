import request from 'supertest';
import { app } from '../src/app.js';

describe('HTTP contracts without external services', () => {
  test('admin state-changing requests require a session', async () => {
    const response = await request(app).patch('/api/v1/admin/clinic').send({ name: 'x' });
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false });
  });

  test('invalid JSON input uses validation contract', async () => {
    const response = await request(app).post('/api/v1/consultation-requests').send({ firstName: 'A' });
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false, errors: expect.any(Array) });
  });

  test('admin upload without session is rejected before file processing', async () => {
    const response = await request(app).post('/api/v1/admin/uploads/images');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
