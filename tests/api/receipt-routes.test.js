import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import * as aiClients from '../../server/config/aiClients.js';
import app from '../../server/index.js';

describe('Receipt Scanner Routes (/api/receipts)', () => {
  const sampleImagePath = path.resolve('tests/e2e/fixtures/sample-receipt.png');

  it('POST /api/receipts/scan rejects requests with no file attached (400 Bad Request)', async () => {
    const res = await request(app).post('/api/receipts/scan');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/No file uploaded/i);
  });

  it('POST /api/receipts/scan rejects unsupported MIME types like text files (415 Unsupported Media Type)', async () => {
    const res = await request(app)
      .post('/api/receipts/scan')
      .attach('receipt', Buffer.from('not an image'), 'test.txt');
    expect(res.status).toBe(415);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/Unsupported file type/i);
  });

  it('POST /api/receipts/scan accepts valid image/png, extracts data, and enforces receipt schema', async () => {
    expect(fs.existsSync(sampleImagePath)).toBe(true);

    vi.spyOn(aiClients, 'callWithModelCascade').mockResolvedValueOnce({
      text: JSON.stringify({
        merchant: 'Whole Foods Market',
        date: '2026-11-12',
        total: 42.50,
        subtotal: 40.00,
        tax: 2.50,
        line_items: [{ name: 'Organic Honeycrisp Apples', price: 5.00, quantity: 1 }],
        suggested_category: 'Groceries',
      }),
    });

    const res = await request(app)
      .post('/api/receipts/scan')
      .attach('receipt', sampleImagePath);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('merchant', 'Whole Foods Market');
    expect(res.body.data).toHaveProperty('total', 42.50);
    expect(res.body.data).toHaveProperty('suggested_category', 'Groceries');
    expect(res.body).toHaveProperty('receipt_image_url');
  });
});
