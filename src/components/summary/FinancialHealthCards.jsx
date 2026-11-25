import React from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';

function detectSubscriptions(transactions) {
  const subKeywords =
    /netflix|spotify|equinox|gym|icloud|apple|hulu|disney|prime|amazon prime|utility|internet|wifi|youtube|hbo|paramount|subscription/i;

  const subMap = new Map();
  (transactions || []).forEach((tx) => {
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
    formattedMonthlyTotal: formatCurrency(monthlyTotal),
  };
}

/**
 * Open hairline 5-metric band directly on obsidian canvas (zero box walls or subtext clutter).
 */
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

  return (
    <section className="grid grid-cols-2 divide-y divide-white/[0.08] border-y border-white/[0.08] sm:grid-cols-5 sm:divide-x sm:divide-y-0">
      <div className="col-span-2 py-4 sm:col-span-1 sm:pr-5">
        <p className="text-xs text-zinc-500">Net worth</p>
        <p
          className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${
            netWorth < 0 ? 'text-rose-400' : 'text-zinc-100'
          }`}
        >
          {formatCurrency(netWorth)}
        </p>
      </div>

      <div className="py-4 pr-4 sm:px-5">
        <p className="text-xs text-zinc-500">Income</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
          {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="border-l border-white/[0.08] py-4 pl-4 sm:border-l-0 sm:px-5">
        <p className="text-xs text-zinc-500">Cash flow</p>
        <p
          className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${
            netCashFlow < 0 ? 'text-rose-400' : 'text-[#E7B956]'
          }`}
        >
          {formatCurrency(netCashFlow)}
        </p>
      </div>

      <div className="py-4 pr-4 sm:px-5">
        <p className="text-xs text-zinc-500">Portfolio</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
            {formatCurrency(portfolioCurrentValue)}
          </span>
          {investmentsCount > 0 && (
            <span
              className={`text-[11px] tabular-nums ${
                portfolioTotalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {portfolioTotalGain >= 0 ? '+' : ''}
              {portfolioTotalGainPercent.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="border-l border-white/[0.08] py-4 pl-4 sm:border-l-0 sm:pl-5">
        <p className="text-xs text-zinc-500">Subscriptions</p>
        <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
          {subscriptions.formattedMonthlyTotal}
        </p>
      </div>
    </section>
  );
}
