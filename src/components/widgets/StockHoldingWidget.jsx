import { Plus, Trash2 } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { toast } from 'react-hot-toast';

export default function StockHoldingWidget({ holding, onInvestMore }) {
  const { dispatch } = useBudget();

  if (!holding) return null;

  const currentPrice =
    Number(holding.currentPrice) ||
    (holding.shares > 0 ? holding.currentValue / holding.shares : 0);
  const currentValue = Number(holding.currentValue) || holding.shares * currentPrice;
  const investedAmount = Number(holding.investedAmount) || 0;
  const unrealizedGain = Number(holding.unrealizedGain) || currentValue - investedAmount;
  const unrealizedGainPercent =
    investedAmount > 0
      ? Number(((unrealizedGain / investedAmount) * 100).toFixed(2))
      : Number(holding.unrealizedGainPercent) || 0;
  const isPos = unrealizedGain >= 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Remove ${holding.symbol} holding from your portfolio?`)) {
      dispatch({ type: 'DELETE_INVESTMENT', payload: holding.id });
      toast.success(`Removed ${holding.symbol}.`);
    }
  };

  return (
    <div
      data-widget="stock-holding"
      data-symbol={holding.symbol}
      className="group rounded-lg border border-white/[0.08] bg-[#111110] divide-y divide-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-zinc-100">{holding.symbol}</h4>
            <span className="text-xs text-zinc-400 tabular-nums">
              ${currentPrice.toFixed(2)}
            </span>
          </div>
          <p className="truncate text-[11px] text-zinc-500">{holding.name || holding.symbol}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onInvestMore && (
            <button
              type="button"
              onClick={() =>
                onInvestMore({
                  symbol: holding.symbol,
                  name: holding.name,
                  price: currentPrice,
                  sector: holding.sector,
                })
              }
              title={`Add to ${holding.symbol}`}
              className="rounded p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-[#E7B956] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            title={`Remove ${holding.symbol}`}
            className="rounded p-1 text-zinc-500 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.06] text-xs">
        <div className="px-3.5 py-2.5">
          <span className="block text-[10px] text-zinc-500">Value</span>
          <span className="font-semibold text-zinc-100 tabular-nums">
            {formatCurrency(currentValue)}
          </span>
        </div>
        <div className="px-3.5 py-2.5">
          <span className="block text-[10px] text-zinc-500">Shares</span>
          <span className="font-medium text-zinc-300 tabular-nums">
            {Number(holding.shares || 0).toFixed(3)}
          </span>
        </div>
        <div className="px-3.5 py-2.5">
          <span className="block text-[10px] text-zinc-500">Return</span>
          <span
            className={`font-medium tabular-nums ${
              isPos ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPos ? '+' : ''}
            {unrealizedGainPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
