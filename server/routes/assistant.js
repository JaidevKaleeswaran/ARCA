import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

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
router.post('/chat', async (req, res) => {
  const startTime = Date.now();
  const { question, snapshot, history = [] } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question parameter' });
  }

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

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];
    let answerText = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
        });
        answerText = (response.text || '').trim();
        if (answerText) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!answerText) {
      throw lastError || new Error('All Gemini model fallbacks failed to respond');
    }

    return res.json({
      answer: answerText,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Assistant chat error:', err);
    return res.status(500).json({
      error: 'Failed to generate assistant response',
      message: err.message,
    });
  }
});

/**
 * POST /api/assistant/categorize
 * Uses Gemini to classify a transaction description into existing categories
 */
router.post('/categorize', async (req, res) => {
  const { description, amount = 0, categories = [] } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Missing description parameter' });
  }

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
    return res.status(500).json({ error: 'Categorization error', message: err.message });
  }
});

/**
 * POST /api/assistant/review
 * Analyzes transaction for anomalies/suspicious patterns
 */
router.post('/review', async (req, res) => {
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
    return res.status(500).json({ error: 'Review error', message: err.message });
  }
});

export default router;
