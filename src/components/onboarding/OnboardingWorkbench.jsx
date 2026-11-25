import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import ScrollFade from './ScrollFade';
import PaceArc from '../ui/PaceArc';

const INCOME_PRESETS = [3200, 4200, 5600];

const CATEGORY_TEMPLATES = [
  { id: 'housing', name: 'Housing & Utilities', weight: 0.48, spentRatio: 0.96 },
  { id: 'groceries', name: 'Groceries', weight: 0.16, spentRatio: 0.81 },
  { id: 'dining', name: 'Dining & Coffee', weight: 0.08, spentRatio: 1.12 },
  { id: 'savings', name: 'Savings & Reserve', weight: 0.28, spentRatio: 0.62 },
];

const SAMPLE_TRANSACTIONS = [
  { id: 't1', merchant: 'Trader Joe’s', categoryId: 'groceries', date: 'Nov 23', amount: -84.32 },
  { id: 't2', merchant: 'Blue Bottle Coffee', categoryId: 'dining', date: 'Nov 23', amount: -6.75 },
  { id: 't3', merchant: 'Stripe Payroll', categoryId: 'income', date: 'Nov 21', amount: 2100.0 },
  { id: 't4', merchant: 'Avalon Residential', categoryId: 'housing', date: 'Nov 15', amount: -2016.0 },
];

const formatUSD = (value, showSign = false, alwaysCents = false) => {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: alwaysCents ? 2 : abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (showSign && value > 0) return `+${formatted}`;
  if (showSign && value < 0) return `-${formatted}`;
  return formatted;
};

/**
 * Minimal, open hairline preview directly on ARCA's obsidian canvas.
 */
