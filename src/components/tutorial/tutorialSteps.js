export const TUTORIAL_STEPS = {
  home: [
    {
      id: 'income-source-add',
      targetSelector: '[data-tutorial="income-source-add"]',
      fallbackSelector: '[data-tutorial="income-card"]',
      title: 'Add Income Sources',
      description: 'Tap here to add income streams — salary, freelance, investments, or any money you earn.',
    },
    {
      id: 'salary-set',
      targetSelector: '[data-tutorial="salary-set"]',
      fallbackSelector: '[data-tutorial="income-card"]',
      title: 'Set Base Salary',
      description: 'Configure your primary base salary. ARCA uses this as the foundation to build your budget.',
    },
    {
      id: 'cycle-frequency',
      targetSelector: '[data-tutorial="cycle-frequency"]',
      title: 'Budget Cycle Frequency',
      description: 'Select how often your pay cycle runs (weekly, bi-weekly, or monthly). ARCA aligns all calculations to this frequency.',
    },
    {
      id: 'budget-banner',
      targetSelector: '[data-tutorial="budget-banner"]',
      fallbackSelector: '[data-tutorial="category-section"]',
      title: 'Zero-Based Budgeting Banner',
      description: 'Shows unallocated income in real time. Your goal is to give every single dollar a job until it reaches $0.',
    },
    {
      id: 'quick-fill',
      targetSelector: '[data-tutorial="quick-fill"]',
      title: 'Quick-Fill Templates',
      description: 'Not sure how to allocate? Quick-Fill applies proven frameworks (e.g. 50/30/20, Student, Aggressive Saver) in one tap.',
    },
    {
      id: 'category-add',
      targetSelector: '[data-tutorial="category-add"]',
      title: 'Add Category Envelope',
      description: 'Create expenditure envelopes (Housing, Groceries, Dining) with custom spending limits and cycle rollover actions.',
    },
    {
      id: 'tab-nav',
      targetSelector: '[data-tutorial="tab-nav"]',
      title: 'Explore Other Tabs',
      description: 'Switch between Home, AI Assistant, Summary analytics, and Expenses tracking whenever you need.',
    },
  ],

  assistant: [
    {
      id: 'ai-header-tools',
      targetSelector: '[data-tutorial="ai-header-tools"]',
      title: 'AI Multi-Agent Tools',
      description: 'Access Voice Receipts, camera Receipt Scanning, and audit logs managed by specialized AI agent pipelines.',
    },
    {
      id: 'ai-quick-questions',
      targetSelector: '[data-tutorial="ai-quick-questions"]',
      title: 'Quick Questions',
      description: 'One-click prompts for immediate answers about your budget status, recent spending, or savings strategies.',
    },
    {
      id: 'ai-voice-mic',
      targetSelector: '[data-tutorial="ai-voice-mic"]',
      title: 'Voice Prompting',
      description: 'Click to speak your questions out loud. ARCA transcribes and answers using your actual financial records.',
    },
    {
      id: 'ai-input-bar',
      targetSelector: '[data-tutorial="ai-input-bar"]',
      title: 'Financial Chat Assistant',
      description: 'Ask anything in natural language about transactions, category balances, or advice on meeting your budget goals.',
    },
  ],

  markets: [
    {
      id: 'market-header-status',
      targetSelector: '[data-tutorial="market-header-status"]',
      title: 'Market Status & Overview',
      description: 'Check whether regular trading sessions are active, view timestamped updates, and refresh rates with a single click.',
    },
    {
      id: 'market-indices-grid',
      targetSelector: '[data-tutorial="market-indices-grid"]',
      title: 'Major Indices & Stock Movers',
      description: 'Track broad market performance across the S&P 500, Nasdaq, Dow Jones, and top mega-cap equities.',
    },
    {
      id: 'market-rates-panel',
      targetSelector: '[data-tutorial="market-rates-panel"]',
      title: 'Borrowing Rates & HYSA Yields',
      description: 'Monitor Federal Reserve benchmark rates, 30-year mortgage rates, and high-yield savings APYs directly impacting your budget.',
    },
    {
      id: 'market-ai-digest',
      targetSelector: '[data-tutorial="market-ai-digest"]',
      title: 'AI Macroeconomic Briefing',
      description: 'Synthesize real-time monetary policy, labor reports, and CPI inflation trends with Gemini AI.',
    },
    {
      id: 'market-budget-impact',
      targetSelector: '[data-tutorial="market-budget-impact"]',
      title: 'Actionable Budget Playbook',
      description: 'Direct zero-based recommendations on how current market conditions should adjust your debt repayment and cash buffers.',
    },
  ],

  summary: [
    {
      id: 'summary-health-cards',
      targetSelector: '[data-tutorial="summary-health-cards"]',
      title: 'Financial Health Cards',
      description: 'View your net worth, cash flow velocity, savings rate, and active recurring subscriptions at a glance.',
    },
    {
      id: 'summary-balance-chart',
      targetSelector: '[data-tutorial="summary-balance-chart"]',
      title: 'Master Balance Allocation',
      description: 'Interactive visualization comparing total income against allocated category envelopes and leftover buffers.',
    },
    {
      id: 'summary-category-charts',
      targetSelector: '[data-tutorial="summary-category-charts"]',
      title: 'Category Breakdown',
      description: 'Deep-dive into each individual envelope to analyze planned limits versus actual money spent.',
    },
    {
      id: 'summary-notifications',
      targetSelector: '[data-tutorial="summary-notifications"]',
      title: 'Alerts & Cycle Hub',
      description: 'Real-time notifications for upcoming pay cycles, rollover triggers, and over-budget warnings.',
    },
  ],

  transactions: [
    {
      id: 'expense-add-btn',
      targetSelector: '[data-tutorial="expense-add-btn"]',
      title: 'Add Expense',
      description: 'Quickly log a manual transaction with date, category envelope, amount, and custom notes.',
    },
    {
      id: 'expense-speak-btn',
      targetSelector: '[data-tutorial="expense-speak-btn"]',
      title: 'Speak Receipt',
      description: 'Dictate transactions hands-free (e.g., "Paid $12.50 for lunch"). The AI agent automatically categorizes and logs it.',
    },
    {
      id: 'expense-scan-btn',
      targetSelector: '[data-tutorial="expense-scan-btn"]',
      title: 'Scan Receipt Photo',
      description: 'Upload or capture receipts using your camera. OCR and AI extract merchant names, line items, and taxes automatically.',
    },
    {
      id: 'expense-table',
      targetSelector: '[data-tutorial="expense-table"]',
      title: 'Transaction Ledger & Heuristics',
      description: 'Complete history of expenses. ARCA continuously flags suspicious duplicates and abnormal category spending.',
    },
  ],
};
