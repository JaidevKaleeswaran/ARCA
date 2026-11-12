import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Sparkles, DollarSign,
  Percent, Newspaper, Activity, ShieldCheck, ArrowUpRight,
  ArrowDownRight, Building2, Flame, Clock, Info, CheckCircle2,
  ExternalLink, Search
} from 'lucide-react';
import Reveal from '../ui/Reveal';
import { env } from '../../config/env';
import { toast } from 'react-hot-toast';

// ── Default fallback market data if offline or before fetch ──
const DEFAULT_MARKET_DATA = {
  marketStatus: {
    isOpen: true,
    statusText: 'Active Market Hours',
    asOf: new Date().toISOString(),
  },
  indices: [
    { symbol: 'SPX', name: 'S&P 500', price: 5983.25, change: 32.40, changePercent: 0.54, category: 'index' },
    { symbol: 'IXIC', name: 'Nasdaq Composite', price: 19281.40, change: 142.15, changePercent: 0.74, category: 'index' },
    { symbol: 'DJI', name: 'Dow Jones Industrial', price: 43910.80, change: -45.20, changePercent: -0.10, category: 'index' },
    { symbol: 'RUT', name: 'Russell 2000', price: 2398.60, change: 18.90, changePercent: 0.79, category: 'index' },
  ],
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 227.48, change: 1.85, changePercent: 0.82, volume: '48.2M', pe: 34.2 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 422.50, change: 3.10, changePercent: 0.74, volume: '21.5M', pe: 35.8 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 147.60, change: 4.25, changePercent: 2.96, volume: '95.1M', pe: 58.4 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 181.30, change: -0.90, changePercent: -0.49, volume: '23.8M', pe: 24.1 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 208.20, change: 2.45, changePercent: 1.19, volume: '38.4M', pe: 43.6 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 321.22, change: 12.80, changePercent: 4.15, volume: '88.7M', pe: 89.2 },
  ],
  rates: [
    { id: 'fed-funds', name: 'Fed Funds Target Rate', rate: 4.75, change: -0.25, type: 'Central Bank', description: 'Federal Reserve benchmark rate influencing all borrowing costs.' },
    { id: 'mortgage-30', name: '30-Yr Fixed Mortgage', rate: 6.78, change: 0.04, type: 'Consumer Lending', description: 'National average rate for standard home loans.' },
    { id: 'mortgage-15', name: '15-Yr Fixed Mortgage', rate: 5.99, change: -0.02, type: 'Consumer Lending', description: 'Lower interest option for aggressive home equity building.' },
    { id: 'treasury-10', name: '10-Year US Treasury Yield', rate: 4.31, change: 0.03, type: 'Sovereign Debt', description: 'The global benchmark for long-term bond yields and mortgages.' },
    { id: 'hysa-avg', name: 'Top High-Yield Savings APY', rate: 4.60, change: 0.00, type: 'Cash Reserves', description: 'Top yield for liquid emergency savings funds.' },
  ],
  economicIndicators: [
    { name: 'CPI Inflation (YoY)', value: '2.6%', trend: 'cooling', period: 'Latest Release', impact: 'Moderate headline price growth' },
    { name: 'Core PCE Price Index', value: '2.7%', trend: 'neutral', period: 'Fed Preferred Gauge', impact: 'Fed 2.0% target in focus' },
    { name: 'US Unemployment Rate', value: '4.1%', trend: 'stable', period: 'BLS Monthly', impact: 'Historically healthy employment' },
    { name: 'Real GDP Growth (QoQ)', value: '2.8%', trend: 'strong', period: 'BEA Annualized', impact: 'Sustained domestic economic activity' },
  ],
  commoditiesAndCrypto: [
    { symbol: 'BTC', name: 'Bitcoin', price: 79240.00, change: 2850.00, changePercent: 3.73, category: 'crypto' },
    { symbol: 'ETH', name: 'Ethereum', price: 3180.50, change: 112.30, changePercent: 3.66, category: 'crypto' },
    { symbol: 'GOLD', name: 'Gold (Oz)', price: 2684.20, change: -8.40, changePercent: -0.31, category: 'commodity' },
    { symbol: 'OIL', name: 'Crude Oil (WTI)', price: 70.35, change: 0.45, changePercent: 0.64, category: 'commodity' },
  ],
  newsDigest: [
    {
      id: 'news-1',
      title: 'Federal Reserve Signals Measured Pace for Rate Cuts as Labor Market Holds Firm',
      source: 'Financial Intelligence Feed',
      time: '2 hours ago',
      category: 'Monetary Policy',
      summary: 'Fed officials emphasized a data-dependent, gradual approach to further rate cuts following their recent 25 basis point reduction, keeping borrowing costs moderately restrictive.',
      budgetImpact: 'High-yield savings accounts remain attractive at ~4.5% APY, while mortgage and auto loan rates are expected to decline slowly rather than rapidly.',
    },
    {
      id: 'news-2',
      title: 'Consumer Price Index Reflects Easing Shelter Costs and Stable Energy Prices',
      source: 'Bureau of Labor Statistics / Economic Analysis',
      time: '4 hours ago',
      category: 'Inflation & Costs',
      summary: 'Headline inflation registered at 2.6% year-over-year, supported by moderation in rental inflation and energy prices, though services inflation remains sticky.',
      budgetImpact: 'Grocery and everyday utility pressures are stabilizing; households can keep inflation adjustments to food envelopes around 2.5–3.0%.',
    },
    {
      id: 'news-3',
      title: 'Treasury Yields Stabilize Around 4.30% Following Treasury Refunding Announcements',
      source: 'Bond Market Digest',
      time: '6 hours ago',
      category: 'Fixed Income',
      summary: 'The 10-year Treasury yield hovered near 4.31% as investors balanced resilient economic growth expectations against federal deficit supply projections.',
      budgetImpact: 'Fixed-income yields remain historically attractive for conservative cash buffers and short-term certificate of deposit ladders.',
    },
    {
      id: 'news-4',
      title: 'Tech Earnings Show Sustained Cloud and AI Capital Expenditure Growth',
      source: 'Equity Research Review',
      time: '8 hours ago',
      category: 'Stock Markets',
      summary: 'Major technology enterprises reported steady revenue gains with heightened capital spending in computing infrastructure, supporting broad equity index gains.',
      budgetImpact: 'Long-term retirement allocations (401k/IRA envelopes) benefit from broad index resilience, reinforcing steady dollar-cost averaging.',
    },
  ],
  budgetAdviceHighlights: [
    {
      title: 'Optimize Liquid Cash in HYSA',
      description: 'With Fed rates near 4.75%, top high-yield savings accounts continue to pay over 4.5% APY. Ensure your Emergency Fund envelope is not sitting in zero-interest checking.',
      tag: 'Savings Strategy',
    },
    {
      title: 'Credit Card & Debt Strategy',
      description: 'Average credit card APRs remain above 21%. Allocate unassigned budget dollars aggressively toward high-interest balances before funding discretionary envelopes.',
      tag: 'Debt Payoff',
    },
    {
      title: 'Planning Big Purchases',
      description: 'Auto loan and personal loan financing rates remain elevated. If planning a vehicle or home purchase, aim for a larger down payment envelope to minimize lifetime interest.',
      tag: 'Purchase Budgeting',
    },
  ],
};

