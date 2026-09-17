/**
 * AI Assistant Agent — Replaces RAG for financial Q&A
 * 
 * Receives the full financial snapshot from the Manager Agent and uses it
 * as direct context for Gemini, enabling accurate answers without vector search.
 * All data is small enough to fit in the context window.
 */

import { env } from '../../config/env';

// ── Conversation memory (simple sliding window) ──────────────────────────────

const MAX_HISTORY = 10;
let conversationHistory = [];

export function clearConversationHistory() {
  conversationHistory = [];
}

function addToHistory(role, text) {
  conversationHistory.push({ role, text, timestamp: Date.now() });
  if (conversationHistory.length > MAX_HISTORY * 2) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY * 2);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Answer a user's financial question using the complete data snapshot
 */
export async function answerQuery(question, financialSnapshot) {
  const startTime = Date.now();

  try {
    const apiBase = env.apiBaseUrl || '';
    const res = await fetch(`${apiBase}/api/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        snapshot: financialSnapshot,
        history: conversationHistory,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Assistant backend responded with status ${res.status}`);
    }

    const data = await res.json();
    const answerText = (data.answer || '').trim();

    if (!answerText) {
      throw new Error('Empty response from assistant backend');
    }

    const latencyMs = data.latencyMs || (Date.now() - startTime);

    // Record in conversation history
    addToHistory('user', question);
    addToHistory('assistant', answerText);

    return {
      success: true,
      answer: answerText,
      metrics: {
        latencyMs,
        model: 'gemini-server',
        dataPointsUsed: financialSnapshot?.summary?.transactionCount || 0,
        categoriesAnalyzed: financialSnapshot?.categoryBreakdown?.length || 0,
      },
    };
  } catch (err) {
    console.error('AI Assistant query failed with stack trace:\n', err.stack || err);

    // Fallback: try to answer simple questions from the snapshot directly
    const fallbackAnswer = tryFallbackAnswer(question, financialSnapshot);
    if (fallbackAnswer) {
      return {
        success: true,
        answer: fallbackAnswer,
        metrics: { latencyMs: Date.now() - startTime, dataPointsUsed: 0, categoriesAnalyzed: 0, fallback: true },
      };
    }

    return {
      success: false,
      error: err.message,
      answer: "I'm having trouble connecting to the financial intelligence service right now. Please ensure your backend is running with GEMINI_API_KEY configured.",
      metrics: { latencyMs: Date.now() - startTime, dataPointsUsed: 0, categoriesAnalyzed: 0 },
    };
  }
}

/**
 * Simple fallback for common questions when AI is unavailable
 */
function tryFallbackAnswer(question, snapshot) {
  const q = question.toLowerCase();

  if (q.includes('total spent') || q.includes('how much') && q.includes('spent')) {
    return `You've spent **$${snapshot.summary.totalSpent.toFixed(2)}** in the current budget cycle.`;
  }

  if (q.includes('income') || q.includes('earn')) {
    return `Your total income is **$${snapshot.summary.totalIncome.toFixed(2)}** per cycle.\n\n${snapshot.incomeSources.map(s => `• ${s.name}: $${s.amount} (${s.frequency})`).join('\n')}`;
  }

  if (q.includes('balance') || q.includes('left')) {
    return `Your net balance is **$${snapshot.summary.netBalance.toFixed(2)}**. You have **$${snapshot.summary.leftToBudget.toFixed(2)}** left to budget.`;
  }

  if (q.includes('budget') || q.includes('category') || q.includes('categories')) {
    return `**Budget Status:**\n${snapshot.categoryBreakdown.map(c =>
      `• ${c.name}: $${c.spent.toFixed(2)} / $${c.budgetLimit} (${c.status})`
    ).join('\n')}`;
  }

  return null;
}

export function getConversationHistory() {
  return [...conversationHistory];
}

/**
 * Analyze a specific transaction for suspicious patterns using Gemini.
 * Called when the user clicks "AI Review" on a flagged transaction.
 */
export async function reviewSuspiciousTransaction(tx, budgetSnapshot) {
  const startTime = Date.now();

  const { transactions = [], categories = [] } = budgetSnapshot;

  // Build context about the category and similar transactions
  const cat = categories.find(c => c.id === tx.categoryId);
  const catName = cat?.name || 'Unknown';
  const catLimit = cat?.limit || 0;

  const similarTxs = transactions
    .filter(t => t.id !== tx.id && t.categoryId === tx.categoryId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
    .map(t => `• ${t.date} | ${t.description} | $${t.amount}`);

  const currentSpending = transactions
    .filter(t => t.categoryId === tx.categoryId)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  try {
    const apiBase = env.apiBaseUrl || '';
    const res = await fetch(`${apiBase}/api/assistant/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction: {
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          categoryName: catName,
          source: tx.source || 'manual',
        },
        currentSpending,
        monthlyBudget: catLimit,
        similarTxs,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Review responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      verdict: data.verdict || 'Looks normal: Transaction matches expectations.',
      isSuspicious: Boolean(data.isSuspicious),
      latencyMs: data.latencyMs || (Date.now() - startTime),
    };
  } catch (err) {
    console.error('[SuspiciousReview] Error:', err);
    return {
      verdict: `Could not complete AI review: ${err.message}`,
      isSuspicious: false,
      latencyMs: Date.now() - startTime,
    };
  }
}
