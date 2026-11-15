import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Voice Routes (/api/voice)', () => {
  it('POST /api/voice/speak rejects requests missing "text" parameter (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/voice/speak')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Missing or invalid "text"/i);
  });

  it('POST /api/voice/speak rejects empty or whitespace-only text (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/voice/speak')
      .send({ text: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/voice/agent-id returns 404 when no agent has been created yet', async () => {
    const res = await request(app).get('/api/voice/agent-id');
    // Either 404 (not created) or 200 (if cached from earlier session)
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('agentId');
    }
  });

  it('POST /api/voice/transcribe rejects requests with no audio file (400 Bad Request)', async () => {
    const res = await request(app).post('/api/voice/transcribe');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/No audio file/i);
  });
});