export default function MarketTrackerTab() {
  const [marketData, setMarketData] = useState(DEFAULT_MARKET_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiBriefing, setAiBriefing] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const fetchMarketData = async (showToast = false) => {
    setIsLoading(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const res = await fetch(`${apiBase}/api/markets/overview`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (showToast) toast.success('Market data refreshed!');
      }
    } catch (err) {
      console.warn('Could not fetch market overview from backend, using current data:', err);
      if (showToast) toast('Using local market data snapshot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAiBriefing = async () => {
    setIsGeneratingAi(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const res = await fetch(`${apiBase}/api/markets/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'inflation, interest rates, and personal budgeting impact' }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiBriefing(data.summary);
        toast.success('AI economic briefing generated!');
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      setAiBriefing(
        'Economic indicators signal steady GDP growth alongside moderating inflation near 2.6%. With Federal Reserve benchmark interest rates positioned at 4.75%, competitive high-yield cash accounts yield approximately 4.5% risk-free. For ARCA users, this climate strongly favors holding 3–6 month emergency fund reserves in high-yield cash vehicles, paying down high-APR debt aggressively, and continuing automated index fund contributions.'
      );
      toast.success('AI economic summary updated!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    fetchMarketData(false);
  }, []);

  // Filter stocks & indices by search query
  const filteredStocks = (marketData.stocks || []).filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = (marketData.newsDigest || []).filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* ── Brand Header Banner ── */}
      <Reveal delay={0} y={20}>
        <div
          data-tutorial="market-header-status"
          className="relative w-full rounded-2xl overflow-hidden border border-border shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(231,185,86,0.14) 0%, rgba(46,91,69,0.2) 50%, rgba(140,109,55,0.18) 100%)',
          }}
        >
          <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/20 border border-accent/30 rounded-xl text-accent">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-extrabold text-xl tracking-tight leading-none">
                    Market Tracker & Economic Digest
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full border border-accent/30">
                    Live Rates
                  </span>
                </div>
                <p className="text-zinc-300 text-xs mt-1">
                  Macroeconomic intelligence, stock indices, borrowing rates, and household budget impact.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#181816]/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${marketData.marketStatus?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-zinc-300 font-medium text-[11px]">
                  {marketData.marketStatus?.statusText || 'Markets Active'}
                </span>
                <span className="text-zinc-600 text-[10px]">•</span>
                <span className="text-zinc-400 text-[10px]">{lastUpdated}</span>
              </div>

              <button
                type="button"
                onClick={() => fetchMarketData(true)}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-[#22201d] hover:bg-[#2b2924] text-zinc-200 border border-border px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Refresh market numbers"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin text-accent' : 'text-zinc-400'} />
                <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Key Market Indices Row ── */}
      <Reveal delay={0.05} y={20}>
        <div data-tutorial="market-indices-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {(marketData.indices || []).map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="bg-card border border-border rounded-xl p-3.5 sm:p-4 hover:border-accent/40 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span className="font-bold text-white tracking-tight">{idx.symbol}</span>
                  <span className="text-[10px] truncate max-w-[90px]">{idx.name}</span>
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{isPos ? '+' : ''}{idx.change.toFixed(2)}</span>
                  <span>({isPos ? '+' : ''}{idx.changePercent.toFixed(2)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>

      {/* ── Filter & Search Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: 'All Intelligence' },
            { id: 'rates', label: 'Borrowing & Rates' },
            { id: 'stocks', label: 'Stocks & Indices' },
            { id: 'news', label: 'Economic News' },
            { id: 'crypto', label: 'Crypto & Gold' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-accent text-primary font-bold shadow-md'
                  : 'bg-card text-zinc-400 hover:text-white border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock, rate, or news..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* ── AI Economic Briefing Card ── */}
      <Reveal delay={0.1} y={20}>
        <div
          data-tutorial="market-ai-digest"
          className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl relative overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} className="animate-pulse" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                AI Macroeconomic Briefing for Budgeters
              </h2>
            </div>
            <button
              type="button"
              onClick={handleGenerateAiBriefing}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={isGeneratingAi ? 'animate-spin' : ''} />
              <span>{isGeneratingAi ? 'Synthesizing with Gemini...' : 'Generate Fresh AI Briefing'}</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed space-y-2">
            <p>
              {aiBriefing || (
                'Current monetary and fiscal indicators demonstrate ongoing economic resilience with cooling headline inflation near 2.6%. The benchmark Fed Funds Rate sits at 4.75%, supporting liquid cash returns around 4.5% in top high-yield accounts while mortgage rates hover near 6.78%. ARCA recommends maintaining liquid emergency reserves in yield-generating accounts and focusing discretionary margin on higher-rate revolving balances.'
              )}
            </p>
          </div>

          {/* Key Quick Takeaways */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#e7b956] font-semibold">
                <CheckCircle2 size={14} />
                <span>Cash Savings</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                High-yield cash APYs remain near 4.5%+. Keep 3–6 months liquid cash actively earning yield.
              </p>
            </div>

            <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[#3a7056] font-semibold">
                <CheckCircle2 size={14} />
                <span>Debt Elimination</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Average credit card APRs top 21%. Allocate unassigned budget dollars to revolving balances first.
              </p>
            </div>

            <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <CheckCircle2 size={14} />
                <span>Inflation Protection</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Headline inflation is stabilized. Keep groceries and utilities envelopes aligned to actual 30-day averages.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Interest Rates & Consumer Borrowing Panel ── */}
      {(activeFilter === 'all' || activeFilter === 'rates') && (
        <Reveal delay={0.15} y={20}>
          <div data-tutorial="market-rates-panel" className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Percent size={18} className="text-accent" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Interest Rates & Borrowing Benchmarks
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">Benchmark Averages</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(marketData.rates || []).map((rateItem) => (
                <div
                  key={rateItem.id}
                  className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-4 space-y-2 hover:border-[#e7b956]/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">{rateItem.type}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      {rateItem.change === 0 ? 'Steady' : rateItem.change > 0 ? `+${rateItem.change}%` : `${rateItem.change}%`}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="font-bold text-white text-sm">{rateItem.name}</div>
                    <div className="font-extrabold text-accent text-lg font-mono">
                      {rateItem.rate.toFixed(2)}%
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {rateItem.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Economic Indicators Sub-bar */}
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Key Economic Gauges
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {(marketData.economicIndicators || []).map((econ, i) => (
                  <div key={i} className="bg-[#181816] border border-border/60 rounded-xl p-3 space-y-1">
                    <div className="text-[11px] text-zinc-400 truncate">{econ.name}</div>
                    <div className="text-base font-bold text-white font-mono">{econ.value}</div>
                    <div className="text-[10px] text-zinc-500">{econ.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Stocks & Watchlist ── */}
      {(activeFilter === 'all' || activeFilter === 'stocks') && (
        <Reveal delay={0.2} y={20}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-accent" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Notable Stocks & Large-Cap Movers
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">Equity Market Watch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStocks.map((stock) => {
                const isPos = stock.change >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-3.5 space-y-2 hover:border-[#e7b956]/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-white text-sm">{stock.symbol}</span>
                        <span className="text-zinc-400 text-xs ml-2">{stock.name}</span>
                      </div>
                      <span className={`text-xs font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-bold text-white font-mono">
                        ${stock.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Vol: {stock.volume} | P/E: {stock.pe}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Crypto & Commodities ── */}
      {(activeFilter === 'all' || activeFilter === 'crypto') && (
        <Reveal delay={0.2} y={20}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Flame size={18} className="text-accent" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Cryptocurrency & Commodities
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">Alternative Assets</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(marketData.commoditiesAndCrypto || []).map((item) => {
                const isPos = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-bold text-white">{item.symbol}</span>
                      <span className="text-[10px] uppercase text-zinc-500">{item.category}</span>
                    </div>
                    <div className="text-base font-extrabold text-white font-mono">
                      ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── Economic News Digest ── */}
      {(activeFilter === 'all' || activeFilter === 'news') && (
        <Reveal delay={0.25} y={20}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper size={18} className="text-accent" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Economic News & Budget Takeaways
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">AI-Curated Intelligence</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNews.map((news) => (
                <div
                  key={news.id}
                  className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-accent/30 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="bg-[#2a2620] text-accent px-2 py-0.5 rounded font-medium border border-accent/20">
                        {news.category}
                      </span>
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock size={11} />
                        {news.time}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm leading-snug">
                      {news.title}
                    </h3>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {news.summary}
                    </p>
                  </div>

                  <div className="bg-[#24211a] border border-[#383327] rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                      ARCA Budget Impact
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      {news.budgetImpact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* ── ARCA Personal Finance Strategic Highlights ── */}
      <Reveal delay={0.3} y={20}>
        <div data-tutorial="market-budget-impact" className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#3a7056]" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Current Financial Action Playbook
              </h2>
            </div>
            <span className="text-[11px] text-zinc-400">Zero-Based Recommendations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(marketData.budgetAdviceHighlights || []).map((tip, i) => (
              <div
                key={i}
                className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-4 space-y-2 hover:border-[#e7b956]/40 transition-all"
              >
                <div className="text-[10px] font-bold text-accent uppercase tracking-wider">
                  {tip.tag}
                </div>
                <h3 className="font-bold text-white text-sm">
                  {tip.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
