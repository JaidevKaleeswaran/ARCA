import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('AI Assistant Routes (/api/assistant)', () => {
  it('POST /api/assistant/chat rejects requests missing "question" parameter (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .send({ snapshot: {} });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/question/i);
  });

  it('POST /api/assistant/chat rejects questions that exceed maximum character length (400 Bad Request)', async () => {
    const longQuestion = 'A'.repeat(2500);
    const res = await request(app)
      .post('/api/assistant/chat')
      .send({ question: longQuestion });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Question too long');
  });

  it('POST /api/assistant/categorize rejects requests missing "description" parameter (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/assistant/categorize')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/description/i);
  });

  it('POST /api/assistant/categorize categorizes known transactions (e.g. Trader Joe)', async () => {
    const res = await request(app)
      .post('/api/assistant/categorize')
      .send({
        description: "Trader Joe's",
        amount: 85.50,
        categories: [
          { id: '1', name: 'Bills' },
          { id: '2', name: 'Groceries' },
          { id: '3', name: 'Entertainment' },
        ],
      });
    expect([200, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('category');
      expect(typeof res.body.category).toBe('string');
      expect(res.body.category.toLowerCase()).toMatch(/groceries|food/);
    }
  });

  it('POST /api/assistant/review rejects requests without a transaction parameter (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/assistant/review')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Missing transaction/i);
  });

  it('POST /api/assistant/review returns review analysis for a transaction', async () => {
    const res = await request(app)
      .post('/api/assistant/review')
      .send({
        transaction: {
          id: 'tx-test',
          description: 'Luxury Watch Boutique',
          amount: 2500,
          category: 'Shopping',
          date: '2026-11-10',
        },
        currentSpending: 300,
        monthlyBudget: 500,
      });
    expect([200, 429, 502]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('verdict');
      expect(res.body).toHaveProperty('isSuspicious');
      expect(typeof res.body.verdict).toBe('string');
    }
  });
});
