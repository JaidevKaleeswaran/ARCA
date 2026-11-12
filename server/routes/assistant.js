import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { sanitizeError } from '../utils/sanitize.js';
import { createRateLimiter, validateChatInput, validateCategorizeInput } from '../middleware/security.js';

const router = express.Router();

// Rate limiters for assistant endpoints
const chatLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: 'Too many assistant queries. Please wait a moment.' });
const categorizeLimiter = createRateLimiter({ windowMs: 60000, max: 60, message: 'Too many categorization requests.' });
const reviewLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: 'Too many review requests.' });

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY 
    || process.env.ASSISTANT_API_KEY 
    || process.env.MANAGER_API_KEY;

  if (!apiKey) {
    throw Object.assign(new Error('No Gemini API key configured on server. Set GEMINI_API_KEY in environment variables.'), {
      code: 'MISSING_API_KEY',
    });
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * System prompt generator for financial Q&A
 */
function buildSystemPrompt(snapshot) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `You are a financial assistant embedded in a personal budgeting app. Your job is to help users understand their finances AND give them real, actionable financial advice — not just report back numbers they can already see on screen.

Today is ${today}.

## How to use the data

You will be given the user's budget data (income, expenses, categories, savings, goals, etc.) inside <user_budget_data> tags. Treat this as context about this specific person, not as the boundary of what you're allowed to talk about. You should:

- Reference their actual numbers when relevant ("You're spending $420/mo on dining out, which is about 15% of your income")
- Apply general financial knowledge, best practices, and reasoning that goes beyond what's in the data — budgeting frameworks, debt payoff strategies, savings rate benchmarks, emergency fund sizing, etc.
- Answer general financial questions even if they aren't directly tied to the user's data (e.g. "what's a Roth IRA," "how does the 50/30/20 rule work")

Do not limit yourself to summarizing or restating the data. The data is an input to your reasoning, not a cage around it.

## How to respond

1. Briefly acknowledge what the data shows, if relevant to the question.
2. Give a clear, direct answer or recommendation — don't hedge into vagueness.
3. Ground advice in real financial principles rather than generic platitudes.
4. Where there are multiple reasonable approaches, briefly mention the tradeoff instead of picking one silently.
5. Keep responses concise and conversational — this is a chat interface, not a report.

## Insurance Guidance & Risk Management

You have expert knowledge across personal insurance lines:
- **Health Insurance**: Compare HMO vs PPO vs HDHP. Explain deductibles, premiums, copays, coinsurance, and out-of-pocket maximums. Recommend pairing HDHP with a Triple-Tax-Advantaged Health Savings Account (HSA) when feasible.
- **Auto Insurance**: Explain liability coverage limits (100k/300k/100k benchmarks), collision, comprehensive, and uninsured motorist coverage. Explain deductible sizing ($500 vs $1,000) based on their emergency fund.
- **Renters & Homeowners Insurance**: Emphasize replacement cost coverage over actual cash value, liability limits, and protecting personal property.
- **Life Insurance**: Recommend affordable Term Life insurance (typically 10-12x annual income) over high-fee Whole/Universal life for individuals with dependents or debt.
- **Disability Insurance**: Highlight long-term disability protection (covering 60-70% of gross salary) as fundamental risk prevention.
- Evaluate whether the user's budget allocations and emergency fund can comfortably absorb insurance deductibles.

## Purchase Budgeting & Sinking Fund Planning

When a user asks how to budget for a large purchase (e.g. vehicle, house down payment, computer, vacation, wedding):
1. **Target Timeline & Sinking Fund Calculation**: Compute the required monthly contribution: Target Amount ÷ Number of Months.
2. **Current Budget Fit**: Check against their current income and Left to Budget amount.
3. **Envelope Reallocation**: Pinpoint which existing discretionary categories (Dining, Entertainment, Shopping) they could temporarily trim.
4. **Total Cost of Ownership (TCO)**: Factor in recurring ownership costs (insurance, fuel, maintenance, taxes).
5. **Cash vs Financing**: Explain the true interest cost at current borrowing rates versus saving cash.

## Boundaries

- You are not a licensed financial advisor. For anything involving specific investment decisions, tax filing, or legal/estate matters, give general educational information and suggest the user consult a licensed professional for their specific situation.
- Don't fabricate numbers, account details, or transactions that aren't in the provided data.

<user_budget_data>
SUMMARY:
• Total Income: $${snapshot?.summary?.totalIncome ?? 0}
• Total Spent (current cycle): $${snapshot?.summary?.totalSpent ?? 0}
• Total Budget Allocated: $${snapshot?.summary?.totalAllocated ?? 0}
• Left to Budget: $${snapshot?.summary?.leftToBudget ?? 0}
• Net Balance: $${snapshot?.summary?.netBalance ?? 0}
• Total Transactions: ${snapshot?.summary?.transactionCount ?? 0}
• Budget Cycle: ${snapshot?.summary?.cycleFrequency ?? 'Monthly'}

INCOME SOURCES:
${(snapshot?.incomeSources || []).length > 0
    ? snapshot.incomeSources.map(s => `• ${s.name}: $${s.amount} (${s.frequency})`).join('\n')
    : '• No income sources configured'}

BUDGET CATEGORIES (Current Cycle):
${(snapshot?.categoryBreakdown || []).length > 0
    ? snapshot.categoryBreakdown.map(c =>
      `• ${c.name}: Spent $${(c.spent || 0).toFixed(2)} of $${c.budgetLimit || 0} limit (${c.status || 'OK'}, $${(c.remaining || 0).toFixed(2)} remaining)`
    ).join('\n')
    : '• No categories configured'}

RECENT TRANSACTIONS (up to 50):
${(snapshot?.recentTransactions || []).length > 0
    ? snapshot.recentTransactions.map(t =>
      `• ${t.date} | ${t.description} | $${t.amount} | ${t.category}`
    ).join('\n')
    : '• No transactions recorded'}
</user_budget_data>`;
}