export default function OnboardingWorkbench() {
  const [income, setIncome] = useState(4200);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const dayOfMonth = 23;
  const daysInMonth = 30;
  const monthPacePct = Math.round((dayOfMonth / daysInMonth) * 100);
  const daysLeft = daysInMonth - dayOfMonth;

  const categories = useMemo(() => {
    const initial = CATEGORY_TEMPLATES.slice(0, -1).map((tpl) => {
      const budget = Math.round((income * tpl.weight) / 10) * 10;
      return {
        id: tpl.id,
        name: tpl.name,
        budget,
        spent: Number((budget * tpl.spentRatio).toFixed(2)),
      };
    });
    const assignedSoFar = initial.reduce((sum, c) => sum + c.budget, 0);
    const lastTpl = CATEGORY_TEMPLATES[CATEGORY_TEMPLATES.length - 1];
    const lastBudget = Math.max(0, income - assignedSoFar);
    return [
      ...initial,
      {
        id: lastTpl.id,
        name: lastTpl.name,
        budget: lastBudget,
        spent: Number((lastBudget * lastTpl.spentRatio).toFixed(2)),
      },
    ];
  }, [income]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const totals = useMemo(() => {
    const budget = categories.reduce((acc, c) => acc + c.budget, 0);
    const spent = categories.reduce((acc, c) => acc + c.spent, 0);
    const remaining = budget - spent;
    return {
      budget,
      spent,
      remaining,
      spentPct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    };
  }, [categories]);

  const filteredTx = useMemo(() => {
    if (!selectedCategory) return SAMPLE_TRANSACTIONS;
    return SAMPLE_TRANSACTIONS.filter((tx) => tx.categoryId === selectedCategory);
  }, [selectedCategory]);

  return (
    <section aria-label="Interactive ARCA ledger preview" className="mx-auto max-w-5xl px-5 sm:px-8">
      {/* Top Control Line + Summary Strip */}
      <ScrollFade delay={60}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-medium text-zinc-100">November</span>
            <span className="text-xs text-zinc-500 tabular-nums">
              Day {dayOfMonth}/{daysInMonth}
            </span>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-[#111110] p-0.5 text-xs">
            {INCOME_PRESETS.map((preset) => {
              const active = income === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setIncome(preset)}
                  className={`rounded-full px-3 py-1 tabular-nums transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#E7B956] text-[#090908] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {formatUSD(preset)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Open Hairline Summary Band + Semicircular Pace Arc */}
        <div className="grid grid-cols-1 divide-y divide-white/[0.08] border-y border-white/[0.08] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-between gap-4 py-5 sm:col-span-2 sm:pr-6">
            <div>
              <p className="text-xs text-zinc-500">Left to spend</p>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
                  {formatUSD(totals.remaining)}
                </span>
                <span className="text-xs text-zinc-500 tabular-nums">
                  / {formatUSD(totals.budget)}
                </span>
              </div>
            </div>
            <PaceArc
              spentPct={totals.spentPct}
              pacePct={monthPacePct}
              isOver={totals.remaining < 0}
              size={64}
            />
          </div>

          <div className="py-5 sm:px-6">
            <p className="text-xs text-zinc-500">Spent</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
                {formatUSD(totals.spent)}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">{totals.spentPct}%</span>
            </div>
          </div>

          <div className="py-5 sm:pl-6">
            <p className="text-xs text-zinc-500">Daily safe</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
                {formatUSD(Math.max(0, totals.remaining / daysLeft))}
              </span>
              <span className="text-xs text-zinc-500">/ day</span>
            </div>
          </div>
        </div>
      </ScrollFade>

      {/* Open Two-Column Ledger Layout (Zero Outer Box Clutter) */}
      <div className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-12 lg:gap-12">
        <ScrollFade delay={80} className="lg:col-span-5">
          <div className="flex items-center justify-between pb-3 text-[11px] uppercase tracking-wider text-zinc-500">
            <span>Categories</span>
            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal tabular-nums">
              <span className="inline-block h-2.5 w-px bg-[#E7B956]/80" />
              {monthPacePct}% pace
            </span>
          </div>

          <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
            {categories.map((cat) => {
              const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
              const remaining = cat.budget - cat.spent;
              const isOver = remaining < 0;
              const isNear = !isOver && pct >= 85;
              const isSelected = selectedCategory === cat.id;

              const barColor = isOver
                ? 'bg-rose-500'
                : isNear
                ? 'bg-[#E7B956]'
                : 'bg-zinc-200';

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`w-full py-3.5 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/[0.04] -mx-2.5 px-2.5 rounded-lg' : 'hover:opacity-90'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        isOver ? 'text-rose-400' : 'text-zinc-300'
                      }`}
                    >
                      {isOver
                        ? `${formatUSD(Math.abs(remaining))} over`
                        : `${formatUSD(remaining)} left`}
                    </span>
                  </div>

                  <div className="relative mt-2 h-1.5 w-full rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                    <div
                      className="absolute -top-0.5 h-2.5 w-px bg-[#E7B956]/70"
                      style={{ left: `${monthPacePct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollFade>

        <ScrollFade delay={140} className="lg:col-span-7">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">Ledger</span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-white/[0.14] cursor-pointer"
                >
                  {categoryMap[selectedCategory]}
                  <X className="h-3 w-3" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/[0.08]">
            <table className="w-full border-collapse text-left">
              <tbody className="divide-y divide-white/[0.06] text-sm">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td className="py-8 text-center text-xs text-zinc-500">No entries</td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => {
                    const isIncome = tx.amount > 0;
                    const catLabel =
                      tx.categoryId === 'income'
                        ? 'Income'
                        : categoryMap[tx.categoryId] ?? 'Other';

                    return (
                      <tr key={tx.id} className="transition-colors hover:bg-white/[0.025]">
                        <td className="py-3 pr-3 font-medium text-zinc-200">{tx.merchant}</td>
                        <td className="hidden sm:table-cell px-3 py-3">
                          <span className="text-xs text-zinc-500">{catLabel}</span>
                        </td>
                        <td className="px-3 py-3 text-xs text-zinc-500 tabular-nums whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3 pl-3 text-right font-medium tabular-nums whitespace-nowrap">
                          <span className={isIncome ? 'text-emerald-400' : 'text-zinc-100'}>
                            {isIncome
                              ? formatUSD(tx.amount, true, true)
                              : formatUSD(Math.abs(tx.amount), false, true)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ScrollFade>
      </div>
    </section>
  );
}
