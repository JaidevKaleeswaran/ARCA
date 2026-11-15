import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Market Data & Financial News Routes (/api/markets)', () => {
  it('GET /api/markets/rates returns authoritative macro rates & dynamic HYSA APY', async () => {
    const res = await request(app).get('/api/markets/rates');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rates');
    expect(res.body).toHaveProperty('raw');
    expect(res.body).toHaveProperty('asOf');

    const { raw } = res.body;
    expect(raw).toHaveProperty('dff');
    expect(raw).toHaveProperty('topHysa');
    expect(typeof raw.dff).toBe('number');
    expect(typeof raw.topHysa).toBe('number');
    // Rule: HYSA is dynamically anchored near DFF + 0.35%
    expect(raw.topHysa).toBeCloseTo(raw.dff + 0.35, 1);
  });

  it('GET /api/markets/catalog returns paginated stock catalog', async () => {
    const res = await request(app).get('/api/markets/catalog?limit=10&page=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stocks');
    expect(Array.isArray(res.body.stocks)).toBe(true);
    expect(res.body.stocks.length).toBeLessThanOrEqual(10);
    expect(res.body.page).toBe(1);

    if (res.body.stocks.length > 0) {
      const stock = res.body.stocks[0];
      expect(stock).toHaveProperty('symbol');
      expect(stock).toHaveProperty('price');
      expect(stock).toHaveProperty('sector');
      expect(typeof stock.price).toBe('number');
    }
  });

  it('GET /api/markets/quote/:symbol returns full quote data', async () => {
    const res = await request(app).get('/api/markets/quote/AAPL');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('symbol', 'AAPL');
    expect(res.body).toHaveProperty('price');
    expect(typeof res.body.price).toBe('number');
  });

  it('GET /api/markets/quote/SPY returns ETF net asset capitalization without N/A', async () => {
    const res = await request(app).get('/api/markets/quote/SPY');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('symbol', 'SPY');
    expect(res.body.marketCap).not.toBe('N/A');
    expect(res.body.marketCap).toMatch(/^\$[\d\.]+[BTM]/);
  });

  it('POST /api/markets/quotes returns batch quote dictionary', async () => {
    const res = await request(app)
      .post('/api/markets/quotes')
      .send({ symbols: ['AAPL', 'MSFT'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('quotes');
    expect(typeof res.body.quotes).toBe('object');
  });

  it('GET /api/markets/search returns sanitized domestic stock results', async () => {
    const res = await request(app).get('/api/markets/search?q=Apple');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);

    // Rule: Exclude foreign exchange extensions like .TO or .DE
    res.body.results.forEach((item) => {
      expect(item.symbol).not.toMatch(/\.(TO|DE|MX|NE|L|AX)$/);
    });
  });

  it('GET /api/markets/news returns authentic articles with publisher metadata', async () => {
    const res = await request(app).get('/api/markets/news?topic=general');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('articles');
    expect(Array.isArray(res.body.articles)).toBe(true);

    if (res.body.articles.length > 0) {
      const article = res.body.articles[0];
      expect(article).toHaveProperty('title');
      const publisher = article.source || article.publisher;
      expect(publisher).toBeTruthy();
      expect(typeof publisher).toBe('string');
      const link = article.link || article.url;
      expect(link).toBeTruthy();
      expect(typeof link).toBe('string');
    }
  });

  it('POST /api/markets/ai-summary generates macro budget implications', async () => {
    const res = await request(app)
      .post('/api/markets/ai-summary')
      .send({ topic: 'general' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(typeof res.body.summary).toBe('string');
    expect(res.body.summary.length).toBeGreaterThan(20);
  });
});
