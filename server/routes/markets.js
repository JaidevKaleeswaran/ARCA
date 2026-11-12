import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createRateLimiter } from '../middleware/security.js';
import { sanitizeError } from '../utils/sanitize.js';
import { STOCK_CATALOG, REAL_ARTICLES } from '../../src/data/marketData.js';

export { STOCK_CATALOG, REAL_ARTICLES };

const router = express.Router();

const marketsLimiter = createRateLimiter({
  windowMs: 60000,
  max: 60,
  message: 'Too many market data requests. Please wait a moment.',
});

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY
    || process.env.ASSISTANT_API_KEY
    || process.env.MANAGER_API_KEY;

  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// ── In-memory cache for market overview data ──
let cachedOverview = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

// ── Helper to determine market session ──
function getMarketStatus() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcDay = now.getUTCDay(); // 0 = Sun, 6 = Sat

  // US Markets: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC) Mon-Fri
  const isWeekend = utcDay === 0 || utcDay === 6;
  const isOpenHours = (utcHours > 14 || (utcHours === 14 && now.getUTCMinutes() >= 30)) && utcHours < 21;
  const isOpen = !isWeekend && isOpenHours;

  return {
    isOpen,
    statusText: isOpen ? 'Regular Trading Session' : isWeekend ? 'Weekend - Markets Closed' : 'After-Hours / Closed',
    asOf: now.toISOString(),
  };
}

// ── Baseline Market Data ──
function generateMarketData() {
  const status = getMarketStatus();

  return {
    marketStatus: status,
    indices: [
      { symbol: 'SPX', name: 'S&P 500', price: 5983.25, change: 32.40, changePercent: 0.54, category: 'index' },
      { symbol: 'IXIC', name: 'Nasdaq Composite', price: 19281.40, change: 142.15, changePercent: 0.74, category: 'index' },
      { symbol: 'DJI', name: 'Dow Jones Industrial', price: 43910.80, change: -45.20, changePercent: -0.10, category: 'index' },
      { symbol: 'RUT', name: 'Russell 2000', price: 2398.60, change: 18.90, changePercent: 0.79, category: 'index' },
    ],
    // Top featured equities for quick overview
    stocks: STOCK_CATALOG.slice(0, 12),
    rates: [
      { id: 'fed-funds', name: 'Fed Funds Target Rate', rate: 4.75, change: -0.25, type: 'Central Bank', description: 'Federal Reserve benchmark rate influencing all borrowing costs.' },
      { id: 'mortgage-30', name: '30-Yr Fixed Mortgage', rate: 6.78, change: 0.04, type: 'Consumer Lending', description: 'National average for standard conforming home loans.' },
      { id: 'mortgage-15', name: '15-Yr Fixed Mortgage', rate: 5.99, change: -0.02, type: 'Consumer Lending', description: 'Lower interest option for aggressive home equity building.' },
      { id: 'treasury-10', name: '10-Year US Treasury Yield', rate: 4.31, change: 0.03, type: 'Sovereign Debt', description: 'The global benchmark for long-term bond yields and mortgages.' },
      { id: 'treasury-2', name: '2-Year US Treasury Yield', rate: 4.25, change: -0.01, type: 'Sovereign Debt', description: 'Leading indicator for near-term Fed policy expectations.' },
      { id: 'hysa-avg', name: 'High-Yield Savings APY', rate: 4.60, change: 0.00, type: 'Cash Reserves', description: 'Top competitive online savings accounts return.' },
    ],
    economicIndicators: [
      { name: 'CPI Inflation (YoY)', value: '2.6%', trend: 'cooling', period: 'Latest Release', impact: 'Moderate headline price growth' },
      { name: 'Core PCE Price Index', value: '2.7%', trend: 'neutral', period: 'Fed Preferred Gauge', impact: 'Fed 2.0% target in focus' },
      { name: 'US Unemployment Rate', value: '4.1%', trend: 'stable', period: 'Bureau of Labor Statistics', impact: 'Historically healthy employment' },
      { name: 'Real GDP Growth (QoQ)', value: '2.8%', trend: 'strong', period: 'Bureau of Economic Analysis', impact: 'Sustained domestic economic activity' },
    ],
    commoditiesAndCrypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 79240.00, change: 2850.00, changePercent: 3.73, category: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', price: 3180.50, change: 112.30, changePercent: 3.66, category: 'crypto' },
      { symbol: 'GOLD', name: 'Gold (Oz)', price: 2684.20, change: -8.40, changePercent: -0.31, category: 'commodity' },
      { symbol: 'OIL', name: 'Crude Oil (WTI)', price: 70.35, change: 0.45, changePercent: 0.64, category: 'commodity' },
    ],
    newsDigest: REAL_ARTICLES,
    budgetAdviceHighlights: [
      {
        title: 'Optimize Liquid Cash in HYSA',
        description: 'With Fed rates near 4.75%, top high-yield savings accounts continue to pay over 4.5% APY. Ensure your Emergency Fund envelope is not sitting in zero-interest checking.',
        tag: 'Savings Strategy',
      },
      {
        title: 'Credit Card & Debt Strategy',
        description: 'Average credit card APRs remain above 21%. Allocate unassigned budget dollars aggressively toward high-interest balances before funding discretionary envelopes.',
        tag: 'Debt Payoff',
      },
      {
        title: 'Planning Big Purchases',
        description: 'Auto loan and personal loan financing rates remain elevated. If planning a vehicle or home purchase, aim for a larger down payment envelope to minimize lifetime interest.',
        tag: 'Purchase Budgeting',
      },
    ],
  };
}

