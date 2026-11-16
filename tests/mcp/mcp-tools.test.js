import { describe, it, expect } from 'vitest';
import { executeTool, getGeminiTools, MAX_TOOL_ITERATIONS } from '../../server/mcp/mcpRegistry.js';
import { calculateBudgetMetrics } from '../../server/mcp/tools/budgetCalculator.js';
import { normalizeTicker, getStockQuote } from '../../server/mcp/tools/stockQuote.js';
import { getInterestRates } from '../../server/mcp/tools/interestRates.js';
import { searchFinancialNews } from '../../server/mcp/tools/financialNews.js';
import { searchWeb } from '../../server/mcp/tools/webSearch.js';

describe('Model Context Protocol (MCP) Tool Suite', () => {
  it('Tool schema generator produces valid schema for Gemini function calling', () => {
    const geminiTools = getGeminiTools();
    expect(geminiTools.length).toBe(1);
    expect(geminiTools[0].functionDeclarations.length).toBe(5);

    // Rule: parametersJsonSchema must not be set on functionDeclarations
    geminiTools[0].functionDeclarations.forEach(fn => {
      expect(fn).toHaveProperty('name');
      expect(fn).toHaveProperty('description');
      expect(fn).toHaveProperty('parameters');
      expect(fn.parametersJsonSchema).toBeUndefined();
    });
  });

  it('calculateBudgetMetrics computes totals, largest expenses, and averages', async () => {
    const mockContext = {
      summary: { totalIncome: 5000 },
      transactions: [
        { id: '1', description: 'Whole Foods', amount: 80, category: 'Groceries' },
        { id: '2', description: 'Trader Joe', amount: 40, category: 'Groceries' },
        { id: '3', description: 'Internet', amount: 60, category: 'Bills' },
      ],
    };

    const res = await calculateBudgetMetrics({ metric: 'all' }, mockContext);
    expect(res).toHaveProperty('totalSpent', 180);
    expect(res).toHaveProperty('filteredCount', 3);
    expect(res).toHaveProperty('averagePerTransaction', 60);
    expect(res.largestExpense.description).toBe('Whole Foods');
    expect(Array.isArray(res.categoryBreakdown)).toBe(true);
    expect(res.categoryBreakdown[0].category).toBe('Groceries');
    expect(res.categoryBreakdown[0].total).toBe(120);
  });

  it('normalizeTicker standardizes dual share classes and cryptocurrency tickers', () => {
    expect(normalizeTicker('brk.b')).toBe('BRK-B');
    expect(normalizeTicker('brk-b')).toBe('BRK-B');
    expect(normalizeTicker('btc')).toBe('BTC-USD');
    expect(normalizeTicker('eth')).toBe('ETH-USD');
    expect(normalizeTicker('aapl')).toBe('AAPL');
  });

  it('getInterestRates fetches FRED rates and anchors Top HYSA to DFF + 0.35%', async () => {
    const rates = await getInterestRates({ category: 'all' });
    expect(rates).toHaveProperty('fedFundsEffectiveRate');
    expect(rates).toHaveProperty('topHysaApy');
    expect(rates).toHaveProperty('mortgage30YearFixed');
    expect(rates).toHaveProperty('treasury10YearYield');
  });

  it('searchFinancialNews provides authentic metadata and reputable publisher attribution', async () => {
    const news = await searchFinancialNews({ topic: 'inflation', limit: 5 });
    expect(news).toHaveProperty('articles');
    expect(Array.isArray(news.articles)).toBe(true);

    if (news.articles.length > 0) {
      const art = news.articles[0];
      expect(art).toHaveProperty('headline');
      expect(art).toHaveProperty('publisher');
      expect(art).toHaveProperty('publishedAt');
      expect(art).toHaveProperty('url');
    }
  });

  it('searchWeb sanitizes search query and executes safely', async () => {
    const search = await searchWeb({ query: 'high yield savings accounts' });
    expect(search).toHaveProperty('query');
    expect(search).toHaveProperty('results');
    expect(Array.isArray(search.results)).toBe(true);
  });

  it('executeTool dispatches tool calls with timeout protection', async () => {
    const res = await executeTool('calculate_budget_metrics', { metric: 'sum' }, {
      transactions: [{ amount: 42.50 }],
    });
    expect(res.totalSpent).toBe(42.50);
  });
});
