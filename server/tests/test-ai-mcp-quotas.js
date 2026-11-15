import assert from 'assert';
import {
  getMondayOfCurrentWeekISO,
  getNextMondayISO,
  getNextMondayCountdown,
  normalizeQuotaState,
  checkAndIncrementQuota,
  QUOTA_LIMITS,
} from '../../src/utils/quotaManager.js';
import {
  callWithModelCascade,
  isRateLimitError,
  INTERACTIVE_MODELS,
  CATEGORIZATION_MODELS,
} from '../config/aiClients.js';
import { executeTool, getGeminiTools, getOllamaTools, MAX_TOOL_ITERATIONS } from '../mcp/mcpRegistry.js';
import { calculateBudgetMetrics } from '../mcp/tools/budgetCalculator.js';
import { normalizeTicker, getStockQuote } from '../mcp/tools/stockQuote.js';
import { getInterestRates } from '../mcp/tools/interestRates.js';
import { searchFinancialNews } from '../mcp/tools/financialNews.js';
import { searchWeb } from '../mcp/tools/webSearch.js';
import { isOllamaQwenAvailable } from '../routes/assistant.js';

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

async function runSuite() {
  console.log('\n--- Running AI Assistant, Quotas, Local Qwen & MCP Tools Test Suite ---\n');

  // ── Test Group 1: Deterministic Quotas & Monday UTC Anchoring ─────────────────
  console.log('Group 1: Deterministic Quotas & Monday Reset');

  it('Calculates deterministic current Monday 00:00:00 UTC', () => {
    const currentMondayISO = getMondayOfCurrentWeekISO();
    const date = new Date(currentMondayISO);
    assert.strictEqual(date.getUTCDay(), 1, 'Day must be Monday (1)');
    assert.strictEqual(date.getUTCHours(), 0, 'Hours must be 00');
    assert.strictEqual(date.getUTCMinutes(), 0, 'Minutes must be 00');
    assert.strictEqual(date.getUTCSeconds(), 0, 'Seconds must be 00');
    assert.strictEqual(date.getUTCMilliseconds(), 0, 'Milliseconds must be 000');
  });

  it('Calculates upcoming next Monday 00:00:00 UTC and countdown format', () => {
    const nextMondayISO = getNextMondayISO();
    const currentMondayISO = getMondayOfCurrentWeekISO();
    assert(new Date(nextMondayISO) > new Date(currentMondayISO), 'Next Monday must be after current Monday');
    
    const countdown = getNextMondayCountdown();
    assert(typeof countdown === 'string', 'Countdown must be string');
    assert(countdown.startsWith('in '), `Countdown "${countdown}" should start with "in "`);
  });

  it('Normalizes quota state and resets stale week counts to 0', () => {
    const staleState = {
      weekStartDate: '2020-01-06T00:00:00.000Z',
      receiptsUsed: 18,
      voiceUsed: 25,
      assistantUsed: 35,
    };
    const normalized = normalizeQuotaState(staleState);
    assert.strictEqual(normalized.receiptsUsed, 0, 'Stale receipts counter must reset to 0');
    assert.strictEqual(normalized.voiceUsed, 0, 'Stale voice counter must reset to 0');
    assert.strictEqual(normalized.assistantUsed, 0, 'Stale assistant counter must reset to 0');
    assert.strictEqual(normalized.weekStartDate, getMondayOfCurrentWeekISO(), 'weekStartDate must update to current Monday');
  });

  await itAsync('checkAndIncrementQuota blocks when limit reached without incrementing', async () => {
    const atLimitState = {
      weekStartDate: getMondayOfCurrentWeekISO(),
      receiptsUsed: QUOTA_LIMITS.receipts, // 18
      voiceUsed: 0,
      assistantUsed: 0,
    };

    const res = await checkAndIncrementQuota('test_user', 'receipts', atLimitState, { skipIncrement: true });
    assert.strictEqual(res.allowed, false, 'Must not be allowed when receiptsUsed >= 18');
    assert.strictEqual(res.reason, 'QUOTA_EXHAUSTED', 'Reason must be QUOTA_EXHAUSTED');
    assert.strictEqual(res.limit, 18, 'Limit must match QUOTA_LIMITS.receipts');
    assert.strictEqual(res.used, 18, 'Used count must remain 18');
  });

  await itAsync('checkAndIncrementQuota allows execution when below limit', async () => {
    const belowLimitState = {
      weekStartDate: getMondayOfCurrentWeekISO(),
      receiptsUsed: 5,
      voiceUsed: 10,
      assistantUsed: 20,
    };

    const res = await checkAndIncrementQuota('usr_arca_guest', 'assistant', belowLimitState, { skipIncrement: true });
    assert.strictEqual(res.allowed, true, 'Must allow when below limit');
    assert.strictEqual(res.used, 20);
  });

  await itAsync('checkAndIncrementQuota resets stale week usage count to 1 on new week', async () => {
    const staleState = {
      weekStartDate: '2020-01-06T00:00:00.000Z',
      receiptsUsed: 18,
      voiceUsed: 25,
      assistantUsed: 35,
    };
    const res = await checkAndIncrementQuota('usr_arca_guest', 'receipts', staleState);
    assert.strictEqual(res.allowed, true, 'Must allow when entering a new week');
    assert.strictEqual(res.used, 1, 'Used count in new week must start at 1, not 19');
  });

  it('Normalizing quota state in state reducer resets other features on new week', () => {
    const staleState = {
      weekStartDate: '2020-01-06T00:00:00.000Z',
      receiptsUsed: 18,
      voiceUsed: 25,
      assistantUsed: 35,
    };
    const currentQuota = normalizeQuotaState(staleState);
    const updated = {
      ...currentQuota,
      receiptsUsed: 1,
      weekStartDate: getMondayOfCurrentWeekISO(),
    };
    assert.strictEqual(updated.receiptsUsed, 1);
    assert.strictEqual(updated.voiceUsed, 0, 'voiceUsed must be 0 in new week');
    assert.strictEqual(updated.assistantUsed, 0, 'assistantUsed must be 0 in new week');
  });

  // ── Test Group 2: Model Cascade & Rate Limit Normalization ────────────────────
  console.log('\nGroup 2: Model Cascade & Upstream Rate Limit Normalization');

  it('Identifies rate limit and resource exhaustion errors', () => {
    assert.strictEqual(isRateLimitError({ status: 429 }), true);
    assert.strictEqual(isRateLimitError(new Error('RESOURCE_EXHAUSTED: quota exceeded')), true);
    assert.strictEqual(isRateLimitError(new Error('429 Too Many Requests')), true);
    assert.strictEqual(isRateLimitError(new Error('Invalid argument')), false);
  });

  await itAsync('callWithModelCascade cascades through models and normalizes 429 errors', async () => {
    const attemptedModels = [];
    const mockClient = {
      models: {
        generateContent: async ({ model }) => {
          attemptedModels.push(model);
          const err = new Error(`Resource exhausted on model ${model}`);
          err.status = 429;
          throw err;
        },
      },
    };

    try {
      await callWithModelCascade(mockClient, 'chat', { contents: [{ text: 'Hello' }] });
      assert.fail('Should have thrown an error');
    } catch (err) {
      assert.strictEqual(err.status, 429, 'Normalized error status must be 429');
      assert.strictEqual(err.code, 'UPSTREAM_RATE_LIMIT');
      assert.deepStrictEqual(attemptedModels, INTERACTIVE_MODELS, 'Must try all interactive models');
      assert.strictEqual(err.payload.error, 'UPSTREAM_RATE_LIMIT');
      assert.strictEqual(err.payload.message, 'High demand: upgrade to Stacked Pro for priority dedicated bandwidth.');
      assert(err.payload.resetDate, 'Must include resetDate');
    }
  });

  await itAsync('callWithModelCascade restricts categorization strictly to gemini-2.0-flash-lite', async () => {
    const attemptedModels = [];
    const mockClient = {
      models: {
        generateContent: async ({ model }) => {
          attemptedModels.push(model);
          return { text: 'Dining' };
        },
      },
    };

    const res = await callWithModelCascade(mockClient, 'categorization', { contents: [{ text: 'Lunch' }] });
    assert.deepStrictEqual(attemptedModels, CATEGORIZATION_MODELS, 'Categorization must use only CATEGORIZATION_MODELS');
    assert.strictEqual(res.text, 'Dining');
  });

  // ── Test Group 3: Local Qwen 3.5 Auto-Detection ──────────────────────────────
  console.log('\nGroup 3: Local Qwen Integration & Vercel Safeguard');

  await itAsync('isOllamaQwenAvailable returns false immediately in Vercel environment with 0ms probe', async () => {
    const originalVercel = process.env.VERCEL;
    process.env.VERCEL = '1';

    // Warm-up call
    await isOllamaQwenAvailable();

    const start = process.hrtime.bigint();
    const available = await isOllamaQwenAvailable();
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    assert.strictEqual(available, false, 'Must be false when VERCEL=1');
    assert(durationMs < 2, `Probe overhead should be <2ms in Vercel mode, was ${durationMs.toFixed(3)}ms`);

    if (originalVercel !== undefined) {
      process.env.VERCEL = originalVercel;
    } else {
      delete process.env.VERCEL;
    }
  });

  // ── Test Group 4: In-Process MCP Tool Engine ──────────────────────────────────
  console.log('\nGroup 4: In-Process MCP Tool Engine');

  it('getGeminiTools and getOllamaTools export valid schemas', () => {
    const gemini = getGeminiTools();
    assert(Array.isArray(gemini) && gemini[0].functionDeclarations, 'Gemini tools must have functionDeclarations');
    assert.strictEqual(gemini[0].functionDeclarations.length, 5, 'Must export 5 tools');
    assert(gemini[0].functionDeclarations[0].parameters || gemini[0].functionDeclarations[0].parametersJsonSchema, 'Must have parameters schema for OpenAPI compatibility');

    const ollama = getOllamaTools();
    assert(Array.isArray(ollama), 'Ollama tools must be an array');
    assert.strictEqual(ollama.length, 5, 'Must export 5 Ollama tools');
    assert.strictEqual(ollama[0].type, 'function');
    assert(ollama[0].function.name, 'Must have function name');
  });

  await itAsync('calculate_budget_metrics performs deterministic calculations over transactions', async () => {
    const mockContext = {
      totalIncome: 5000,
      transactions: [
        { id: '1', description: 'Groceries Store', amount: 120.50, category: 'Groceries', date: '2026-11-10' },
        { id: '2', description: 'Dinner Out', amount: 80.00, category: 'Dining', date: '2026-11-11' },
        { id: '3', description: 'Supermarket', amount: 95.50, category: 'Groceries', date: '2026-11-12' },
        { id: '4', description: 'Electric Bill', amount: 150.00, category: 'Bills', date: '2026-11-13' },
      ],
    };

    const sumRes = await calculateBudgetMetrics({ metric: 'sum' }, mockContext);
    assert.strictEqual(sumRes.totalSpent, 446);
    assert.strictEqual(sumRes.transactionCount, 4);

    const catRes = await calculateBudgetMetrics({ category: 'Groceries', metric: 'sum' }, mockContext);
    assert.strictEqual(catRes.totalSpent, 216);
    assert.strictEqual(catRes.transactionCount, 2);

    const netRes = await calculateBudgetMetrics({ metric: 'net_cashflow' }, mockContext);
    assert.strictEqual(netRes.totalIncome, 5000);
    assert.strictEqual(netRes.totalSpent, 446);
    assert.strictEqual(netRes.netCashflow, 4554);

    const maxRes = await calculateBudgetMetrics({ metric: 'largest_expense' }, mockContext);
    assert.strictEqual(maxRes.largestExpense.amount, 150);
    assert.strictEqual(maxRes.largestExpense.description, 'Electric Bill');
  });

  it('normalizeTicker properly normalizes bare crypto tickers and dual share classes', () => {
    assert.strictEqual(normalizeTicker('BTC'), 'BTC-USD');
    assert.strictEqual(normalizeTicker('eth'), 'ETH-USD');
    assert.strictEqual(normalizeTicker('SOL'), 'SOL-USD');
    assert.strictEqual(normalizeTicker('brk.b'), 'BRK-B');
    assert.strictEqual(normalizeTicker('NVDA'), 'NVDA');
  });

  await itAsync('search_financial_news strictly complies with market-data-and-news-ux.md', async () => {
    const news = await searchFinancialNews({ topic: 'inflation', limit: 5 });
    assert(news.articles.length > 0, 'Must return verified articles');

    const allowedDomains = ['bloomberg.com', 'reuters.com', 'wsj.com', 'cnbc.com', 'ft.com', 'barrons.com', 'marketwatch.com'];

    for (const article of news.articles) {
      assert(article.headline, 'Article must have non-empty headline');
      assert(article.publisher, 'Article must have publisher name');
      assert(article.publishedAt, 'Article must have ISO publishedAt');
      assert(!isNaN(Date.parse(article.publishedAt)), 'publishedAt must be valid date');
      assert(article.readingTime, 'Article must have readingTime');
      assert(article.url, 'Article must have canonical url');

      const parsedUrl = new URL(article.url);
      const host = parsedUrl.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(d => host === d || host.endsWith(`.${d}`));
      assert(isAllowed, `Publisher domain ${host} must be in domain allowlist`);
    }
  });

  await itAsync('get_interest_rates returns authoritative FRED series', async () => {
    const rates = await getInterestRates({ category: 'all' });
    assert(rates.mortgage30YearFixed, 'Must return 30-year mortgage rate');
    assert(rates.fedFundsEffectiveRate, 'Must return Fed funds rate');
    assert(rates.treasury10YearYield, 'Must return 10-year Treasury yield');
    assert(rates.topHysaApy, 'Must return top HYSA APY');
  });

  await itAsync('executeTool routes in-process with timeout safety', async () => {
    const quoteResult = await executeTool('get_stock_quote', { symbol: 'AAPL' });
    assert(quoteResult.symbol || quoteResult.error, 'Quote tool must return symbol or graceful error');

    const calcResult = await executeTool('calculate_budget_metrics', { metric: 'sum' }, {
      transactions: [{ amount: 42.50 }],
    });
    assert.strictEqual(calcResult.totalSpent, 42.50);
  });

  console.log(`\n========================================`);
  console.log(`All ${passedTests}/${totalTests} unit & integration tests passed!`);
  console.log(`========================================\n`);
}

runSuite().catch(err => {
  console.error('\nSuite failed:', err);
  process.exit(1);
});

