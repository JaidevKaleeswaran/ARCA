import { calculateBudgetMetrics } from './tools/budgetCalculator.js';
import { getStockQuote } from './tools/stockQuote.js';
import { getInterestRates } from './tools/interestRates.js';
import { searchFinancialNews } from './tools/financialNews.js';
import { searchWeb } from './tools/webSearch.js';

export const MAX_TOOL_ITERATIONS = 3;
export const TOOL_TIMEOUT_MS = 3500;

// Universal Tool Definitions (MCP / JSON Schema compliant)
const TOOL_DEFINITIONS = [
  {
    name: 'calculate_budget_metrics',
    description: 'Calculate deterministic budget arithmetic over user transactions and income, avoiding mental math errors. Returns totals, averages, largest expenses, category breakdowns, or net cashflow.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category name or ID to filter by (e.g., Dining, Groceries, Bills).',
        },
        startDate: {
          type: 'string',
          description: 'Optional start date in YYYY-MM-DD format.',
        },
        endDate: {
          type: 'string',
          description: 'Optional end date in YYYY-MM-DD format.',
        },
        metric: {
          type: 'string',
          enum: ['all', 'sum', 'average', 'largest_expense', 'category_breakdown', 'net_cashflow'],
          description: 'The specific arithmetic metric to calculate.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_stock_quote',
    description: 'Fetch real-time stock or cryptocurrency market quote, including current price, daily change, volume, day range, and market capitalization.',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'The ticker symbol (e.g. AAPL, NVDA, SPY, BTC, ETH, SOL, BRK.B).',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_interest_rates',
    description: 'Get live authoritative Federal Reserve Economic Data (FRED) and US Treasury sovereign debt market yields (Fed Funds Rate, 30-Year Mortgage, 15-Year Mortgage, 10-Year Treasury, Top HYSA APY, Credit Card APR).',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['all', 'mortgage', 'treasury', 'fed', 'savings'],
          description: 'Filter for specific interest rate category.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_financial_news',
    description: 'Search verified financial journalism articles strictly from reputable publishers (Bloomberg, Reuters, WSJ, CNBC, FT, Barron\'s, MarketWatch) with genuine headlines, ISO timestamps, reading times, and canonical URLs.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Financial news topic, ticker, or macroeconomic theme (e.g., Fed rates, inflation, tech, consumer spending).',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of articles to return (1-10).',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'search_web',
    description: 'Perform a live web search for general financial or economic queries, product comparisons, or institution guidelines.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query.',
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Returns tools formatted for Google GenAI SDK (functionDeclarations)
 */
export function getGeminiTools() {
  return [
    {
      functionDeclarations: TOOL_DEFINITIONS.map(def => ({
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      })),
    },
  ];
}

/**
 * Returns tools formatted for Ollama / OpenAI tool schema
 */
export function getOllamaTools() {
  return TOOL_DEFINITIONS.map(def => ({
    type: 'function',
    function: {
      name: def.name,
      description: def.description,
      parameters: def.parameters,
    },
  }));
}

/**
 * Executes a tool in-process with a strict 3,500ms timeout
 *
 * @param {string} name - Tool name
 * @param {Object} args - Arguments passed by LLM
 * @param {Object} budgetContext - Injected user budget snapshot
 * @returns {Promise<Object>} Result of tool execution
 */
export async function executeTool(name, args = {}, budgetContext = {}) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Tool ${name} timed out after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS)
  );

  const parsedArgs = typeof args === 'string' ? JSON.parse(args || '{}') : (args || {});

  const runnerPromise = (async () => {
    switch (name) {
      case 'calculate_budget_metrics':
        return await calculateBudgetMetrics(parsedArgs, budgetContext);
      case 'get_stock_quote':
        return await getStockQuote(parsedArgs);
      case 'get_interest_rates':
        return await getInterestRates(parsedArgs);
      case 'search_financial_news':
        return await searchFinancialNews(parsedArgs);
      case 'search_web':
        return await searchWeb(parsedArgs);
      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  })();

  try {
    const result = await Promise.race([runnerPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.warn(`[mcpRegistry] Error executing ${name}:`, err.message);
    return {
      error: `Failed to execute ${name}: ${err.message}`,
    };
  }
}
