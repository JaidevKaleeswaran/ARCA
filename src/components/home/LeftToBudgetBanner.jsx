import { Plus } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCyclePaceMetrics } from '../../utils/cycleUtils';
import PaceArc from '../ui/PaceArc';

export default function LeftToBudgetBanner({ onAddExpense }) {
  const {
    totalIncome = 0,
    totalAllocated = 0,
    totalSpent = 0,
    leftToBudget = 0,
    categories = [],
    categorySpending = {},
    cycleStartDate,
    cycleFrequency,
  } = useBudget();

  const pace = getCyclePaceMetrics(cycleStartDate, cycleFrequency);
  const effectiveBudget = totalAllocated > 0 ? totalAllocated : totalIncome;
  const remainingToSpend = effectiveBudget - totalSpent;
  const spentPct = effectiveBudget > 0 ? Math.round((totalSpent / effectiveBudget) * 100) : 0;
  const dailySafeSpend = Math.max(0, remainingToSpend / pace.daysRemaining);

  const barDenom = Math.max(effectiveBudget, totalSpent, 1);
  const spentSegments = categories
    .map((cat) => ({
      id: cat.id,
      color: cat.color || '#e7b956',
      spent: Number(categorySpending[cat.id]) || 0,
    }))
    .filter((seg) => seg.spent > 0);

  return (
    <div data-tutorial="budget-banner" className="mb-6 md:mb-8">
      {/* Mobile Centered & Separate Hero Card */}
      <div className="md:hidden rounded-3xl border border-white/[0.1] bg-[#131311] px-5 py-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-3.5 py-1 text-xs font-medium text-[#E7B956]">
          <span>{pace.periodLabel}</span>
        </div>

        <p className="mt-3.5 text-xs font-medium tracking-wide text-zinc-400">
          Left to Spend
        </p>

        <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 tabular-nums">
          <span
            className={`text-3xl font-extrabold tracking-tight ${
              remainingToSpend < 0 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {remainingToSpend < 0
              ? `-${formatCurrency(Math.abs(remainingToSpend))}`
              : formatCurrency(remainingToSpend)}
          </span>
          <span className="text-2xl font-bold tracking-tight text-zinc-400">
            / {formatCurrency(effectiveBudget)}
          </span>
        </div>

        <div className="mt-5 flex h-3.5 w-full overflow-hidden rounded-xl bg-white/[0.08] gap-[2px]">
          {spentSegments.length > 0 ? (
            spentSegments.map((seg) => (
              <div
                key={seg.id}
                className="h-full first:rounded-l-xl last:rounded-r-xl transition-all duration-300"
                style={{
                  width: `${Math.max(2, (seg.spent / barDenom) * 100)}%`,
                  backgroundColor: seg.color,
                }}
              />
            ))
          ) : totalSpent > 0 ? (
            <div
              className="h-full rounded-xl bg-[#E7B956] transition-all duration-300"
              style={{ width: `${Math.min(100, (totalSpent / barDenom) * 100)}%` }}
            />
          ) : null}
        </div>
      </div>

      {/* Desktop Open Hairline Summary Band + Semicircular PaceArc */}
      <div className="hidden md:block space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100 truncate">
              {pace.periodLabel}
            </h1>
            <span className="text-xs text-zinc-500 tabular-nums shrink-0">
              Day {pace.dayOfCycle}/{pace.daysInCycle}
            </span>
          </div>

          {onAddExpense && (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#E7B956] px-4 text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Add expense</span>
            </button>
          )}
        </div>

        <section className="grid grid-cols-2 divide-y divide-white/[0.08] border-y border-white/[0.08] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="col-span-2 flex items-center justify-between gap-4 py-4 sm:py-5 sm:pr-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <p className="text-xs text-zinc-500">Left to spend</p>
                {totalIncome > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                      leftToBudget === 0
                        ? 'bg-[#E7B956]/15 text-[#E7B956]'
                        : leftToBudget > 0
                        ? 'bg-white/[0.06] text-zinc-400'
                        : 'bg-rose-500/15 text-rose-400'
                    }`}
                  >
                    {leftToBudget === 0
                      ? 'Balanced'
                      : leftToBudget > 0
                      ? `${formatCurrency(leftToBudget)} unassigned`
                      : `${formatCurrency(Math.abs(leftToBudget))} over`}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
                    remainingToSpend < 0 ? 'text-rose-400' : 'text-zinc-100'
                  }`}
                >
                  {remainingToSpend < 0
                    ? `-${formatCurrency(Math.abs(remainingToSpend))}`
                    : formatCurrency(remainingToSpend)}
                </span>
                {effectiveBudget > 0 && (
                  <span className="text-xs text-zinc-500 tabular-nums">
                    / {formatCurrency(effectiveBudget)}
                  </span>
                )}
              </div>
            </div>

            <PaceArc
              spentPct={spentPct}
              pacePct={pace.pacePct}
              isOver={remainingToSpend < 0}
              size={64}
            />
          </div>

          <div className="py-3.5 pr-4 sm:py-5 sm:px-6">
            <p className="text-xs text-zinc-500">Spent</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
                {formatCurrency(totalSpent)}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">{spentPct}%</span>
            </div>
          </div>

          <div className="border-l border-white/[0.08] py-3.5 pl-4 sm:border-l-0 sm:py-5 sm:pl-6">
            <p className="text-xs text-zinc-500">Daily safe</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-semibold tracking-tight text-zinc-100 tabular-nums">
                {formatCurrency(dailySafeSpend)}
              </span>
              <span className="text-xs text-zinc-500">/ day</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
