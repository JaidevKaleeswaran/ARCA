import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { createRateLimiter } from '../middleware/security.js';
import { sanitizeError } from '../utils/sanitize.js';

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
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 227.48, change: 1.85, changePercent: 0.82, volume: '48.2M', pe: 34.2 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 422.50, change: 3.10, changePercent: 0.74, volume: '21.5M', pe: 35.8 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 147.60, change: 4.25, changePercent: 2.96, volume: '95.1M', pe: 58.4 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 181.30, change: -0.90, changePercent: -0.49, volume: '23.8M', pe: 24.1 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 208.20, change: 2.45, changePercent: 1.19, volume: '38.4M', pe: 43.6 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 321.22, change: 12.80, changePercent: 4.15, volume: '88.7M', pe: 89.2 },
    ],
    rates: [
      { id: 'fed-funds', name: 'Fed Funds Target Rate', rate: 4.75, change: -0.25, type: 'Central Bank', description: 'Federal Reserve benchmark lending rate' },
      { id: 'mortgage-30', name: '30-Yr Fixed Mortgage', rate: 6.78, change: 0.04, type: 'Consumer Lending', description: 'National average for conforming 30-year mortgages' },
      { id: 'mortgage-15', name: '15-Yr Fixed Mortgage', rate: 5.99, change: -0.02, type: 'Consumer Lending', description: 'National average for 15-year fixed home loans' },
      { id: 'treasury-10', name: '10-Year US Treasury Yield', rate: 4.31, change: 0.03, type: 'Sovereign Debt', description: 'Benchmark yield for long-term borrowing costs' },
      { id: 'treasury-2', name: '2-Year US Treasury Yield', rate: 4.25, change: -0.01, type: 'Sovereign Debt', description: 'Leading indicator for near-term Fed policy expectations' },
      { id: 'hysa-avg', name: 'High-Yield Savings APY', rate: 4.60, change: 0.00, type: 'Deposits', description: 'Top competitive online savings accounts return' },
    ],
    economicIndicators: [
      { name: 'CPI Inflation (YoY)', value: '2.6%', trend: 'cooling', period: 'Latest Release', impact: 'Moderate' },
      { name: 'Core PCE Price Index', value: '2.7%', trend: 'neutral', period: 'Monthly Report', impact: 'High (Fed target 2.0%)' },
      { name: 'US Unemployment Rate', value: '4.1%', trend: 'stable', period: 'Bureau of Labor Statistics', impact: 'Healthy labor market' },
      { name: 'Real GDP Growth (QoQ)', value: '2.8%', trend: 'strong', period: 'Bureau of Economic Analysis', impact: 'Resilient economic expansion' },
    ],
    commoditiesAndCrypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 79240.00, change: 2850.00, changePercent: 3.73, category: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', price: 3180.50, change: 112.30, changePercent: 3.66, category: 'crypto' },
      { symbol: 'GOLD', name: 'Gold (Oz)', price: 2684.20, change: -8.40, changePercent: -0.31, category: 'commodity' },
      { symbol: 'OIL', name: 'Crude Oil (WTI)', price: 70.35, change: 0.45, changePercent: 0.64, category: 'commodity' },
    ],
    newsDigest: [
      {
        id: 'news-1',
        title: 'Federal Reserve Signals Measured Pace for Rate Cuts as Labor Market Holds Firm',
        source: 'Financial Intelligence Feed',
        time: '2 hours ago',
        category: 'Monetary Policy',
        summary: 'Fed officials emphasized a data-dependent, gradual approach to further rate cuts following their recent 25 basis point reduction, keeping borrowing costs moderately restrictive.',
        budgetImpact: 'High-yield savings accounts remain attractive at ~4.5% APY, while mortgage and auto loan rates are expected to decline slowly rather than rapidly.',
      },
      {
        id: 'news-2',
        title: 'Consumer Price Index Reflects Easing Shelter Costs and Stable Energy Prices',
        source: 'Bureau of Labor Statistics / Economic Analysis',
        time: '4 hours ago',
        category: 'Inflation & Costs',
        summary: 'Headline inflation registered at 2.6% year-over-year, supported by moderation in rental inflation and energy prices, though services inflation remains sticky.',
        budgetImpact: 'Grocery and everyday utility pressures are stabilizing; households can keep inflation adjustments to food envelopes around 2.5–3.0%.',
      },
      {
        id: 'news-3',
        title: 'Treasury Yields Stabilize Around 4.30% Following Treasury Refunding Announcements',
        source: 'Bond Market Digest',
        time: '6 hours ago',
        category: 'Fixed Income',
        summary: 'The 10-year Treasury yield hovered near 4.31% as investors balanced resilient economic growth expectations against federal deficit supply projections.',
        budgetImpact: 'Fixed-income yields remain historically attractive for conservative cash buffers and short-term certificate of deposit ladders.',
      },
      {
        id: 'news-4',
        title: 'Tech Earnings Show Sustained Cloud and AI Capital Expenditure Growth',
        source: 'Equity Research Review',
        time: '8 hours ago',
        category: 'Stock Markets',
        summary: 'Major technology enterprises reported steady revenue gains with heightened capital spending in computing infrastructure, supporting broad equity index gains.',
        budgetImpact: 'Long-term retirement allocations (401k/IRA envelopes) benefit from broad index resilience, reinforcing steady dollar-cost averaging.',
      },
    ],
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
 * Returns unified market metrics, rates, economic data, and news digest
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
