import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCyclePaceMetrics } from '../../utils/cycleUtils';
import PaceArc from '../ui/PaceArc';

/**
 * Chamfered Cash Flow & Allocation instrument panel with semicircular PaceArc.
 */
export default function MainBalanceChart() {
  const {
    totalIncome = 0,
    totalAllocated = 0,
    totalSpent = 0,
    portfolioCurrentValue = 0,
    cycleStartDate,
    cycleFrequency,
  } = useBudget();

  const pace = getCyclePaceMetrics(cycleStartDate, cycleFrequency);
  const remaining = Math.max(0, totalIncome - totalSpent);
  const spentPct = totalIncome > 0 ? Math.min(100, (totalSpent / totalIncome) * 100) : 0;
  const allocatedPct = totalIncome > 0 ? Math.min(100, (totalAllocated / totalIncome) * 100) : 0;
  const totalAssets = remaining + portfolioCurrentValue;
  const cashShare = totalAssets > 0 ? (remaining / totalAssets) * 100 : 0;
  const equityShare = totalAssets > 0 ? (portfolioCurrentValue / totalAssets) * 100 : 0;

  return (
    <section className="arca-chamfer rounded-xl border border-white/[0.08] bg-[#111110]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Cash Flow
        </h2>
        <span className="text-[11px] text-zinc-500 tabular-nums">
          {Math.round(spentPct)}% spent
        </span>
      </div>

      {totalIncome === 0 && totalSpent === 0 && portfolioCurrentValue === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-zinc-500">No income set</div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <span className="text-xs text-zinc-500">Remaining cash</span>
              <p className="mt-1 text-2xl font-semibold text-zinc-100 tabular-nums">
                {formatCurrency(remaining)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                {formatCurrency(totalSpent)} / {formatCurrency(totalIncome)}
              </p>
            </div>
            <PaceArc
              spentPct={spentPct}
              pacePct={pace.pacePct}
              isOver={totalSpent > totalIncome}
              size={72}
            />
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-400">Assigned</span>
              <span className="font-medium text-zinc-200 tabular-nums">
                {formatCurrency(totalAllocated)} ({Math.round(allocatedPct)}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  totalAllocated > totalIncome ? 'bg-rose-500' : 'bg-[#E7B956]'
                }`}
                style={{ width: `${Math.min(100, allocatedPct)}%` }}
              />
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-400">Cash vs. stocks</span>
              <span className="font-medium text-zinc-200 tabular-nums">
                {formatCurrency(totalAssets)}
              </span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full bg-zinc-200 transition-all duration-300"
                style={{ width: `${cashShare}%` }}
              />
              <div
                className="h-full bg-[#E7B956] transition-all duration-300"
                style={{ width: `${equityShare}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
              <span>Cash {Math.round(cashShare)}%</span>
              <span>Stocks {Math.round(equityShare)}%</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
