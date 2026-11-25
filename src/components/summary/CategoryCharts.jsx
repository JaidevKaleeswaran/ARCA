import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCyclePaceMetrics } from '../../utils/cycleUtils';

/**
 * Open borderless Category Velocity Bars directly on obsidian black.
 */
export default function CategoryCharts() {
  const { categories, categorySpending, cycleStartDate, cycleFrequency } = useBudget();
  const pace = getCyclePaceMetrics(cycleStartDate, cycleFrequency);

  const sorted = [...categories].sort((a, b) => {
    const pctA = Number(a.limit) > 0 ? (categorySpending[a.id] || 0) / Number(a.limit) : 0;
    const pctB = Number(b.limit) > 0 ? (categorySpending[b.id] || 0) / Number(b.limit) : 0;
    return pctB - pctA;
  });

  return (
    <section>
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Category Velocity
        </h2>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 tabular-nums">
          <span className="inline-block h-2.5 w-px bg-[#E7B956]/80" />
          <span>{pace.pacePct}% pace</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="border-t border-white/[0.08] py-10 text-center text-xs text-zinc-500">
          No categories yet
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
          {sorted.map((category) => {
            const spent = categorySpending[category.id] || 0;
            const limit = Number(category.limit) || 0;
            const remaining = limit - spent;
            const pct = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
            const isOver = remaining < 0;
            const accentHex = category.color || '#e4e4e7';
            const barHex = isOver ? '#f43f5e' : accentHex;

            return (
              <div key={category.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: accentHex }}
                    />
                    <span className="truncate text-sm font-medium text-zinc-100">
                      {category.name}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium tabular-nums ${
                      isOver ? 'text-rose-400' : 'text-zinc-300'
                    }`}
                  >
                    {isOver
                      ? `${formatCurrency(Math.abs(remaining))} over`
                      : `${formatCurrency(remaining)} left`}
                  </span>
                </div>

                <div className="relative mt-2 h-1.5 w-full rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barHex }}
                  />
                  <div
                    className="absolute -top-0.5 h-2.5 w-px bg-[#E7B956]/70"
                    style={{ left: `${pace.pacePct}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                  <span>
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
