import {
  ArrowUpRight, ArrowDownRight,
  Plus, ExternalLink, Trash2
} from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import NumberTicker from '../ui/reactbits/NumberTicker';
import { toast } from 'react-hot-toast';

export default function StockHoldingWidget({ holding, onNavigateToMarkets, onInvestMore }) {
  const { dispatch } = useBudget();

  if (!holding) return null;

  const currentPrice = Number(holding.currentPrice) || (holding.shares > 0 ? holding.currentValue / holding.shares : 0);
  const currentValue = Number(holding.currentValue) || (holding.shares * currentPrice);
  const investedAmount = Number(holding.investedAmount) || 0;
  const unrealizedGain = Number(holding.unrealizedGain) || (currentValue - investedAmount);
  const unrealizedGainPercent = investedAmount > 0
    ? Number(((unrealizedGain / investedAmount) * 100).toFixed(2))
    : Number(holding.unrealizedGainPercent) || 0;
  const isPos = unrealizedGain >= 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Remove ${holding.symbol} widget and holding from your portfolio?`)) {
      dispatch({ type: 'DELETE_INVESTMENT', payload: holding.id });
      toast.success(`Removed ${holding.symbol} widget.`);
    }
  };

  return (
    <div
      data-widget="stock-holding"
      data-symbol={holding.symbol}
      className="bg-card border border-border hover:border-accent/40 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between space-y-3.5 transition-colors group relative overflow-hidden"
    >
      {/* Clean status accent indicator on top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${isPos ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} />

      {/* Widget Header */}
      <div className="flex items-start justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 text-accent font-black flex items-center justify-center text-xs shrink-0">
            {holding.symbol?.slice(0, 4)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {holding.symbol}
              </h4>
              <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.2 rounded-full border border-accent/20">
                Holding Widget
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate max-w-[140px] sm:max-w-[170px]">
              {holding.name || holding.symbol}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <span className="font-mono font-bold text-white text-xs sm:text-sm block">
              ${currentPrice.toFixed(2)}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            title={`Remove ${holding.symbol} widget`}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Position Numbers */}
      <div className="flex items-baseline justify-between pt-0.5">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Holding Value
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
            <NumberTicker value={currentValue} prefix="$" />
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Total Return
          </span>
          <span className={`text-xs sm:text-sm font-extrabold font-mono flex items-center justify-end gap-0.5 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{isPos ? '+' : ''}{formatCurrency(unrealizedGain)}</span>
            <span>({isPos ? '+' : ''}{unrealizedGainPercent.toFixed(2)}%)</span>
          </span>
        </div>
      </div>

      {/* Stats Breakdown Bar */}
      <div className="bg-[#141412] border border-border/80 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="text-zinc-500 block text-[10px]">Shares</span>
          <span className="font-mono font-bold text-zinc-200 text-xs">
            {Number(holding.shares || 0).toFixed(4)}
          </span>
        </div>
        <div className="border-x border-border/50">
          <span className="text-zinc-500 block text-[10px]">Cost Basis</span>
          <span className="font-mono font-bold text-zinc-200 text-xs">
            {formatCurrency(investedAmount)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px]">Avg Cost</span>
          <span className="font-mono font-bold text-accent text-xs">
            ${Number(holding.avgCostPerShare || (holding.shares > 0 ? investedAmount / holding.shares : currentPrice)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Widget Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onInvestMore && (
          <button
            type="button"
            onClick={() => onInvestMore(holding)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-accent/15 hover:bg-accent text-accent hover:text-primary border border-accent/40 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Plus size={13} />
            <span>Invest More</span>
          </button>
        )}

        {onNavigateToMarkets && (
          <button
            type="button"
            onClick={onNavigateToMarkets}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-card-hover hover:bg-card text-zinc-300 hover:text-white border border-border rounded-xl text-xs font-semibold transition-all cursor-pointer"
            title="View live market quote & charts"
          >
            <span>Markets</span>
            <ExternalLink size={12} className="text-accent" />
          </button>
        )}
      </div>
    </div>
  );
}
