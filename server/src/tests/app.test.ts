import request from 'supertest';
import app from '../app';

// Testing for health, 404, and error handler routes

describe('App Integration Tests', () => {

  it('should return 200 and OK for /health route', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'OK',
      environment: process.env.NODE_ENV || 'development',
    });
    expect(res.body.timestamp).toBeDefined();
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('should trigger global error handler on thrown error', async () => {
    // Temporarily add a route that throws an error
    app.get('/error-test', (_req, _res) => {
      throw new Error('Test Error');
    });

    const res = await request(app).get('/error-test');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal Server Error');
  });

});
