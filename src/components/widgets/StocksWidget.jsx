import { TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import SpotlightCard from '../ui/reactbits/SpotlightCard';

export default function StocksWidget({ onNavigateToMarkets }) {
  const {
    investments = [],
    portfolioCurrentValue = 0,
    portfolioTotalInvested = 0,
    portfolioTotalGain = 0,
    portfolioTotalGainPercent = 0,
  } = useBudget();

  const isPos = portfolioTotalGain >= 0;

  return (
    <SpotlightCard className="p-4 sm:p-5 shadow-md flex flex-col justify-between space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-accent/15 border border-accent/30 rounded-xl text-accent">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Stocks
              </h3>
              <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.2 rounded-full border border-accent/20">
                Live
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Equity & ETF Portfolio Value
            </p>
          </div>
        </div>

        {onNavigateToMarkets && (
          <button
            type="button"
            onClick={onNavigateToMarkets}
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Markets</span>
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>

      {/* Main Numbers */}
      {investments.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">Total Portfolio Value</span>
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {formatCurrency(portfolioCurrentValue)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block">Total Return</span>
              <span className={`text-xs sm:text-sm font-extrabold font-mono flex items-center justify-end gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{isPos ? '+' : ''}{formatCurrency(portfolioTotalGain)}</span>
                <span>({isPos ? '+' : ''}{portfolioTotalGainPercent.toFixed(2)}%)</span>
              </span>
            </div>
          </div>

          <div className="bg-[#141412] border border-border/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px]">Cost Basis</span>
              <span className="font-mono font-bold text-zinc-300">
                {formatCurrency(portfolioTotalInvested)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px]">Holdings Count</span>
              <span className="font-mono font-bold text-accent">
                {investments.length} Assets
              </span>
            </div>
          </div>

          {/* Top 3 Holdings Preview */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Holdings Breakdown
            </span>
            <div className="space-y-1.5">
              {investments.slice(0, 4).map((inv) => {
                const gain = Number(inv.unrealizedGain) || 0;
                const gainPos = gain >= 0;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-card border border-border/50 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white mr-1.5">{inv.symbol}</span>
                      <span className="text-zinc-500 text-[11px] font-mono">{inv.shares} sh</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-zinc-200 mr-2">
                        {formatCurrency(inv.currentValue)}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold ${gainPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {gainPos ? '+' : ''}{formatCurrency(gain)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-5 px-3 text-center rounded-xl bg-primary border border-dashed border-border/80 flex flex-col items-center justify-center space-y-2">
          <PieChart size={24} className="text-accent/60" />
          <p className="text-xs font-semibold text-zinc-300">
            No stocks added yet.
          </p>
          <p className="text-[11px] text-zinc-500 max-w-[200px]">
            Invest in equities on the Markets tab to track your portfolio here.
          </p>
          {onNavigateToMarkets && (
            <button
              type="button"
              onClick={onNavigateToMarkets}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Browse Markets</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Link */}
      {onNavigateToMarkets && investments.length > 0 && (
        <button
          type="button"
          onClick={onNavigateToMarkets}
          className="w-full py-2 bg-[#1b1916] hover:bg-[#22201c] text-zinc-300 hover:text-white border border-border rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Manage Stocks in Markets Tab</span>
          <ArrowUpRight size={13} className="text-accent" />
        </button>
      )}
    </SpotlightCard>
  );
}