/**
 * POST /api/assistant/chat
 * Answers user financial queries safely via server-side Gemini
 */
router.post('/chat', chatLimiter, validateChatInput, async (req, res) => {
  const startTime = Date.now();
  const { question, snapshot, history = [] } = req.body;

  try {
    const ai = getAI();
    const systemPrompt = buildSystemPrompt(snapshot || {});

    // Build multi-turn contents array
    const contents = [{ role: 'user', parts: [{ text: systemPrompt }] }];

    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const isWebSearchIntent = /(current|today|latest|news|stock|price|rate|fed|inflation|market|interest|quote|cost of|search|compare insurance)/i.test(question);
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
    let answerText = null;
    let lastError = null;
    let groundedSources = [];

    for (const model of modelsToTry) {
      try {
        const generateOptions = {
          model,
          contents,
        };

        // Enable Google Search grounding tool if query has web search intent
        if (isWebSearchIntent && (model === 'gemini-2.5-flash' || model === 'gemini-2.0-flash')) {
          generateOptions.config = {
            tools: [{ googleSearch: {} }],
          };
        }

        const response = await ai.models.generateContent(generateOptions);
        answerText = (response.text || '').trim();

        // Extract grounding web search metadata if present
        const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        if (searchChunks.length > 0) {
          groundedSources = searchChunks
            .filter(c => c.web?.uri)
            .map(c => ({ title: c.web.title || 'Web Source', uri: c.web.uri }));
        }

        if (answerText) break;
      } catch (err) {
        lastError = err;
        // Try fallback without search tool if tool calling threw error
        try {
          const fallbackRes = await ai.models.generateContent({ model, contents });
          answerText = (fallbackRes.text || '').trim();
          if (answerText) break;
        } catch (_) {}
      }
    }

    if (!answerText) {
      throw lastError || new Error('All Gemini model fallbacks failed to respond');
    }

    return res.json({
      answer: answerText,
      sources: groundedSources,
      isWebGrounded: groundedSources.length > 0,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Assistant chat error:', err);
    return res.status(500).json({
      error: 'Failed to generate assistant response',
      message: sanitizeError(err),
    });
  }
});

/**
 * POST /api/assistant/categorize
 * Uses Gemini to classify a transaction description into existing categories
 */
router.post('/categorize', categorizeLimiter, validateCategorizeInput, async (req, res) => {
  const { description, amount = 0, categories = [] } = req.body;

  try {
    const ai = getAI();
    const prompt = `You are a financial transaction categorizer for a personal budget.
Categorize the following transaction into ONE of the user's existing budget categories.

Available categories:
${categories.map(c => `- ${c}`).join('\n')}

Transaction: "${description}" for $${amount}

Rules:
- Return ONLY the category name, nothing else
- Choose the most specific matching category from the available list
- If no good match, return the closest one`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let category = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        category = (response.text || '').trim();
        if (category) break;
      } catch (err) {
        // try next
      }
    }

    return res.json({ category: category || null });
  } catch (err) {
    console.error('Assistant categorize error:', err);
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
    const ai = getAI();
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

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let answerText = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        answerText = (response.text || '').trim();
        if (answerText) break;
      } catch {
        // try next
      }
    }

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
