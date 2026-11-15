import { describe, it, expect } from 'vitest';
import { buildFinancialSnapshot } from '../../src/services/agents/managerAgent.js';

describe('Manager Agent — Financial Snapshot Construction', () => {
  const mockBudgetState = {
    categories: [
      { id: '1', name: 'Bills', limit: 1200, color: '#e7b956' },
      { id: '2', name: 'Groceries', limit: 600, color: '#2e5b45' },
    ],
    transactions: [
      { id: 'tx-1', description: 'Whole Foods', amount: 85.50, categoryId: '2', date: '2026-11-05' },
      { id: 'tx-2', description: 'Electric Utility', amount: 120.00, categoryId: '1', date: '2026-11-08' },
    ],
    incomeSources: [
      { id: 'inc-1', name: 'Salary', amount: 5000, frequency: 'monthly', type: 'Salary' },
    ],
    investments: [
      { symbol: 'SPY', shares: 5, avgCost: 500 },
    ],
    totalIncome: 5000,
    totalSpent: 205.50,
    totalAllocated: 1800,
    leftToBudget: 3200,
    categorySpending: { '1': 120.00, '2': 85.50 },
    portfolioCurrentValue: 2800,
    portfolioTotalInvested: 2500,
  };

  it('buildFinancialSnapshot compiles complete categories, transactions, and holdings', () => {
    const snapshot = buildFinancialSnapshot(mockBudgetState);

    expect(snapshot).toHaveProperty('summary');
    expect(snapshot).toHaveProperty('categoryBreakdown');
    expect(snapshot).toHaveProperty('recentTransactions');
    expect(snapshot).toHaveProperty('topMerchants');
    expect(snapshot).toHaveProperty('portfolio');
    expect(snapshot.portfolio.holdingsCount).toBe(1);
    expect(snapshot.portfolio.holdings[0].symbol).toBe('SPY');
    expect(snapshot.categoryBreakdown.length).toBe(2);
    expect(snapshot.categoryBreakdown[0].spent).toBe(120.00);
    expect(snapshot.categoryBreakdown[0].remaining).toBe(1080.00);

    // Verify recent transactions mapped
    expect(snapshot.recentTransactions.length).toBe(2);
    expect(snapshot.recentTransactions[0].description).toBe('Electric Utility');
    expect(snapshot.recentTransactions[0].category).toBe('Bills');
  });

  it('buildFinancialSnapshot handles empty state gracefully without throwing', () => {
    const emptySnapshot = buildFinancialSnapshot({});
    expect(emptySnapshot).toHaveProperty('categoryBreakdown');
    expect(emptySnapshot.categoryBreakdown).toEqual([]);
    expect(emptySnapshot.recentTransactions).toEqual([]);
  });
});
