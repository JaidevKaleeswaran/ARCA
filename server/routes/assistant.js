import express from 'express';
import { sanitizeError } from '../utils/sanitize.js';
import { createRateLimiter, validateChatInput, validateCategorizeInput } from '../middleware/security.js';
import { getMacroRates } from '../services/macroRates.js';
import { getAssistantClient, callWithModelCascade, getNextMondayISO } from '../config/aiClients.js';
import { getGeminiTools, getOllamaTools, executeTool, MAX_TOOL_ITERATIONS } from '../mcp/mcpRegistry.js';

const router = express.Router();

// Rate limiters for assistant endpoints
const chatLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: 'Too many assistant queries. Please wait a moment.' });
const categorizeLimiter = createRateLimiter({ windowMs: 60000, max: 60, message: 'Too many categorization requests.' });
const reviewLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: 'Too many review requests.' });

// ── Ollama Qwen 3.5 Auto-Detection & Caching ────────────────────────────────

let cachedOllamaStatus = null;
let lastOllamaCheckTime = 0;
const OLLAMA_CHECK_TTL = 15000; // 15 seconds

export async function isOllamaQwenAvailable() {
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return false;
  }

  const now = Date.now();
  if (cachedOllamaStatus !== null && (now - lastOllamaCheckTime < OLLAMA_CHECK_TTL)) {
    return cachedOllamaStatus;
  }

  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(250),
    });

    if (!res.ok) {
      cachedOllamaStatus = false;
      lastOllamaCheckTime = now;
      return false;
    }

    const data = await res.json();
    const models = data.models || [];
    const targetModel = (process.env.OLLAMA_MODEL || 'qwen3.5:9b').toLowerCase();

    const hasModel = models.some(m => {
      const name = (m.name || m.model || '').toLowerCase();
      return name === targetModel ||
        name.startsWith(targetModel + ':') ||
        name.startsWith('qwen3.5') ||
        name.includes('qwen');
    });

    cachedOllamaStatus = hasModel;
    lastOllamaCheckTime = now;
    return hasModel;
  } catch {
    cachedOllamaStatus = false;
    lastOllamaCheckTime = now;
    return false;
  }
}

/**
 * System prompt generator for financial Q&A
 */