/**
 * GET /api/markets/overview
 * Returns unified market metrics, rates, economic data, and real articles
 */
router.get('/overview', marketsLimiter, (req, res) => {
  const now = Date.now();
  if (cachedOverview && (now - lastFetchTime) < CACHE_TTL_MS) {
    return res.json(cachedOverview);
  }

  const data = generateMarketData();
  cachedOverview = data;
  lastFetchTime = now;
  return res.json(data);
});

/**
 * GET /api/markets/catalog
 * Returns the full searchable 100+ stock and ETF universe with optional sector filter
 */
router.get('/catalog', marketsLimiter, (req, res) => {
  const { sector = 'all', limit = 100, page = 1 } = req.query;

  let filtered = STOCK_CATALOG;
  if (sector && sector.toLowerCase() !== 'all') {
    filtered = filtered.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
  const startIdx = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  return res.json({
    total: filtered.length,
    page: pageNum,
    pageSize,
    sector,
    stocks: paginated,
  });
});

/**
 * GET /api/markets/search
 * Fast typeahead search across stock symbols and company names
 */
router.get('/search', marketsLimiter, (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json({ results: STOCK_CATALOG.slice(0, 15) });
  }

  const matches = STOCK_CATALOG.filter(stock => {
    return (
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    );
  });

  // Sort exact symbol starts first
  matches.sort((a, b) => {
    const aSym = a.symbol.toLowerCase();
    const bSym = b.symbol.toLowerCase();
    if (aSym === query) return -1;
    if (bSym === query) return 1;
    if (aSym.startsWith(query) && !bSym.startsWith(query)) return -1;
    if (!aSym.startsWith(query) && bSym.startsWith(query)) return 1;
    return 0;
  });

  return res.json({ results: matches.slice(0, 20) });
});

/**
 * GET /api/markets/news
 * Returns curated real financial journalism articles
 */
router.get('/news', marketsLimiter, (req, res) => {
  return res.json({
    articles: REAL_ARTICLES,
    total: REAL_ARTICLES.length,
  });
});

/**
 * POST /api/markets/ai-summary
 * Generates an up-to-date AI economic briefing using Gemini
 */
router.post('/ai-summary', marketsLimiter, async (req, res) => {
  const { topic = 'general' } = req.body;
  const startTime = Date.now();

  try {
    const ai = getAI();
    if (!ai) {
      return res.json({
        summary: 'Economic conditions are characterized by resilient US GDP growth, moderating headline inflation near 2.6%, and a benchmark Fed funds rate at 4.75%. For everyday personal budgeting, this environment favors keeping cash reserves in competitive high-yield accounts while avoiding carrying variable high-interest debt.',
        keyTakeaways: [
          'Cash buffers: High-yield savings accounts offer ~4.5% risk-free returns.',
          'Borrowing costs: Mortgage and auto loan rates are declining gradually.',
          'Inflation: Food and goods price increases have normalized compared to 2022-2023 peaks.',
        ],
        model: 'baseline-digest',
        latencyMs: Date.now() - startTime,
      });
    }

    const prompt = `You are a chief economic strategist and financial analyst embedded in the ARCA personal finance app.
Generate a concise, insightful 3-paragraph economic digest for consumers and budgeters.
Cover:
1. Current state of interest rates, the Fed policy outlook, and what it means for borrowing & savings.
2. Stock market momentum, inflation trends, and employment conditions.
3. Actionable personal finance takeaways for individuals managing monthly household budgets.

Topic focus: ${topic}.
Tone: Authoritative, clear, accessible, and grounded in real financial principles.
Format: Return clean plain text paragraphs with no markdown bolding in titles. Include 3 bullet points at the end under "KEY BUDGET TAKEAWAYS:".`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const summaryText = response.text?.trim() || '';

    return res.json({
      summary: summaryText,
      model: 'gemini-2.5-flash',
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.warn('AI market summary error:', err.message);
    return res.json({
      summary: 'Markets continue to balance resilient macroeconomic growth against monetary policy normalization. Interest rates remain relatively elevated, rewarding savers while placing a premium on debt elimination and disciplined envelope budgeting.',
      keyTakeaways: [
        'Maintain emergency reserves in high-yield vehicles.',
        'Prioritize paying down any variable credit card balances.',
        'Stick to dollar-cost averaging in long-term investment envelopes.',
      ],
      model: 'fallback',
      latencyMs: Date.now() - startTime,
    });
  }
});

export default router;
