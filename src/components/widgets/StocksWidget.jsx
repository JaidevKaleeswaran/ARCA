import { ArrowUpRight, Plus, Star } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function StocksWidget({ onNavigateToMarkets }) {
  const {
    investments = [],
    watchlist = [],
    portfolioCurrentValue = 0,
    portfolioTotalInvested = 0,
    portfolioTotalGain = 0,
    portfolioTotalGainPercent = 0,
  } = useBudget();

  const isPos = portfolioTotalGain >= 0;
  const ownedSet = new Set(investments.map((i) => i.symbol?.toUpperCase()));
  const favoriteOnly = watchlist.filter((w) => !ownedSet.has(w.symbol?.toUpperCase()));
  const totalTracked = investments.length + favoriteOnly.length;

  return (
    <section>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Stocks &amp; ETFs
          </h3>
          {totalTracked > 0 && (
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {totalTracked}
            </span>
          )}
        </div>

        {onNavigateToMarkets && (
          <button
            type="button"
            onClick={onNavigateToMarkets}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#E7B956] hover:underline cursor-pointer"
          >
            <span>Markets</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="border-t border-white/[0.08]">
        {totalTracked > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {investments.length > 0 && (
              <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
                <div className="py-3 pr-3">
                  <p className="text-[11px] text-zinc-500">Value</p>
                  <p className="mt-0.5 text-base font-semibold text-zinc-100 tabular-nums">
                    {formatCurrency(portfolioCurrentValue)}
                  </p>
                </div>
                <div className="py-3 px-3">
                  <p className="text-[11px] text-zinc-500">Cost</p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-300 tabular-nums">
                    {formatCurrency(portfolioTotalInvested)}
                  </p>
                </div>
                <div className="py-3 pl-3">
                  <p className="text-[11px] text-zinc-500">Return</p>
                  <p
                    className={`mt-0.5 text-sm font-medium tabular-nums ${
                      isPos ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {portfolioTotalGainPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            <div className="divide-y divide-white/[0.05]">
              {investments.slice(0, 5).map((inv) => {
                const gain = Number(inv.unrealizedGain) || 0;
                const gainPos = gain >= 0;
                return (
                  <div
                    key={inv.id || inv.symbol}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-zinc-100">{inv.symbol}</span>
                      <span className="text-zinc-500 tabular-nums">
                        {Number(inv.shares || 0).toFixed(2)} sh
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 tabular-nums">
                      <span className="font-medium text-zinc-200">
                        {formatCurrency(inv.currentValue)}
                      </span>
                      <span
                        className={`text-[11px] ${
                          gainPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {gainPos ? '+' : ''}
                        {formatCurrency(gain)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {favoriteOnly.slice(0, Math.max(2, 5 - investments.length)).map((fav) => {
                const changePct = Number(fav.changePercent) || 0;
                const favPos = changePct >= 0;
                return (
                  <div
                    key={`fav_${fav.symbol}`}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Star
                        className="h-3 w-3 shrink-0 fill-[#E7B956] text-[#E7B956]"
                        strokeWidth={1.75}
                      />
                      <span className="font-semibold text-zinc-100">{fav.symbol}</span>
                      <span className="truncate max-w-[110px] text-[11px] text-zinc-500">
                        {fav.name}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 tabular-nums shrink-0">
                      <span className="font-medium text-zinc-200">
                        ${Number(fav.price || 0).toFixed(2)}
                      </span>
                      <span
                        className={`text-[11px] ${
                          favPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {favPos ? '+' : ''}
                        {changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 py-4">
            <p className="text-xs text-zinc-500">No favorited or held stocks yet</p>
            {onNavigateToMarkets && (
              <button
                type="button"
                onClick={onNavigateToMarkets}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/[0.1] px-3.5 text-xs font-medium text-zinc-200 hover:border-[#E7B956]/50 hover:text-[#E7B956] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span>Browse markets</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