function buildSystemPrompt(snapshot, macroRates = null) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `You are ARCA, an expert financial intelligence assistant embedded in the StackedBudgeting app. Your job is to help users understand their finances, optimize budgets, build wealth, and provide real, actionable financial guidance.

Today is ${today}.

## Capabilities & MCP In-Process Tools
You have direct access to authoritative real-time financial tools:
- calculate_budget_metrics: Use this for ALL math over budget, spending, averages, or cashflow. DO NOT perform mental arithmetic.
- get_stock_quote: Retrieve real-time stock/crypto prices, daily changes, and market caps.
- get_interest_rates: Retrieve official FRED Federal Reserve rates, mortgage benchmarks, and Treasury yields.
- search_financial_news: Search verified journalistic reporting from Bloomberg, Reuters, WSJ, CNBC, FT, Barron's, and MarketWatch.
- search_web: Query the web for specific financial terms, policies, or institutional offerings.

## How to use the user data
Context is provided inside <user_budget_data> and <market_macro_data> tags:
- Reference their actual numbers when relevant ("You're spending $420/mo on dining out, which is about 15% of your income").
- Apply general financial knowledge, best practices, and reasoning that goes beyond what's in the data — budgeting frameworks, debt payoff strategies, savings rate benchmarks, emergency fund sizing, etc.
- Answer general financial questions even if they aren't directly tied to the user's data (e.g. "what's a Roth IRA," "how does the 50/30/20 rule work").

## Macroeconomic & Market Awareness
When answering questions about debt payoff, savings, buying a home, vehicle purchases, or investments:
- Ground your analysis in official interest rates provided in <market_macro_data> or via get_interest_rates.
- For liquid cash reserves & emergency funds, emphasize high-yield cash yields (~${macroRates?.topHysa ?? 4.23}% APY) that outpace inflation and provide safe liquidity.
- For debt elimination, highlight the severe drag of credit card rates (~${macroRates?.creditCardApr ?? 21.19}%) and recommend aggressive payoff before discretionary spending.
- For mortgage or vehicle purchase queries, ground financing calculations in prevailing benchmarks (~${macroRates?.mortgage30 ?? 7.11}% for 30-year mortgages).

## How to respond
1. Briefly acknowledge what the data shows, if relevant to the question.
2. Give a clear, direct answer or recommendation — don't hedge into vagueness.
3. Ground advice in real financial principles rather than generic platitudes.
4. Keep responses concise, structured, and conversational.

<market_macro_data>
AS OF: ${macroRates?.asOf || new Date().toISOString()}
CURRENT INTEREST RATES & BENCHMARKS (Official FRED & US Treasury Market):
• Federal Funds Effective Rate: ${macroRates?.dff ?? 3.88}%
• 10-Year US Treasury Yield: ${macroRates?.tenYearYield ?? 5.15}%
• 3-Month US Treasury Bill Yield: ${macroRates?.threeMonthYield ?? 4.12}%
• 5-Year US Treasury Yield: ${macroRates?.fiveYearYield ?? 4.98}%
• 30-Year US Treasury Yield: ${macroRates?.thirtyYearYield ?? 5.48}%
• 30-Year Fixed Mortgage Average: ${macroRates?.mortgage30 ?? 7.11}%
• 15-Year Fixed Mortgage Average: ${macroRates?.mortgage15 ?? 6.45}%
• Bank Prime Loan Rate: ${macroRates?.primeRate ?? 7.00}%
• Top Competitive High-Yield Savings (HYSA) APY: ~${macroRates?.topHysa ?? 4.23}% (DFF + 0.35%)
• National Commercial Bank Credit Card APR: ${macroRates?.creditCardApr ?? 21.19}%
MACROECONOMIC INDICATORS:
• CPI Inflation (YoY): ${macroRates?.cpiYoY ?? 2.6}%
• US Civilian Unemployment Rate: ${macroRates?.unemployment ?? 4.1}%
</market_macro_data>

<user_budget_data>
SUMMARY:
• Total Income: $${snapshot?.summary?.totalIncome ?? snapshot?.totalIncome ?? 0}
• Total Spent (current cycle): $${snapshot?.summary?.totalSpent ?? snapshot?.totalSpent ?? 0}
• Total Budget Allocated: $${snapshot?.summary?.totalAllocated ?? snapshot?.totalAllocated ?? 0}
• Left to Budget: $${snapshot?.summary?.leftToBudget ?? snapshot?.leftToBudget ?? 0}
• Net Cash Flow: $${snapshot?.summary?.netBalance ?? snapshot?.netBalance ?? 0}
• Estimated Total Net Worth: $${snapshot?.summary?.netWorth ?? snapshot?.netWorth ?? 0}
• Total Transactions: ${snapshot?.summary?.transactionCount ?? (snapshot?.transactions || []).length}
• Budget Cycle: ${snapshot?.summary?.cycleFrequency ?? snapshot?.cycleFrequency ?? 'Monthly'}

STOCK PORTFOLIO & INVESTMENTS:
• Total Stock Value: $${snapshot?.portfolio?.totalValue ?? snapshot?.portfolioCurrentValue ?? 0}
• Total Invested (Cost Basis): $${snapshot?.portfolio?.totalInvested ?? snapshot?.portfolioTotalInvested ?? 0}
• Total Return: $${snapshot?.portfolio?.totalGain ?? snapshot?.portfolioTotalGain ?? 0} (${snapshot?.portfolio?.totalGainPercent ?? snapshot?.portfolioTotalGainPercent ?? 0}%)
• Holdings Count: ${(snapshot?.investments || snapshot?.portfolio?.holdings || []).length}
${(snapshot?.investments || snapshot?.portfolio?.holdings || []).length > 0
    ? (snapshot?.investments || snapshot?.portfolio?.holdings || []).map(h =>
      `  - ${h.symbol} (${h.name || h.symbol}): ${h.shares} shares @ $${h.currentPrice} | Value: $${h.currentValue} | P/L: $${h.unrealizedGain ?? h.gain ?? 0} (${h.unrealizedGainPercent ?? h.gainPercent ?? 0}%)`
    ).join('\n')
    : '  - No stock investments added yet'}

INCOME SOURCES:
${(snapshot?.incomeSources || []).length > 0
    ? snapshot.incomeSources.map(s => `• ${s.name}: $${s.amount} (${s.frequency})`).join('\n')
    : '• No income sources configured'}

BUDGET CATEGORIES (Current Cycle):
${(snapshot?.categoryBreakdown || snapshot?.categories || []).length > 0
    ? (snapshot?.categoryBreakdown || snapshot?.categories || []).map(c =>
      `• ${c.name}: Spent $${(c.spent || 0).toFixed(2)} of $${c.budgetLimit || c.limit || 0} limit (${c.remaining !== undefined ? `$${c.remaining.toFixed(2)} remaining` : ''})`
    ).join('\n')
    : '• No categories configured'}

RECENT TRANSACTIONS (up to 30):
${(snapshot?.recentTransactions || snapshot?.transactions || []).slice(0, 30).length > 0
    ? (snapshot?.recentTransactions || snapshot?.transactions || []).slice(0, 30).map(t =>
      `• ${t.date} | ${t.description} | $${t.amount} | ${t.category || t.categoryName || 'General'}`
    ).join('\n')
    : '• No transactions recorded'}
</user_budget_data>`;
}

