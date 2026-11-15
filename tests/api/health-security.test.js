import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Backend Health & Security Middleware', () => {
  it('GET /api/health should return 200 OK with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /health should return 200 OK as a root fallback', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('Blocks sensitive file access to .env (403 Forbidden)', async () => {
    const res = await request(app).get('/.env');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toMatch(/denied/i);
  });

  it('Blocks sensitive file access to .git directories (403 Forbidden)', async () => {
    const res = await request(app).get('/.git/config');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toMatch(/denied/i);
  });

  it('Blocks path traversal attempts trying to probe package.json (403 Forbidden)', async () => {
    const res = await request(app).get('/api/../package.json');
    expect(res.status).toBe(403);
  });

  it('Properly responds to CORS preflight requests', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
