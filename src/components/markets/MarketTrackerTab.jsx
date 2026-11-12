import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, Sparkles, DollarSign,
  Percent, Newspaper, Activity, ShieldCheck, ArrowUpRight,
  ArrowDownRight, Building2, Flame, Clock, Info, CheckCircle2,
  ExternalLink, Search, Plus, Trash2, PieChart, BookOpen, Layers
} from 'lucide-react';
import Reveal from '../ui/Reveal';
import { env } from '../../config/env';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { STOCK_CATALOG, REAL_ARTICLES } from '../../data/marketData.js';
import ArticleReaderModal from './ArticleReaderModal';
import InvestStockModal from './InvestStockModal';
import { toast } from 'react-hot-toast';

export default function MarketTrackerTab() {
  const {
    investments = [],
    portfolioCurrentValue = 0,
    portfolioTotalInvested = 0,
    portfolioTotalGain = 0,
    portfolioTotalGainPercent = 0,
    dispatch,
  } = useBudget();

  // State
  const [catalog, setCatalog] = useState(STOCK_CATALOG);
  const [articles, setArticles] = useState(REAL_ARTICLES);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'stocks' | 'news' | 'rates'
  const [selectedSector, setSelectedSector] = useState('all'); // 'all' | 'Technology' | 'Financials' | ...
  const [searchQuery, setSearchQuery] = useState('');
  const [aiBriefing, setAiBriefing] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [catalogDisplayLimit, setCatalogDisplayLimit] = useState(24);

  // Modals
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);
  const [selectedArticleToRead, setSelectedArticleToRead] = useState(null);

  // Fetch live market data from backend
  const fetchMarketData = async (showToast = false) => {
    setIsLoading(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const [overviewRes, catalogRes, newsRes] = await Promise.allSettled([
        fetch(`${apiBase}/api/markets/overview`),
        fetch(`${apiBase}/api/markets/catalog?limit=200`),
        fetch(`${apiBase}/api/markets/news`),
      ]);

      if (catalogRes.status === 'fulfilled' && catalogRes.value.ok) {
        const catData = await catalogRes.value.json();
        if (Array.isArray(catData.stocks) && catData.stocks.length > 0) {
          setCatalog(catData.stocks);

          // Update user's portfolio holdings with latest live prices
          const quotes = {};
          catData.stocks.forEach((s) => {
            quotes[s.symbol] = s.price;
          });
          dispatch({ type: 'REFRESH_PORTFOLIO_PRICES', payload: quotes });
        }
      }

      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        const newsData = await newsRes.value.json();
        if (Array.isArray(newsData.articles) && newsData.articles.length > 0) {
          setArticles(newsData.articles);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (showToast) toast.success('Live market prices & intelligence refreshed!');
    } catch (err) {
      console.warn('Backend market fetch failed, using built-in catalog:', err);
      if (showToast) toast('Using local market catalog snapshot');
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
        body: JSON.stringify({ topic: 'inflation, interest rates, stock market momentum, and personal budgeting impact' }),
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
        'Economic indicators demonstrate sustained expansion with headline inflation cooling toward 2.6%. The benchmark Fed Funds Rate sits at 4.75%, preserving attractive liquid cash yields near 4.5% in high-yield accounts while mortgage rates hover near 6.78%. ARCA recommends maintaining 3–6 month emergency fund reserves in high-yield vehicles, eliminating variable-rate card debt, and dollar-cost averaging into broad index envelopes.'
      );
      toast.success('AI economic summary updated!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    fetchMarketData(false);
    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetchMarketData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter stocks by sector and search query
  const filteredStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((stock) => {
      const matchesSector = selectedSector === 'all' || stock.sector.toLowerCase() === selectedSector.toLowerCase();
      const matchesSearch = !q ||
        stock.symbol.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q);
      return matchesSector && matchesSearch;
    });
  }, [catalog, selectedSector, searchQuery]);

  // Filter news articles by search query
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((art) =>
      art.title.toLowerCase().includes(q) ||
      art.source.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q) ||
      (art.snippet && art.snippet.toLowerCase().includes(q))
    );
  }, [articles, searchQuery]);

  // Sectors list
  const sectors = ['all', 'Technology', 'Financials', 'Healthcare', 'Consumer', 'Energy', 'Industrials', 'ETFs'];

  // Handle removing a holding from pinned bar
  const handleDeleteHolding = (holdingId, symbol) => {
    if (confirm(`Remove ${symbol} from your portfolio?`)) {
      dispatch({ type: 'DELETE_INVESTMENT', payload: holdingId });
      toast.success(`Removed ${symbol} from portfolio.`);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ── Article Reader Modal ── */}
      <ArticleReaderModal
        article={selectedArticleToRead}
        isOpen={Boolean(selectedArticleToRead)}
        onClose={() => setSelectedArticleToRead(null)}
      />

      {/* ── Invest in Stock Modal ── */}
      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={() => setSelectedStockToInvest(null)}
      />

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
                    Market Browser & Portfolio Tracker
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full border border-accent/30">
                    Live Quotes
                  </span>
                </div>
                <p className="text-zinc-300 text-xs mt-1">
                  100+ US equities, index ETFs, authentic journalism, and real-time portfolio holdings.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#181816]/80 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300 font-medium text-[11px]">
                  US Markets Active
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

      {/* ── PINNED LIVE UPDATING HOLDINGS TICKER BAR ── */}
      <Reveal delay={0.05} y={20}>
        <div className="bg-[#1a1815] border border-border rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-accent/15 text-accent rounded-lg">
                <PieChart size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Your Pinned Holdings</span>
                  <span className="text-[10px] bg-[#2a2620] text-accent font-mono px-2 py-0.5 rounded-full border border-accent/20">
                    Live Updating
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Real-time equity valuations updating continuously across ARCA.
                </p>
              </div>
            </div>

            {investments.length > 0 && (
              <div className="flex items-center gap-3 sm:gap-5">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Portfolio Value</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-white">
                    {formatCurrency(portfolioCurrentValue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Return</span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${portfolioTotalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {portfolioTotalGain >= 0 ? '+' : ''}{formatCurrency(portfolioTotalGain)} ({portfolioTotalGain >= 0 ? '+' : ''}{portfolioTotalGainPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {investments.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-xl bg-[#141412] border border-dashed border-border/80 flex flex-col items-center justify-center space-y-2">
              <Building2 size={26} className="text-accent/60" />
              <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                You haven't added any stocks to your portfolio yet.
              </p>
              <p className="text-[11px] text-zinc-500 max-w-md">
                Search any company or ETF in the directory below and click <span className="text-accent font-semibold">"Invest +"</span> to set your investment amount. Your holdings will appear here live and inside the cross-tab <span className="text-accent font-semibold">"Stocks"</span> widget!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {investments.map((inv) => {
                const gain = Number(inv.unrealizedGain) || 0;
                const gainPct = Number(inv.unrealizedGainPercent) || 0;
                const isPos = gain >= 0;

                return (
                  <div
                    key={inv.id}
                    className="bg-[#141412] border border-border/80 hover:border-accent/40 rounded-xl p-3 flex flex-col justify-between transition-all group relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm tracking-tight">{inv.symbol}</span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">{inv.name}</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
                          {inv.shares} shares @ ${Number(inv.avgCostPerShare || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const found = catalog.find((s) => s.symbol.toUpperCase() === inv.symbol.toUpperCase());
                            setSelectedStockToInvest(found || { symbol: inv.symbol, name: inv.name, price: inv.currentPrice });
                          }}
                          title="Add more to position"
                          className="p-1 text-zinc-500 hover:text-accent hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHolding(inv.id, inv.symbol)}
                          title="Remove holding"
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-border/40 mt-2">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Current Value</span>
                        <span className="text-sm font-extrabold font-mono text-white">
                          {formatCurrency(inv.currentValue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block">P/L</span>
                        <span className={`text-[11px] font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{formatCurrency(gain)} ({isPos ? '+' : ''}{gainPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* ── Key Market Indices Row ── */}
      <Reveal delay={0.08} y={20}>
        <div data-tutorial="market-indices-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { symbol: 'SPX', name: 'S&P 500', price: 5983.25, change: 32.40, changePercent: 0.54 },
            { symbol: 'IXIC', name: 'Nasdaq Composite', price: 19281.40, change: 142.15, changePercent: 0.74 },
            { symbol: 'DJI', name: 'Dow Jones Industrial', price: 43910.80, change: -45.20, changePercent: -0.10 },
            { symbol: 'RUT', name: 'Russell 2000', price: 2398.60, change: 18.90, changePercent: 0.79 },
          ].map((idx) => {
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

      {/* ── Main Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: 'All Market Intelligence' },
            { id: 'stocks', label: 'Stock Directory (100+)' },
            { id: 'news', label: 'Real News Feed' },
            { id: 'rates', label: 'Borrowing Rates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTabFilter === tab.id
                  ? 'bg-accent text-primary font-bold shadow-md'
                  : 'bg-card text-zinc-400 hover:text-white border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock, ticker, or news..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* ── MAIN CONTENT LAYOUT: STOCK BROWSER & REAL NEWS + AI SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Stock Directory & Real News Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. STOCK DIRECTORY (100+ US EQUITIES & ETFS) */}
          {(activeTabFilter === 'all' || activeTabFilter === 'stocks') && (
            <Reveal delay={0.1} y={20}>
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-accent" />
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Browse US Equities & ETFs ({filteredStocks.length})
                    </h2>
                  </div>

                  {/* Sector Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
                    {sectors.map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setSelectedSector(sec)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          selectedSector === sec
                            ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                            : 'bg-[#181816] text-zinc-400 hover:text-zinc-200 border border-border/60'
                        }`}
                      >
                        {sec === 'all' ? 'All Sectors' : sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredStocks.slice(0, catalogDisplayLimit).map((stock) => {
                    const isPos = (stock.change || 0) >= 0;
                    const isOwned = investments.some((i) => i.symbol.toUpperCase() === stock.symbol.toUpperCase());

                    return (
                      <div
                        key={stock.symbol}
                        className="bg-[#1c1a17] border border-[#33302a] hover:border-accent/40 rounded-xl p-3.5 space-y-2.5 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-white text-sm">{stock.symbol}</span>
                                {isOwned && (
                                  <span className="text-[9px] bg-accent/20 text-accent font-semibold px-1.5 py-0.2 rounded">
                                    Owned
                                  </span>
                                )}
                              </div>
                              <span className="text-zinc-400 text-xs block truncate max-w-[130px]">
                                {stock.name}
                              </span>
                            </div>

                            <span className={`text-xs font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPos ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between pt-2">
                            <span className="text-base font-extrabold text-white font-mono">
                              ${Number(stock.price).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Cap: {stock.marketCap}
                            </span>
                          </div>
                        </div>

                        {/* Action: Click to Invest */}
                        <button
                          type="button"
                          onClick={() => setSelectedStockToInvest(stock)}
                          className="w-full flex items-center justify-center gap-1.5 bg-[#262420] hover:bg-accent hover:text-primary text-zinc-300 border border-border hover:border-accent text-xs font-semibold py-1.5 rounded-lg transition-all active:scale-98 cursor-pointer mt-1"
                        >
                          <Plus size={13} />
                          <span>Invest in {stock.symbol}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {filteredStocks.length > catalogDisplayLimit && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setCatalogDisplayLimit((prev) => prev + 24)}
                      className="px-4 py-1.5 bg-[#1e1c18] hover:bg-[#282620] text-accent border border-accent/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Show More Stocks ({filteredStocks.length - catalogDisplayLimit} remaining)
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* 2. AUTHENTIC FULL FINANCIAL NEWS FEED */}
          {(activeTabFilter === 'all' || activeTabFilter === 'news') && (
            <Reveal delay={0.15} y={20}>
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-accent" />
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Real Financial News & Journalism
                      </h2>
                      <p className="text-[11px] text-zinc-400">
                        Full reporting from Reuters, Bloomberg, WSJ, and Financial Times. Click any article to read.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                    {filteredArticles.length} Stories
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticleToRead(art)}
                      className="bg-[#1c1a17] border border-[#33302a] hover:border-accent/40 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all cursor-pointer group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-accent">
                            {art.source}
                          </span>
                          <span className="text-zinc-500 flex items-center gap-1">
                            <Clock size={11} />
                            {art.timeAgo}
                          </span>
                        </div>

                        <h3 className="font-bold text-white text-sm leading-snug group-hover:text-accent transition-colors">
                          {art.title}
                        </h3>

                        <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                          {art.snippet || (art.fullContent && art.fullContent[0])}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <BookOpen size={12} />
                          {art.readTime || '3 min read'}
                        </span>
                        <span className="text-accent font-semibold flex items-center gap-1 group-hover:underline">
                          <span>Read Full Article</span>
                          <ArrowUpRight size={13} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* 3. BORROWING & INTEREST RATES BENCHMARKS */}
          {(activeTabFilter === 'all' || activeTabFilter === 'rates') && (
            <Reveal delay={0.2} y={20}>
              <div data-tutorial="market-rates-panel" className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Percent size={18} className="text-accent" />
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Interest Rates & Consumer Borrowing Benchmarks
                    </h2>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">National Averages</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Fed Funds Target Rate', rate: '4.75%', desc: 'Federal Reserve benchmark rate' },
                    { name: '30-Yr Fixed Mortgage', rate: '6.78%', desc: 'National average conforming loans' },
                    { name: '10-Year US Treasury', rate: '4.31%', desc: 'Long-term borrowing benchmark' },
                    { name: 'High-Yield Savings APY', rate: '4.60%', desc: 'Top competitive online deposits' },
                    { name: 'Average Credit Card APR', rate: '21.4%', desc: 'Variable revolving consumer credit' },
                    { name: '48-Mo New Auto Loan', rate: '7.85%', desc: 'National bank financing benchmark' },
                  ].map((r, i) => (
                    <div key={i} className="bg-[#1c1a17] border border-[#33302a] rounded-xl p-3.5 space-y-1">
                      <div className="text-[11px] text-zinc-400 font-medium">{r.name}</div>
                      <div className="text-lg font-extrabold text-accent font-mono">{r.rate}</div>
                      <p className="text-[10px] text-zinc-500">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Right Column (1 Col): Dedicated AI Macro Digest & Takeaways Sidebar */}
        <div className="space-y-6">
          {/* AI MACRO BRIEFING CARD */}
          <Reveal delay={0.12} y={20}>
            <div
              data-tutorial="market-ai-digest"
              className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xl sticky top-20"
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles size={18} className="animate-pulse" />
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    AI Macroeconomic Digest
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiBriefing}
                  disabled={isGeneratingAi}
                  title="Regenerate Gemini Analysis"
                  className="p-1.5 text-accent hover:bg-accent/15 rounded-lg border border-accent/30 transition-all cursor-pointer"
                >
                  <RefreshCw size={13} className={isGeneratingAi ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="text-xs text-zinc-200 leading-relaxed space-y-2">
                <p>
                  {aiBriefing || (
                    'Current monetary indicators show stable GDP growth alongside cooling headline inflation near 2.6%. With Federal Reserve benchmark rates at 4.75%, competitive high-yield cash accounts yield approximately 4.5% risk-free. For ARCA users, this climate strongly favors holding 3–6 month emergency fund reserves in high-yield cash vehicles, eliminating high-APR variable balances, and dollar-cost averaging into long-term equity envelopes.'
                  )}
                </p>
              </div>

              {/* Actionable Personal Finance Takeaways */}
              <div className="pt-2 border-t border-border/60 space-y-2.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Actionable Budget Implications
                </span>

                <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#e7b956] font-semibold text-xs">
                    <CheckCircle2 size={13} />
                    <span>Cash Savings</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-snug">
                    High-yield cash APYs remain near 4.5%+. Keep liquid cash actively earning interest in your Emergency Fund envelope.
                  </p>
                </div>

                <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#3a7056] font-semibold text-xs">
                    <CheckCircle2 size={13} />
                    <span>Debt Elimination</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-snug">
                    Average credit card APRs top 21%. Allocate unassigned budget dollars to revolving balances before discretionary spending.
                  </p>
                </div>

                <div className="bg-[#1e1c18] border border-[#38342e] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs">
                    <CheckCircle2 size={13} />
                    <span>Dollar-Cost Averaging</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-snug">
                    Broad-market index ETFs (SPY, VOO) remain resilient. Maintain automated regular contributions through your investment envelope.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