/**
 * POST /api/assistant/chat
 * Answers user financial queries safely via local Qwen (if available) or Google Gemini
 */
router.post('/chat', chatLimiter, validateChatInput, async (req, res) => {
  const startTime = Date.now();
  const { question, snapshot = {}, history = [] } = req.body;

  try {
    const macroData = await getMacroRates().catch(() => null);
    const systemPrompt = buildSystemPrompt(snapshot, macroData?.raw || macroData);
    const isLocalQwen = await isOllamaQwenAvailable();

    // ── Local Path: Ollama Qwen 3.5 ──────────────────────────────────────────
    if (isLocalQwen) {
      try {
        const targetModel = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
        const ollamaTools = getOllamaTools();

        const messages = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text || msg.content || '',
          })),
          { role: 'user', content: question },
        ];

        let finalAnswer = '';
        const groundedSources = [];

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const isLastIteration = iteration === MAX_TOOL_ITERATIONS - 1;
          const ollamaRes = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: targetModel,
              messages,
              tools: isLastIteration ? undefined : ollamaTools,
              stream: false,
            }),
            signal: AbortSignal.timeout(20000),
          });

          if (!ollamaRes.ok) {
            throw new Error(`Ollama chat returned HTTP ${ollamaRes.status}`);
          }

          const ollamaData = await ollamaRes.json();
          const assistantMsg = ollamaData.message || {};
          messages.push(assistantMsg);

          const toolCalls = assistantMsg.tool_calls || [];
          if (toolCalls.length === 0 || isLastIteration) {
            finalAnswer = assistantMsg.content || '';
            break;
          }

          // Execute requested tools in-process
          for (const call of toolCalls) {
            const toolName = call.function?.name;
            const toolArgs = call.function?.arguments || {};
            const result = await executeTool(toolName, toolArgs, snapshot);

            if (toolName === 'search_financial_news' && result.articles) {
              result.articles.forEach(a => groundedSources.push({ title: a.headline, uri: a.url, publisher: a.publisher }));
            } else if (toolName === 'search_web' && result.results) {
              result.results.forEach(r => groundedSources.push({ title: r.title, uri: r.url }));
            }

            messages.push({
              role: 'tool',
              name: toolName,
              tool_call_id: call.id || toolName || 'call_0',
              content: JSON.stringify(result),
            });
          }
        }

        res.setHeader('X-AI-Provider', 'local-qwen');
        return res.json({
          answer: finalAnswer,
          sources: groundedSources,
          provider: 'local-qwen',
          isWebGrounded: groundedSources.length > 0,
          latencyMs: Date.now() - startTime,
        });
      } catch (ollamaErr) {
        console.warn('[Assistant] Local Ollama failed, falling back to Cloud Gemini cascade:', ollamaErr.message);
        // Seamlessly fall through to Cloud Gemini
      }
    }

    // ── Cloud Path: Gemini with Cascade & MCP Tools ──────────────────────────
    const client = getAssistantClient();
    if (!client) {
      return res.status(500).json({
        error: 'No Gemini API key configured for AI assistant. Set ASSISTANT_API_KEY or GEMINI_API_KEY.',
      });
    }

    const geminiTools = getGeminiTools();

    // Construct strictly alternating conversation turns for Gemini
    const contents = [];
    const conversationTurns = [
      ...history.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        text: (msg.text || msg.content || '').trim(),
      })),
      { role: 'user', text: question.trim() },
    ];

    for (const turn of conversationTurns) {
      if (!turn.text) continue;
      if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
        // Merge consecutive turns of the same role
        contents[contents.length - 1].parts[0].text += `\n\n${turn.text}`;
      } else {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }
    }

    // Gemini requires conversations to start with a 'user' turn
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }
    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: question.trim() }] });
    }

    let finalAnswer = '';
    const groundedSources = [];

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const isLastIteration = iteration === MAX_TOOL_ITERATIONS - 1;
      const response = await callWithModelCascade(client, 'chat', {
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: isLastIteration ? [] : geminiTools,
        },
      });

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Extract web search grounding metadata if present from Google Search tool
      const searchChunks = candidate?.groundingMetadata?.groundingChunks || [];
      if (searchChunks.length > 0) {
        searchChunks
          .filter(c => c.web?.uri)
          .forEach(c => groundedSources.push({ title: c.web.title || 'Web Source', uri: c.web.uri }));
      }

      // Check for function calls
      const functionCalls = response.functionCalls || parts.filter(p => p.functionCall).map(p => p.functionCall);

      if (!functionCalls || functionCalls.length === 0 || isLastIteration) {
        finalAnswer = response.text || parts.map(p => p.text).filter(Boolean).join('\n') || '';
        break;
      }

      // Add model's tool request part to contents
      contents.push({
        role: 'model',
        parts,
      });

      // Execute each function call and construct response parts
      const functionResponseParts = [];
      for (const fn of functionCalls) {
        const result = await executeTool(fn.name, fn.args, snapshot);

        if (fn.name === 'search_financial_news' && result.articles) {
          result.articles.forEach(a => groundedSources.push({ title: a.headline, uri: a.url, publisher: a.publisher }));
        } else if (fn.name === 'search_web' && result.results) {
          result.results.forEach(r => groundedSources.push({ title: r.title, uri: r.url }));
        }

        functionResponseParts.push({
          functionResponse: {
            name: fn.name,
            response: { result },
          },
        });
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    res.setHeader('X-AI-Provider', 'cloud-gemini');
    return res.json({
      answer: finalAnswer.trim(),
      sources: groundedSources,
      provider: 'cloud-gemini',
      isWebGrounded: groundedSources.length > 0,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Assistant chat error:', err);

    if (err.status === 429 || err.code === 'UPSTREAM_RATE_LIMIT') {
      return res.status(429).json(err.payload || {
        error: 'UPSTREAM_RATE_LIMIT',
        message: 'High demand: upgrade to Stacked Pro for priority dedicated bandwidth.',
        resetDate: getNextMondayISO(),
      });
    }

    return res.status(500).json({
      error: 'Failed to generate assistant response',
      message: sanitizeError(err),
    });
  }
});

