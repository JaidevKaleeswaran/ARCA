/**
 * MCP Tool: calculate_budget_metrics
 * Performs deterministic arithmetic over user budget context without LLM mental math.
 */
export async function calculateBudgetMetrics({ category, startDate, endDate, metric = 'all' }, budgetContext = {}) {
  const transactions = budgetContext.transactions || budgetContext.recentTransactions || [];
  const categories = budgetContext.categories || [];
  const incomeSources = budgetContext.incomeSources || [];

  // Filter by category if provided
  let filtered = [...transactions];
  if (category && category.trim()) {
    const norm = category.trim().toLowerCase();
    const matchedCategory = categories.find(c => c.name.toLowerCase() === norm || c.id === category);
    const catId = matchedCategory ? matchedCategory.id : null;
    const catName = matchedCategory ? matchedCategory.name.toLowerCase() : norm;

    filtered = filtered.filter(tx => {
      const txCat = (tx.category || tx.categoryName || '').toLowerCase();
      return (catId && tx.categoryId === catId) || txCat === catName;
    });
  }

  // Filter by dates
  if (startDate) {
    filtered = filtered.filter(tx => tx.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(tx => tx.date <= endDate);
  }

  const count = filtered.length;
  const sum = Number(filtered.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0).toFixed(2));
  const average = count > 0 ? Number((sum / count).toFixed(2)) : 0;

  // Largest expense
  let largestExpense = null;
  if (count > 0) {
    const sorted = [...filtered].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    const top = sorted[0];
    largestExpense = {
      description: top.description || 'Expense',
      amount: Number(top.amount) || 0,
      date: top.date,
      category: top.category || top.categoryName || 'General',
    };
  }

  // Category breakdown
  const catTotals = {};
  filtered.forEach(tx => {
    const cName = tx.category || tx.categoryName || 'Other';
    catTotals[cName] = (catTotals[cName] || 0) + (Number(tx.amount) || 0);
  });

  const categoryBreakdown = Object.entries(catTotals).map(([name, catSum]) => ({
    category: name,
    total: Number(catSum.toFixed(2)),
    percentage: sum > 0 ? Number(((catSum / sum) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.total - a.total);

  // Net Cash Flow (Total Income - Total Spent)
  const totalIncome = Number((budgetContext.totalIncome ||
    incomeSources.reduce((acc, src) => acc + (Number(src.amount) || 0), 0) ||
    budgetContext.summary?.totalIncome || 0
  ).toFixed(2));

  const netCashflow = Number((totalIncome - sum).toFixed(2));

  const result = {
    filteredCount: count,
    totalSpent: sum,
    averagePerTransaction: average,
    largestExpense,
    categoryBreakdown,
    totalIncome,
    netCashflow,
  };

  switch (metric.toLowerCase()) {
    case 'sum':
    case 'total':
      return { totalSpent: sum, transactionCount: count };
    case 'average':
    case 'avg':
      return { averagePerTransaction: average, transactionCount: count, totalSpent: sum };
    case 'largest_expense':
    case 'max':
      return { largestExpense };
    case 'category_breakdown':
      return { categoryBreakdown, totalSpent: sum };
    case 'net_cashflow':
      return { totalIncome, totalSpent: sum, netCashflow };
    case 'all':
    default:
      return result;
  }
}
