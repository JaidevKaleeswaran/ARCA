import React from 'react';
import { TrendingUp, DollarSign, PieChart, CreditCard, Landmark, LineChart } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Detect recurring subscriptions from transactions (replaces RAG tool)
 */
function detectSubscriptions(transactions) {
  const subKeywords = /netflix|spotify|equinox|gym|icloud|apple|hulu|disney|prime|amazon prime|utility|internet|wifi|youtube|hbo|paramount|subscription/i;

  const subMap = new Map();
  (transactions || []).forEach(tx => {
    const desc = tx.description || '';
    if (tx.recurring || subKeywords.test(desc)) {
      if (!subMap.has(desc)) {
        subMap.set(desc, { name: desc, amount: Number(tx.amount) || 0 });
      }
    }
  });

  const subs = Array.from(subMap.values());
  const monthlyTotal = subs.reduce((sum, s) => sum + s.amount, 0);

  return {
    count: subs.length,
    monthlyTotal,
    formattedMonthlyTotal: formatCurrency(monthlyTotal),
    subscriptions: subs,
  };
}

export default function FinancialHealthCards() {
  const budgetState = useBudget();

  const subscriptions = detectSubscriptions(budgetState.transactions);

  const totalIncome = budgetState.totalIncome || 0;
  const totalSpent = budgetState.totalSpent || 0;
  const netCashFlow = totalIncome - totalSpent;
  const portfolioCurrentValue = budgetState.portfolioCurrentValue || 0;
  const portfolioTotalGain = budgetState.portfolioTotalGain || 0;
  const portfolioTotalGainPercent = budgetState.portfolioTotalGainPercent || 0;
  const investmentsCount = (budgetState.investments || []).length;
  const netWorth = netCashFlow + portfolioCurrentValue;
  const savingsRatePct = totalIncome > 0 ? `${((netCashFlow / totalIncome) * 100).toFixed(1)}%` : '0%';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* 1. Total Income */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-text-muted">Total Income</p>
          <p className="text-xl font-bold text-[#3a7056] mt-1 font-mono">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Cycle Inflow</p>
        </div>
        <div className="p-3 bg-[#2e5b45]/15 rounded-lg text-[#3a7056]">
          <TrendingUp size={20} />
        </div>
      </div>

      {/* 2. Net Cash Flow */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-text-muted">Net Cash Flow</p>
          <p className={`text-xl font-bold mt-1 font-mono ${netCashFlow < 0 ? 'text-red-400' : 'text-accent'}`}>
            {formatCurrency(netCashFlow)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Income - Total Spent</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-accent">
          <DollarSign size={20} />
        </div>
      </div>

      {/* 3. Stock Portfolio Value */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-text-muted">Stock Portfolio</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">
            {formatCurrency(portfolioCurrentValue)}
          </p>
          <p className={`text-[11px] font-mono mt-0.5 ${portfolioTotalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {investmentsCount > 0
              ? `${portfolioTotalGain >= 0 ? '+' : ''}${portfolioTotalGainPercent.toFixed(1)}% (${investmentsCount} stocks)`
              : '0 Holdings'}
          </p>
        </div>
        <div className="p-3 bg-accent/15 rounded-lg text-accent">
          <LineChart size={20} />
        </div>
      </div>

      {/* 4. Estimated Net Worth */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-text-muted">Total Net Worth</p>
          <p className={`text-xl font-bold mt-1 font-mono ${netWorth < 0 ? 'text-red-400' : 'text-accent'}`}>
            {formatCurrency(netWorth)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Cash + Stock Assets</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-accent">
          <Landmark size={20} />
        </div>
      </div>

      {/* 5. Active Subscriptions */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-medium text-text-muted">Subscriptions</p>
          <p className="text-xl font-bold text-accent mt-1 font-mono">
            {subscriptions.formattedMonthlyTotal}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{subscriptions.count} Services</p>
        </div>
        <div className="p-3 bg-accent/10 rounded-lg text-accent">
          <CreditCard size={20} />
        </div>
      </div>
    </div>
  );
}