/**
 * POST /api/assistant/categorize
 * Uses Gemini 2.0 Flash Lite to silently categorize transactions
 */
router.post('/categorize', categorizeLimiter, validateCategorizeInput, async (req, res) => {
  const { description, amount = 0, categories = [] } = req.body;

  try {
    const client = getAssistantClient();
    if (!client) {
      return res.status(500).json({ error: 'Categorization client unavailable' });
    }

    const prompt = `You are a financial transaction categorizer for a personal budget.
Categorize the following transaction into ONE of the user's existing budget categories.

Available categories:
${categories.map(c => `- ${c}`).join('\n')}

Transaction: "${description}" for $${amount}

Rules:
- Return ONLY the category name, nothing else
- Choose the most specific matching category from the available list
- If no good match, return the closest one`;

    const response = await callWithModelCascade(client, 'categorization', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const category = (response.text || '').trim();
    return res.json({ category: category || null });
  } catch (err) {
    console.error('Assistant categorize error:', err);
    if (err.status === 429 || err.code === 'UPSTREAM_RATE_LIMIT') {
      return res.status(429).json(err.payload || {
        error: 'UPSTREAM_RATE_LIMIT',
        message: 'High demand: upgrade to Stacked Pro for priority dedicated bandwidth.',
        resetDate: getNextMondayISO(),
      });
    }
    return res.status(500).json({ error: 'Categorization error', message: sanitizeError(err) });
  }
});

/**
 * POST /api/assistant/review
 * Analyzes transaction for anomalies/suspicious patterns
 */
router.post('/review', reviewLimiter, async (req, res) => {
  const startTime = Date.now();
  const { transaction, currentSpending = 0, monthlyBudget = 0, similarTxs = [] } = req.body;

  if (!transaction) {
    return res.status(400).json({ error: 'Missing transaction parameter' });
  }

  try {
    const client = getAssistantClient();
    if (!client) {
      return res.status(500).json({ error: 'Review client unavailable' });
    }

    const prompt = `You are a financial anomaly detection assistant. Analyze this transaction and determine if it is genuinely suspicious or if it appears to be a normal expense.

Transaction under review:
- Description: "${transaction.description}"
- Amount: $${transaction.amount}
- Date: ${transaction.date}
- Category: ${transaction.categoryName || 'Uncategorized'} (limit: $${monthlyBudget})
- Source: ${transaction.source || 'manual'}

Recent similar transactions in the same category:
${similarTxs.length > 0 ? similarTxs.join('\n') : '• No prior transactions in this category'}

Possible reasons it was flagged: duplicate within 24h, amount unusually high vs category average, or outlier vs category limit.

Respond in 2 sentences max. Start with either "Looks normal:" or "Suspicious:" and then explain your reasoning clearly and concisely.`;

    const response = await callWithModelCascade(client, 'categorization', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const answerText = (response.text || '').trim();
    const isSuspicious = answerText ? answerText.toLowerCase().includes('suspicious') : false;

    return res.json({
      verdict: answerText || 'Could not analyze transaction',
      isSuspicious,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Assistant review error:', err);
    return res.status(500).json({ error: 'Review error', message: sanitizeError(err) });
  }
});

export default router;
