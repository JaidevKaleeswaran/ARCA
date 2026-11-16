import { useState, useEffect, useRef } from 'react';
import { X, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2, PieChart, RefreshCw } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { env } from '../../config/env';
import { toast } from 'react-hot-toast';

export default function InvestStockModal({ stock, isOpen, onClose }) {
  const { investments, dispatch } = useBudget();

  const [inputMode, setInputMode] = useState('dollars'); // 'dollars' | 'shares'
  const [dollarAmount, setDollarAmount] = useState('');
  const [shareCount, setShareCount] = useState('');
  const [notes, setNotes] = useState('');
  const [livePrice, setLivePrice] = useState(Number(stock?.price) || 1);
  const [liveChange, setLiveChange] = useState(Number(stock?.change) || 0);
  const [liveChangePercent, setLiveChangePercent] = useState(Number(stock?.changePercent) || 0);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);

  // Keep a ref to the latest onClose callback to prevent effect re-triggers from resetting inputs
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const prevIsOpenRef = useRef(false);
  const prevSymbolRef = useRef(null);

  // Reset form inputs only when opening modal freshly or when switching to a different stock
  useEffect(() => {
    if (isOpen && (!prevIsOpenRef.current || prevSymbolRef.current !== stock?.symbol)) {
      setDollarAmount('');
      setShareCount('');
      setNotes('');
      setInputMode('dollars');
    }
    prevIsOpenRef.current = isOpen;
    prevSymbolRef.current = stock?.symbol;
  }, [isOpen, stock?.symbol]);

  // Find existing holding if already owned
  const existingHolding = (investments || []).find(
    (inv) => inv.symbol.toUpperCase() === (stock?.symbol || '').toUpperCase()
  );

  // Fetch real-time live quote on modal open to guarantee 100% accurate price
  useEffect(() => {
    if (!isOpen || !stock?.symbol) return;

    setLivePrice(Number(stock.price) || 1);
    setLiveChange(Number(stock.change) || 0);
    setLiveChangePercent(Number(stock.changePercent) || 0);

    let isMounted = true;
    const fetchFreshQuote = async () => {
      setIsFetchingQuote(true);
      try {
        const apiBase = env.apiBaseUrl || '';
        const res = await fetch(`${apiBase}/api/markets/quote/${encodeURIComponent(stock.symbol)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && typeof data.price === 'number' && data.price > 0) {
            setLivePrice(data.price);
            if (typeof data.change === 'number') setLiveChange(data.change);
            if (typeof data.changePercent === 'number') setLiveChangePercent(data.changePercent);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live quote in InvestStockModal:', err);
      } finally {
        if (isMounted) setIsFetchingQuote(false);
      }
    };

    fetchFreshQuote();
    return () => { isMounted = false; };
  }, [isOpen, stock?.symbol]);

  // Escape key handler & body overflow lock (isolated from input state)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !stock) return null;

  const currentPrice = livePrice || Number(stock.price) || 1;
  const isPos = liveChange >= 0;

  // Real-time calculation helpers
  const calculatedShares = inputMode === 'dollars'
    ? (Number(dollarAmount) > 0 ? (Number(dollarAmount) / currentPrice) : 0)
    : Number(shareCount) || 0;

  const calculatedDollars = inputMode === 'shares'
    ? (Number(shareCount) > 0 ? (Number(shareCount) * currentPrice) : 0)
    : Number(dollarAmount) || 0;

  const handleDollarChange = (val) => {
    setDollarAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setShareCount((num / currentPrice).toFixed(4));
    } else {
      setShareCount('');
    }
  };

  const handleShareChange = (val) => {
    setShareCount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setDollarAmount((num * currentPrice).toFixed(2));
    } else {
      setDollarAmount('');
    }
  };

  const handleQuickAdd = (amount) => {
    setInputMode('dollars');
    const newTotal = (Number(dollarAmount) || 0) + amount;
    handleDollarChange(newTotal.toFixed(2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = Number(calculatedDollars);
    const finalShares = Number(calculatedShares);

    if (!finalAmount || finalAmount <= 0 || !finalShares || finalShares <= 0) {
      toast.error('Please enter a valid investment amount greater than zero.');
      return;
    }

    dispatch({
      type: 'ADD_INVESTMENT',
      payload: {
        symbol: stock.symbol,
        name: stock.name,
        shares: finalShares,
        investedAmount: finalAmount,
        currentPrice: currentPrice,
        notes: notes.trim(),
      },
    });

    toast.success(`Invested ${formatCurrency(finalAmount)} in ${stock.symbol} (${stock.name})!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 text-accent font-black flex items-center justify-center text-sm">
              {stock.symbol.slice(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  {stock.symbol}
                </h2>
                <span className="text-[11px] bg-card text-text-muted border border-border px-2 py-0.5 rounded font-medium">
                  {stock.sector || 'Stock'}
                </span>
              </div>
              <p className="text-xs text-text-muted truncate max-w-[240px]">
                {stock.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-white hover:bg-card rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Price Bar */}
        <div className="px-5 py-3 bg-primary border-b border-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Current Market Price: </span>
            <span className="font-mono font-extrabold text-white text-sm">
              ${currentPrice.toFixed(2)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${isFetchingQuote ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
              {isFetchingQuote ? 'Syncing...' : 'Live Quote'}
            </span>
          </div>

          <div className={`flex items-center gap-1 font-semibold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{isPos ? '+' : ''}{Number(liveChange || 0).toFixed(2)}</span>
            <span>({isPos ? '+' : ''}{Number(liveChangePercent || 0).toFixed(2)}%)</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Existing Position Callout if owned */}
          {existingHolding && (
            <div className="bg-card border border-accent/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <PieChart size={16} className="text-accent shrink-0" />
                <div>
                  <span className="text-text-muted font-semibold">Currently in Portfolio: </span>
                  <span className="text-accent font-bold font-mono">
                    {existingHolding.shares} shares ({formatCurrency(existingHolding.currentValue)})
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded">
                Adding to Position
              </span>
            </div>
          )}

          {/* Mode Switcher: Dollars vs Shares */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text">
                Investment Method
              </label>
              <div className="flex items-center bg-primary border border-border rounded-lg p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('dollars');
                    if (calculatedDollars > 0) {
                      setDollarAmount(calculatedDollars.toFixed(2));
                    }
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    inputMode === 'dollars' ? 'bg-accent text-primary font-bold shadow-sm' : 'text-text-muted hover:text-white'
                  }`}
                >
                  Dollar Amount ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('shares');
                    if (calculatedShares > 0) {
                      setShareCount(calculatedShares.toFixed(4));
                    }
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                    inputMode === 'shares' ? 'bg-accent text-primary font-bold shadow-sm' : 'text-text-muted hover:text-white'
                  }`}
                >
                  Number of Shares
                </button>
              </div>
            </div>

            {/* Input Field */}
            {inputMode === 'dollars' ? (
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent" />
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  autoFocus
                  value={dollarAmount}
                  onChange={(e) => handleDollarChange(e.target.value)}
                  placeholder="e.g. 500.00"
                  className="w-full bg-primary border border-border focus:border-accent text-white font-mono text-base font-bold rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  autoFocus
                  value={shareCount}
                  onChange={(e) => handleShareChange(e.target.value)}
                  placeholder="e.g. 5.0"
                  className="w-full bg-primary border border-border focus:border-accent text-white font-mono text-base font-bold rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-zinc-600"
                />
              </div>
            )}
          </div>

          {/* Quick Increment Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <span className="text-[11px] text-text-muted mr-1">Quick add:</span>
            {[50, 100, 250, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="px-2.5 py-1 rounded-lg bg-card hover:bg-card-hover border border-border text-text font-mono text-[11px] transition-all cursor-pointer"
              >
                +${amt}
              </button>
            ))}
          </div>

          {/* Real-time Conversion Summary Card */}
          <div className="bg-primary border border-border/80 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Shares to be Acquired:</span>
              <span className="font-mono font-bold text-white">
                {calculatedShares > 0 ? calculatedShares.toFixed(4) : '0.0000'} shares
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Total Investment Cost Basis:</span>
              <span className="font-mono font-extrabold text-accent text-sm">
                {formatCurrency(calculatedDollars)}
              </span>
            </div>
            {existingHolding && calculatedDollars > 0 && (
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-zinc-400">
                <span>New Total Position:</span>
                <span className="text-zinc-200 font-semibold font-mono">
                  {(existingHolding.shares + calculatedShares).toFixed(4)} shares ({formatCurrency(existingHolding.currentValue + calculatedDollars)})
                </span>
              </div>
            )}
          </div>

          {/* Optional Investment Note */}
          <div>
            <label className="text-[11px] font-medium text-zinc-400 mb-1 block">
              Investment Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly DCA, Roth IRA contribution"
              className="w-full bg-[#131311] border border-border focus:border-accent text-xs text-white rounded-xl px-3 py-2 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-card hover:bg-zinc-800 text-zinc-300 border border-border text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={calculatedDollars <= 0}
              className="flex items-center gap-1.5 px-5 py-2 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:hover:bg-accent text-primary text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Confirm & Add to Portfolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
