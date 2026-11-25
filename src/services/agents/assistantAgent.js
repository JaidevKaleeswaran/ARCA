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

    const providerHeader = res.headers.get('X-AI-Provider');

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.message || `Assistant backend responded with status ${res.status}`);
      error.status = res.status;
      error.data = errorData;
      throw error;
    }

    const data = await res.json();
    const answerText = (data.answer || '').trim();

    if (!answerText) {
      throw new Error('Empty response from assistant backend');
    }

    const latencyMs = data.latencyMs || (Date.now() - startTime);
    const provider = providerHeader || data.provider || 'cloud-gemini';

    // Record in conversation history
    addToHistory('user', question);
    addToHistory('assistant', answerText);

    return {
      success: true,
      answer: answerText,
      provider,
      metrics: {
        latencyMs,
        model: provider,
        dataPointsUsed: financialSnapshot?.summary?.transactionCount || 0,
        categoriesAnalyzed: financialSnapshot?.categoryBreakdown?.length || 0,
        sources: data.sources || [],
        isWebGrounded: Boolean(data.isWebGrounded),
      },
    };
  } catch (err) {
    console.error('AI Assistant query failed with stack trace:\n', err.stack || err);

    if (err.status === 429 || err?.data?.error === 'UPSTREAM_RATE_LIMIT' || err?.message?.includes('429')) {
      return {
        success: false,
        status: 429,
        isRateLimit: true,
        error: err.message,
        errorData: err.data,
      };
    }

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

  const tutorialReminder =
    '\n\n**Tip:** Remember to walk through the interactive **Tutorial** for a guided tour! To start it anytime, open **Settings** (the **gear icon** in the top-right corner) and tap **Start Tutorial** (on a computer, you can also click the **Tutorial ?** button in the bottom-right corner).';

  const isNavigationQuery =
    q.includes('where') ||
    q.includes('how do i') ||
    q.includes('how to') ||
    q.includes('find') ||
    q.includes('navigate') ||
    q.includes('tutorial') ||
    q.includes('log out') ||
    q.includes('logout') ||
    q.includes('sign out') ||
    q.includes('settings');

  if (isNavigationQuery) {
    if (q.includes('tutorial') || q.includes('walkthrough') || q.includes('guide')) {
      return `You can start or replay the interactive **Tutorial** for your current page by tapping the **Settings** gear icon in the top-right header and selecting **Start Tutorial**. On a computer, you can also click the **Tutorial ?** button in the bottom-right corner.`;
    }
    if (q.includes('log out') || q.includes('logout') || q.includes('sign out')) {
      return `To log out of ARCA, tap the **Settings** gear icon in the top-right corner of the header and select **Log out** at the bottom of the drawer (on a computer, there is also a Sign out icon in the top-right header).${tutorialReminder}`;
    }
    if (q.includes('expense') || q.includes('transaction') || q.includes('receipt') || q.includes('scan') || q.includes('csv') || q.includes('ledger')) {
      return `You can manage all expenses in the **Ledger** tab:\n\n• **Quick Add (Mobile):** Tap the floating **+ Transaction** button above the bottom-right of the Liquid Glass navigation bar.\n• **Manual / Voice / Scan / CSV:** Open the **Ledger** tab and use **+ Add expense**, **Speak**, **Scan**, or **CSV** at the top.\n• **Edit or Delete:** On mobile, tap any item in the Ledger to expand its dropdown editor; on computer, hover a row and click the Edit icon.${tutorialReminder}`;
    }
    if (q.includes('category') || q.includes('categories') || q.includes('quick-fill') || q.includes('envelope')) {
      return `Budget envelopes live in the **Budget** tab under **Categories**:\n\n• Tap **+ Add** to create a category or **Quick-Fill** to apply a preset split like 50/30/20.\n• **Edit or Delete:** On mobile, tap any category widget to extend its dropdown editor (name, amount, color, and delete); on computer, hover the category row for Edit and Delete buttons.${tutorialReminder}`;
    }
    if (q.includes('salary') || q.includes('income') || q.includes('cycle')) {
      return `Go to the **Budget** tab and scroll to **Income & Cycle** to click **Set Base Salary**, **+ Add source** for extra income streams, or adjust your pay cycle **Schedule** and **Start** date.${tutorialReminder}`;
    }
    if (q.includes('rate') || q.includes('news') || q.includes('macro') || q.includes('treasury') || q.includes('fed')) {
      return `On **mobile**, open the **Financial** tab in the bottom Liquid Glass bar to view Interest Rates & Treasury Benchmarks, Macroeconomic Outlook, and Live Financial News. On a **computer**, these sections are unified inside the **Markets** tab.${tutorialReminder}`;
    }
    if (q.includes('stock') || q.includes('market') || q.includes('invest') || q.includes('watchlist') || q.includes('favorite')) {
      return `Open the **Markets** tab to search stocks, tap the **★ star** to favorite and pin tickers at the top, click **+ Invest**, or tap any stock card to open its interactive price history drawer.${tutorialReminder}`;
    }
    if (q.includes('chart') || q.includes('net worth') || q.includes('summary') || q.includes('alert')) {
      return `Open the **Summary** tab to view your **Financial Health Cards** (Net Worth, Cash Flow, Savings Rate), **Master Balance Allocation**, **Category Breakdown** charts, and **Alerts & Cycle Hub**.${tutorialReminder}`;
    }
    if (q.includes('password') || q.includes('profile') || q.includes('avatar') || q.includes('settings')) {
      return `Tap the **Settings** gear icon in the top-right corner of the header to update your **Profile** (display name & avatar), manage your **Password**, **Start Tutorial**, or **Log out**.${tutorialReminder}`;
    }
    return `Here is how ARCA is organized:\n\n• **Budget:** Left-to-spend overview, Categories, and Income & Cycle.\n• **Ledger:** Add, speak, scan, export, or edit expenses (or tap the floating **+ Transaction** button on mobile).\n• **Summary:** Net worth, health scorecards, charts, and alerts.\n• **Markets:** Live stock quotes, favorites, charts, and portfolio holdings.\n• **Financial (Mobile) / Markets (Computer):** Official interest rates, macro outlook, and financial news.\n• **Settings (top-right gear icon):** Profile, password, **Start Tutorial**, and **Log out**.${tutorialReminder}`;
  }

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

  if (q.includes('insurance') || q.includes('deductible') || q.includes('policy')) {
    return `### Insurance Guidance for Your Budget\n\n• **Health Insurance:** If you rarely visit doctors, a High-Deductible Health Plan (HDHP) with a Health Savings Account (HSA) often yields the lowest total annual cost. If you manage recurring prescriptions or treatments, a PPO or Gold plan with lower deductibles protects cash flow.\n• **Auto Insurance:** Recommend at least **100k/300k/100k** liability coverage. Align your collision deductible ($500 vs $1,000) with your Emergency Fund buffer.\n• **Renters/Homeowners:** Essential protection. Renters insurance typically costs just $12–$20/month and covers full replacement cost of electronics and furniture.\n• **Term Life:** Recommend 20–30 year Level Term Life for 10–12× your annual income ($${(snapshot.summary.totalIncome * 12 * 10).toLocaleString()}) to protect dependents cheaply.\n\n*Review your Bills category to verify monthly premium allocations.*`;
  }

  if (q.includes('buy') || q.includes('purchase') || q.includes('car') || q.includes('vacation')) {
    const leftToBudget = snapshot.summary.leftToBudget || 0;
    return `### Purchase Budgeting & Sinking Fund Blueprint\n\n1. **Define Target & Deadline:** Divide the estimated purchase price by the number of months until you need it to determine your monthly savings target.\n2. **Current Cash Margin:** You currently have **$${leftToBudget.toFixed(2)}** unallocated (Left to Budget) in this cycle.\n3. **Category Trimming:** Look at discretionary categories like *Dining Out* or *Entertainment* to reallocate an extra $100–$250/mo.\n4. **Factor Total Cost of Ownership:** Remember secondary ongoing expenses like insurance, taxes, fuel, or upkeep.\n5. **Sinking Fund Envelope:** Create a dedicated ARCA category envelope with rollover enabled so your monthly savings automatically accumulate.`;
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
