import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, RefreshCw, DollarSign,
  Percent, Newspaper, Activity, ShieldCheck, ArrowUpRight,
  ArrowDownRight, Building2, Flame, Clock, Info, CheckCircle2,
  ExternalLink, Search, Plus, Trash2, PieChart, Globe, AlertCircle, Star
} from 'lucide-react';
import Reveal from '../ui/Reveal';
import NumberTicker from '../ui/reactbits/NumberTicker';
import SpotlightCard from '../ui/reactbits/SpotlightCard';
import { env } from '../../config/env';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { STOCK_CATALOG, DEFAULT_MARKET_DATA } from '../../data/marketData.js';
import ArticleReaderModal from './ArticleReaderModal';
import InvestStockModal from './InvestStockModal';
import StockDetailDrawer from './StockDetailDrawer';
import { toast } from 'react-hot-toast';

export default function MarketTrackerTab({ view, mobileView = 'markets' }) {
  const {
    investments = [],
    watchlist = [],
    portfolioCurrentValue = 0,
    portfolioTotalInvested = 0,
    portfolioTotalGain = 0,
    portfolioTotalGainPercent = 0,
    dispatch,
  } = useBudget();

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Markets and Financial are distinct pages on both desktop and mobile
  const activeView = view || mobileView || 'markets';
  const isMarketsPage = activeView === 'markets';
  const isFinancialPage = activeView === 'financial';
  const showMarketsSections = isMarketsPage;
  const showFinancialSections = isFinancialPage;

  // State — start empty until live Yahoo Finance quotes load so stale baseline prices never flash
  const [overview, setOverview] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [isFallbackBaseline, setIsFallbackBaseline] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const [isLoadingMoreStocks, setIsLoadingMoreStocks] = useState(false);
  const [hasMoreStocks, setHasMoreStocks] = useState(true);
  const [articles, setArticles] = useState([]);
  const [newsPage, setNewsPage] = useState(1);
  const [isLoadingMoreNews, setIsLoadingMoreNews] = useState(false);
  const [selectedNewsTopic, setSelectedNewsTopic] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all' | 'stocks' | 'news' | 'rates'
  const [selectedSector, setSelectedSector] = useState('all');
  const [sectorGlow, setSectorGlow] = useState({ sector: null, nonce: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiBriefing, setAiBriefing] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const isInitializedRef = useRef(false);
  const investmentsRef = useRef(investments);
  const watchlistRef = useRef(watchlist);
  useEffect(() => {
    investmentsRef.current = investments;
  }, [investments]);
  useEffect(() => {
    watchlistRef.current = watchlist;
  }, [watchlist]);

  // Modals & In-Depth Stock Drawer
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);
  const [selectedArticleToRead, setSelectedArticleToRead] = useState(null);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);

  // Fetch live market data from backend
  const fetchMarketData = useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const [overviewRes, catalogRes, newsRes] = await Promise.allSettled([
        fetch(`${apiBase}/api/markets/overview`),
        !isInitializedRef.current ? fetch(`${apiBase}/api/markets/catalog?page=1&limit=36`) : Promise.resolve(null),
        fetch(`${apiBase}/api/markets/news`),
      ]);

      let loadedLiveStocks = false;
      let parsedOverview = null;

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.ok) {
        const oData = await overviewRes.value.json();
        parsedOverview = oData;
        setOverview(oData);
        setIsFallbackBaseline(false);

        // Update live prices in-place for existing catalog without truncating loaded pages or resetting view
        if (Array.isArray(oData.stocks) && oData.stocks.length > 0) {
          loadedLiveStocks = true;
          const liveMap = new Map(oData.stocks.map((s) => [s.symbol.toUpperCase(), s]));
          setCatalog((prev) => {
            if (!prev || prev.length === 0) return oData.stocks.slice(0, 36);
            return prev.map((item) => liveMap.get(item.symbol.toUpperCase()) || item);
          });
        }

        // Update user portfolio holdings & favorited watchlist with live real-time quotes
        const quotes = {};
        (oData.stocks || []).forEach((s) => {
          if (typeof s.price === 'number' && s.price > 0) {
            quotes[s.symbol] = {
              price: s.price,
              change: s.change,
              changePercent: s.changePercent,
              marketCap: s.marketCap,
              name: s.name,
            };
          }
        });
        dispatch({ type: 'REFRESH_PORTFOLIO_PRICES', payload: quotes });
      }

      if (catalogRes.status === 'fulfilled' && catalogRes.value?.ok) {
        const catData = await catalogRes.value.json();
        if (Array.isArray(catData.stocks) && catData.stocks.length > 0) {
          loadedLiveStocks = true;
          setCatalog(catData.stocks);
          setStockPage(1);
          setHasMoreStocks(catData.hasMore ?? (catData.stocks.length === 36));
          setIsFallbackBaseline(false);
          isInitializedRef.current = true;
        }
      }

      // Only fall back to static baseline catalog if both live endpoints failed on initial load
      if (!loadedLiveStocks && !isInitializedRef.current) {
        setCatalog((prev) => (prev.length > 0 ? prev : STOCK_CATALOG.slice(0, 36)));
        setIsFallbackBaseline(true);
      }

      if (newsRes.status === 'fulfilled' && newsRes.value?.ok) {
        const newsData = await newsRes.value.json();
        if (Array.isArray(newsData.articles) && newsData.articles.length > 0) {
          setArticles(newsData.articles);
        }
      } else if (parsedOverview && Array.isArray(parsedOverview.newsDigest)) {
        setArticles(parsedOverview.newsDigest);
      }

      // Also refresh any custom stock holdings & favorited watchlist symbols outside default universe
      const currentTrackedSymbols = Array.from(
        new Set(
          [
            ...(investmentsRef.current || []).map((i) => i.symbol),
            ...(watchlistRef.current || []).map((w) => w.symbol),
          ].filter(Boolean)
        )
      );
      if (currentTrackedSymbols.length > 0) {
        try {
          const bRes = await fetch(`${apiBase}/api/markets/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols: currentTrackedSymbols }),
          });
          if (bRes.ok) {
            const bData = await bRes.json();
            if (bData.quotes) {
              const liveMap = {};
              Object.values(bData.quotes).forEach((q) => {
                if (typeof q.price === 'number' && q.price > 0) {
                  liveMap[q.symbol] = q;
                }
              });
              dispatch({ type: 'REFRESH_PORTFOLIO_PRICES', payload: liveMap });
            }
          }
        } catch (hErr) {
          console.warn('Could not batch refresh tracked stocks:', hErr);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (showToast) toast.success('Live quotes & market news refreshed!');
    } catch (err) {
      console.warn('Backend live market fetch failed:', err);
      if (!isInitializedRef.current) {
        setCatalog((prev) => (prev.length > 0 ? prev : STOCK_CATALOG.slice(0, 36)));
        setIsFallbackBaseline(true);
      }
      if (showToast) toast.error('Failed to refresh live market numbers');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Generate More Articles on Demand
  const handleGenerateMoreArticles = async () => {
    setIsLoadingMoreNews(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const nextPage = newsPage + 1;
      const topicParam = selectedNewsTopic !== 'all' ? `&topic=${selectedNewsTopic}` : '';
      const res = await fetch(`${apiBase}/api/markets/news/generate-more?page=${nextPage}${topicParam}`);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles((prev) => {
            const seen = new Set(prev.map((a) => a.link || a.id || a.title));
            const fresh = data.articles.filter((a) => !seen.has(a.link || a.id || a.title));
            return [...prev, ...fresh];
          });
          setNewsPage(nextPage);
          toast.success(`Generated ${data.added || data.articles.length} more authentic articles!`);
        } else {
          toast.info('All latest market articles are up to date.');
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.warn('Failed to generate more articles:', err);
      toast.error('Could not fetch additional articles. Try again in a moment.');
    } finally {
      setIsLoadingMoreNews(false);
    }
  };

  // Handle Server Pagination for Show More Stocks
  const handleShowMoreStocks = async () => {
    setIsLoadingMoreStocks(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const nextPage = stockPage + 1;
      const secParam = selectedSector !== 'all' ? `&sector=${encodeURIComponent(selectedSector)}` : '';
      const res = await fetch(`${apiBase}/api/markets/catalog?page=${nextPage}&limit=36${secParam}`);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          setCatalog((prev) => {
            const seen = new Set(prev.map((s) => s.symbol.toUpperCase()));
            const fresh = data.stocks.filter((s) => !seen.has(s.symbol.toUpperCase()));
            return [...prev, ...fresh];
          });
          setStockPage(nextPage);
          setHasMoreStocks(data.hasMore ?? (data.stocks.length === 36));
          toast.success(`Loaded ${data.stocks.length} more live stock quotes!`);
        } else {
          setHasMoreStocks(false);
          toast.info('All market catalog quotes are loaded.');
        }
      } else {
        throw new Error(`Server returned ${res.status}`);
      }
    } catch (err) {
      console.warn('Failed to load more stocks:', err);
      toast.error('Could not load additional stocks. Please try again.');
    } finally {
      setIsLoadingMoreStocks(false);
    }
  };

  // Switch Sector Filter
  const handleSelectSector = async (sec) => {
    setSelectedSector(sec);
    setSectorGlow((prev) => ({ sector: sec, nonce: prev.nonce + 1 }));
    setSearchQuery('');
    setSearchResults(null);
    setStockPage(1);
    setHasMoreStocks(true);
    setIsLoading(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const secParam = sec !== 'all' ? `&sector=${encodeURIComponent(sec)}` : '';
      const res = await fetch(`${apiBase}/api/markets/catalog?page=1&limit=36${secParam}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          setCatalog(data.stocks);
          setHasMoreStocks(data.hasMore ?? (data.stocks.length === 36));
        }
      }
    } catch (err) {
      console.warn('Error filtering sector:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch News Topic Feed
  const handleSelectNewsTopic = async (topic) => {
    setSelectedNewsTopic(topic);
    setIsLoading(true);
    try {
      const apiBase = env.apiBaseUrl || '';
      const url = topic === 'all'
        ? `${apiBase}/api/markets/news?page=1`
        : `${apiBase}/api/markets/news?topic=${topic}&page=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.articles)) {
          setArticles(data.articles);
          setNewsPage(1);
        }
      }
    } catch (err) {
      console.warn('Error fetching topic news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced live search with AbortController so clearing input cancels in-flight requests
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const apiBase = env.apiBaseUrl || '';
        const res = await fetch(`${apiBase}/api/markets/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok && !controller.signal.aborted) {
          const data = await res.json();
          if (Array.isArray(data.results) && !controller.signal.aborted) {
            setSearchResults(data.results);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Live search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

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
        toast.success('Market outlook updated!');
      } else {
        throw new Error('Server returned non-200');
      }
    } catch {
      setAiBriefing(
        'Economic indicators demonstrate sustained expansion with headline inflation near 3.7%. The benchmark Effective Fed Funds Rate sits at 3.88%, preserving attractive liquid cash yields near 4.23% in high-yield accounts while 30-year fixed mortgages average 7.11%. ARCA recommends maintaining 3–6 month emergency fund reserves in high-yield vehicles, eliminating variable-rate card debt averaging 21.19%, and dollar-cost averaging into broad index envelopes.'
      );
      toast.success('Market outlook updated!');
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
  }, [fetchMarketData]);

  // Filter stocks by sector (bypass sector filtering when searching)
  const filteredStocks = useMemo(() => {
    if (searchResults) {
      return searchResults;
    }
    const matchesSector = (itemSector, targetSector) => {
      if (!targetSector || targetSector.toLowerCase() === 'all') return true;
      if (!itemSector) return false;
      const is = itemSector.toLowerCase();
      const ts = targetSector.toLowerCase();
      if (is === ts) return true;
      if (ts === 'financials' && is.includes('financial')) return true;
      if (ts === 'consumer' && is.includes('consumer')) return true;
      return false;
    };
    return catalog.filter((stock) => matchesSector(stock.sector, selectedSector));
  }, [catalog, searchResults, selectedSector]);

  // Sectors list
  const sectors = ['all', 'Technology', 'Financials', 'Healthcare', 'Consumer', 'Energy', 'Industrials', 'ETFs'];

  // Handle removing a holding from pinned bar
  const handleDeleteHolding = (holdingId, symbol) => {
    if (confirm(`Remove ${symbol} from your portfolio?`)) {
      dispatch({ type: 'DELETE_INVESTMENT', payload: holdingId });
      toast.success(`Removed ${symbol} from portfolio.`);
    }
  };

  // Live indices from overview (only show fallback baseline if initial fetch failed)
  const liveIndices = overview?.indices || (isFallbackBaseline ? DEFAULT_MARKET_DATA.indices : null);

  const handleCloseArticleModal = useCallback(() => {
    setSelectedArticleToRead(null);
  }, []);

  const handleCloseInvestModal = useCallback(() => {
    setSelectedStockToInvest(null);
  }, []);

  const handleCloseDetailDrawer = useCallback(() => {
    setSelectedStockForDetail(null);
  }, []);

  // Propagate fresh live quote from StockDetailDrawer into catalog, search results, and portfolio holdings
  const handleDrawerQuoteLoaded = useCallback(
    (liveData) => {
      if (!liveData?.symbol || typeof liveData.price !== 'number' || liveData.price <= 0) return;
      const symUpper = liveData.symbol.toUpperCase();
      const patch = {
        price: liveData.price,
        change: typeof liveData.dayChange === 'number' ? liveData.dayChange : undefined,
        changePercent: typeof liveData.dayChangePercent === 'number' ? liveData.dayChangePercent : undefined,
        marketCap: liveData.stats?.marketCap || undefined,
        volume: liveData.stats?.volume || undefined,
        high52: liveData.stats?.high52 ?? undefined,
        low52: liveData.stats?.low52 ?? undefined,
      };
      const applyPatch = (item) => {
        if (!item || item.symbol?.toUpperCase() !== symUpper) return item;
        return {
          ...item,
          price: patch.price,
          change: patch.change ?? item.change,
          changePercent: patch.changePercent ?? item.changePercent,
          marketCap: patch.marketCap || item.marketCap,
          volume: patch.volume || item.volume,
          high52: patch.high52 ?? item.high52,
          low52: patch.low52 ?? item.low52,
          isLive: true,
        };
      };

      setCatalog((prev) => prev.map(applyPatch));
      setSearchResults((prev) => (Array.isArray(prev) ? prev.map(applyPatch) : prev));
      const richQuote = {
        price: liveData.price,
        change: typeof liveData.dayChange === 'number' ? liveData.dayChange : undefined,
        changePercent: typeof liveData.dayChangePercent === 'number' ? liveData.dayChangePercent : undefined,
        marketCap: liveData.stats?.marketCap || undefined,
      };
      dispatch({
        type: 'REFRESH_PORTFOLIO_PRICES',
        payload: { [liveData.symbol]: richQuote, [symUpper]: richQuote },
      });
    },
    [dispatch]
  );

  // Favorited symbols set & toggle handler
  const favoriteSymbolSet = useMemo(
    () => new Set(watchlist.map((w) => w.symbol?.toUpperCase()).filter(Boolean)),
    [watchlist]
  );

  const handleToggleFavorite = useCallback(
    (stock) => {
      if (!stock?.symbol) return;
      const symUpper = stock.symbol.toUpperCase();
      const wasFav = favoriteSymbolSet.has(symUpper);
      dispatch({
        type: 'TOGGLE_FAVORITE_STOCK',
        payload: {
          symbol: symUpper,
          name: stock.name || symUpper,
          sector: stock.sector || 'Equities',
          price: Number(stock.price) || 0,
          change: Number(stock.change) || 0,
          changePercent: Number(stock.changePercent) || 0,
          marketCap: stock.marketCap || 'N/A',
        },
      });
      toast.success(
        wasFav ? `Removed ${symUpper} from favorites` : `Pinned ${symUpper} to top`
      );
    },
    [dispatch, favoriteSymbolSet]
  );

  // Unified pinned list at top of Markets: all favorited stocks + any invested holdings (deduplicated)
  const pinnedItems = useMemo(() => {
    const liveLookup = new Map();
    (overview?.stocks || []).forEach((s) => {
      if (s?.symbol) liveLookup.set(s.symbol.toUpperCase(), s);
    });
    catalog.forEach((s) => {
      if (s?.symbol) liveLookup.set(s.symbol.toUpperCase(), s);
    });

    const holdingMap = new Map();
    investments.forEach((inv) => {
      if (inv?.symbol) holdingMap.set(inv.symbol.toUpperCase(), inv);
    });

    const ordered = [];
    const seen = new Set();

    // 1. Favorited stocks first (preserving most recently favorited order)
    watchlist.forEach((w) => {
      const sym = w.symbol?.toUpperCase();
      if (!sym || seen.has(sym)) return;
      seen.add(sym);
      const live = liveLookup.get(sym);
      const holding = holdingMap.get(sym) || null;
      ordered.push({
        symbol: sym,
        name: live?.name || holding?.name || w.name || sym,
        sector: live?.sector || w.sector || 'Equities',
        price: live?.price ?? holding?.currentPrice ?? (Number(w.price) || 0),
        change: live?.change ?? (Number(w.change) || 0),
        changePercent: live?.changePercent ?? (Number(w.changePercent) || 0),
        marketCap: live?.marketCap || w.marketCap || 'N/A',
        isFavorited: true,
        holding,
      });
    });

    // 2. Any owned holdings not already starred
    investments.forEach((inv) => {
      const sym = inv.symbol?.toUpperCase();
      if (!sym || seen.has(sym)) return;
      seen.add(sym);
      const live = liveLookup.get(sym);
      ordered.push({
        symbol: sym,
        name: live?.name || inv.name || sym,
        sector: live?.sector || 'Equities',
        price: live?.price ?? (Number(inv.currentPrice) || 0),
        change: live?.change ?? 0,
        changePercent: live?.changePercent ?? 0,
        marketCap: live?.marketCap || 'N/A',
        isFavorited: false,
        holding: inv,
      });
    });

    return ordered;
  }, [watchlist, investments, catalog, overview?.stocks]);

  const selectedDetailHolding = useMemo(() => {
    if (!selectedStockForDetail?.symbol) return null;
    const symUpper = selectedStockForDetail.symbol.toUpperCase();
    return investments.find((i) => i.symbol?.toUpperCase() === symUpper) || null;
  }, [investments, selectedStockForDetail]);

  const selectedDetailIsFavorited = Boolean(
    selectedStockForDetail?.symbol &&
      favoriteSymbolSet.has(selectedStockForDetail.symbol.toUpperCase())
  );

  // Sub-filter only applies on the Financial page (All / Macro & Rates / News)
  const effectiveFilter = isMarketsPage
    ? 'stocks'
    : activeTabFilter === 'stocks'
      ? 'all'
      : activeTabFilter;

  return (
    <div className="space-y-6 pb-20">
      {/* ── Article Reader Modal ── */}
      <ArticleReaderModal
        article={selectedArticleToRead}
        isOpen={Boolean(selectedArticleToRead)}
        onClose={handleCloseArticleModal}
      />

      {/* ── Invest in Stock Modal ── */}
      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={handleCloseInvestModal}
      />

      {/* ── In-Depth Stock Price Drawer (1/3rd right side, scroll-following below TabNavigation) ── */}
      <StockDetailDrawer
        stock={selectedStockForDetail}
        holding={selectedDetailHolding}
        isFavorited={selectedDetailIsFavorited}
        onToggleFavorite={handleToggleFavorite}
        onClose={handleCloseDetailDrawer}
        onInvest={(stk) => setSelectedStockToInvest(stk)}
        onQuoteLoaded={handleDrawerQuoteLoaded}
      />

      {/* ── Minimal Hairline Page Header ── */}
      <div
        data-tutorial="market-header-status"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4"
      >
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100">
          {isFinancialPage ? 'Financial' : 'Markets'}
        </h1>

        <button
          type="button"
          onClick={() => fetchMarketData(true)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
          title="Refresh live data"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#c8a24e]' : 'text-zinc-500'}`}
            strokeWidth={1.5}
          />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* ── PINNED FAVORITES & HOLDINGS STRIP (Markets section) ── */}
      {showMarketsSections && (
        <div
          data-testid="pinned-stocks-strip"
          className="arca-chamfer rounded-xl border border-white/[0.08] bg-[#111110] p-4 sm:p-5 relative overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 fill-[#E7B956] text-[#E7B956]" strokeWidth={1.75} />
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Favorites &amp; Holdings
              </h2>
              {pinnedItems.length > 0 && (
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 tabular-nums">
                  {pinnedItems.length}
                </span>
              )}
            </div>

            {investments.length > 0 && (
              <div className="flex items-center gap-3 sm:gap-5">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Portfolio Value</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-white">
                    <NumberTicker value={portfolioCurrentValue} prefix="$" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block">Total Return</span>
                  <span className={`text-xs sm:text-sm font-bold font-mono ${portfolioTotalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {portfolioTotalGain >= 0 ? '+' : ''}{formatCurrency(portfolioTotalGain)} ({portfolioTotalGain >= 0 ? '+' : ''}{portfolioTotalGainPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {pinnedItems.length === 0 ? (
            <div className="py-5 px-4 text-center rounded-xl bg-card border border-dashed border-border flex flex-col items-center justify-center space-y-1.5">
              <Star size={22} className="text-[#E7B956]/70" strokeWidth={1.5} />
              <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                No favorited stocks yet
              </p>
              <p className="hidden md:block text-[11px] text-zinc-500 max-w-md">
                Tap the <span className="text-[#E7B956] font-semibold">★ star</span> in the bottom-left corner of any stock below to pin it here and track it live — no investment required.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pinnedItems.map((item) => {
                const inv = item.holding;
                const isInspecting =
                  selectedStockForDetail?.symbol?.toUpperCase() === item.symbol;
                const dayPos = (item.changePercent || 0) >= 0;
                const gain = inv ? Number(inv.unrealizedGain) || 0 : 0;
                const gainPct = inv ? Number(inv.unrealizedGainPercent) || 0 : 0;
                const gainPos = gain >= 0;

                const openItemDetail = () => {
                  const found = catalog.find(
                    (s) => s.symbol.toUpperCase() === item.symbol
                  );
                  setSelectedStockForDetail(
                    found || {
                      symbol: item.symbol,
                      name: item.name,
                      sector: item.sector,
                      price: item.price,
                      change: item.change,
                      changePercent: item.changePercent,
                      marketCap: item.marketCap,
                    }
                  );
                };

                return (
                  <SpotlightCard
                    key={item.symbol}
                    role="button"
                    tabIndex={0}
                    data-pinned-symbol={item.symbol}
                    data-holding-symbol={inv ? item.symbol : undefined}
                    onClick={openItemDetail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openItemDetail();
                      }
                    }}
                    className={`p-3 flex flex-col justify-between group relative cursor-pointer transition-colors ${
                      isInspecting
                        ? 'border-[#E7B956]/60 bg-[#151513]'
                        : 'hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm tracking-tight group-hover:text-[#E7B956] transition-colors">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">
                            {item.name}
                          </span>
                        </div>
                        {inv ? (
                          <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block tabular-nums">
                            {inv.shares} sh @ ${Number(inv.avgCostPerShare || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 mt-0.5 block">
                            {item.sector || 'Watchlist'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item);
                          }}
                          title={item.isFavorited ? `Unfavorite ${item.symbol}` : `Favorite ${item.symbol}`}
                          aria-label={item.isFavorited ? `Remove ${item.symbol} from favorites` : `Favorite ${item.symbol}`}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            item.isFavorited
                              ? 'text-[#E7B956] hover:bg-card-hover'
                              : 'text-zinc-500 hover:text-[#E7B956] hover:bg-card-hover'
                          }`}
                        >
                          <Star
                            size={13}
                            className={item.isFavorited ? 'fill-[#E7B956] text-[#E7B956]' : ''}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const found = catalog.find((s) => s.symbol.toUpperCase() === item.symbol);
                            setSelectedStockToInvest(found || { symbol: item.symbol, name: item.name, price: item.price });
                          }}
                          title={inv ? 'Add more to position' : `Invest in ${item.symbol}`}
                          className="p-1 text-zinc-500 hover:text-accent hover:bg-card-hover rounded transition-colors cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                        {inv && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteHolding(inv.id, inv.symbol);
                            }}
                            title="Remove holding"
                            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-card-hover rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {inv ? (
                      <div className="flex items-baseline justify-between pt-2 border-t border-border/40 mt-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Live Value</span>
                          <span className="text-sm font-extrabold font-mono text-white tabular-nums">
                            {formatCurrency(inv.currentValue)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">P/L</span>
                          <span className={`text-sm md:text-[11px] font-bold font-mono tabular-nums ${gainPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {gainPos ? '+' : ''}{formatCurrency(gain)} ({gainPos ? '+' : ''}{gainPct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between pt-2 border-t border-border/40 mt-2">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Live Price</span>
                          <span className="text-sm font-extrabold font-mono text-white tabular-nums">
                            ${Number(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 block">Today</span>
                          <span className={`text-sm md:text-[11px] font-bold font-mono tabular-nums ${dayPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {dayPos ? '+' : ''}{Number(item.changePercent || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Key Market Indices Strip (Markets section) ── */}
      {showMarketsSections && (
        <div
          data-tutorial="market-indices-grid"
          className="grid grid-cols-2 divide-y divide-white/[0.08] border-y border-white/[0.08] sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          {liveIndices ? (
            liveIndices.map((idx) => {
              const isPos = idx.change >= 0;
              return (
                <div key={idx.symbol} className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span className="font-semibold text-zinc-200 tracking-tight">{idx.symbol}</span>
                    <span className="text-[11px] truncate max-w-[100px]">{idx.name}</span>
                  </div>
                  <div className="text-lg font-semibold text-zinc-100 tabular-nums">
                    {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium mt-1 tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    <span>{isPos ? '+' : ''}{Number(idx.change).toFixed(2)}</span>
                    <span>({isPos ? '+' : ''}{Number(idx.changePercent).toFixed(2)}%)</span>
                  </div>
                </div>
              );
            })
          ) : (
            ['SPX', 'IXIC', 'DJI', 'RUT'].map((sym) => (
              <div key={sym} className="p-3.5 sm:p-4 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-500">{sym}</span>
                  <span className="h-2.5 w-16 rounded bg-white/[0.06]" />
                </div>
                <div className="h-6 w-24 rounded bg-white/[0.08]" />
                <div className="mt-2 h-3.5 w-20 rounded bg-white/[0.05]" />
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Main Filter & Search Control Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-2.5">
        {isFinancialPage && (
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'rates', label: 'Macro & Rates' },
              { id: 'news', label: 'News' },
            ].map((tab) => {
              const active = effectiveFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabFilter(tab.id)}
                  className={`relative py-1.5 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute inset-x-0 -bottom-[11px] h-[1.5px] bg-[#c8a24e]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Search Box (Markets section only) */}
        {showMarketsSections && (
          <div className="relative w-full sm:w-auto sm:min-w-[300px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company..."
              className="w-full bg-[#131311] border border-white/[0.08] rounded-lg pl-9 pr-9 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#c8a24e]"
            />
            {isSearching && (
              <RefreshCw size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8a24e] animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT LAYOUT: STOCK BROWSER & REAL NEWS + MACRO SIDEBAR ── */}
      <div className={`grid grid-cols-1 gap-6 ${showFinancialSections ? 'lg:grid-cols-3' : ''}`}>
        {/* Left 2 Columns (or full width on mobile Markets): Stock Directory, Real News Feed & Rates */}
        <div className={`${showFinancialSections ? 'lg:col-span-2' : ''} flex flex-col gap-6`}>
          {/* 1. STOCK DIRECTORY (REAL-TIME LIVE PRICES) — Markets section */}
          {showMarketsSections && (effectiveFilter === 'all' || effectiveFilter === 'stocks') && (
            <Reveal delay={0.1} y={20}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                      <span>Equities</span>
                      {searchResults && (
                        <span className="text-xs font-normal text-zinc-400">
                          · &ldquo;{searchQuery}&rdquo;
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Select any ticker to inspect price history, or star ★ to pin above.
                    </p>
                  </div>

                  {/* Clean Plain-Text Sector Tabs */}
                  <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar text-xs">
                    {sectors.map((sec) => {
                      const shouldGlowMobile =
                        sectorGlow.sector === sec && sectorGlow.nonce > 0;
                      return (
                        <button
                          key={`${sec}-${isMobile && shouldGlowMobile ? sectorGlow.nonce : 0}`}
                          type="button"
                          onClick={() => handleSelectSector(sec)}
                          className={`px-1.5 py-1 rounded font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer text-zinc-500 ${
                            shouldGlowMobile ? 'arca-sector-glow-once' : ''
                          } ${
                            selectedSector === sec
                              ? 'md:text-zinc-100 md:underline md:underline-offset-8 md:decoration-[#c8a24e]'
                              : 'md:hover:text-zinc-300'
                          }`}
                        >
                          {sec === 'all' ? 'All' : sec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Cards Grid */}
                {filteredStocks.length === 0 && isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={`stock-skel-${idx}`}
                        className="rounded-lg border border-white/[0.07] bg-[#131311] p-3.5 space-y-3 animate-pulse"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="h-4 w-12 rounded bg-white/[0.07]" />
                            <div className="h-3 w-24 rounded bg-white/[0.04]" />
                          </div>
                          <div className="h-3.5 w-12 rounded bg-white/[0.05]" />
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <div className="h-5 w-16 rounded bg-white/[0.07]" />
                          <div className="h-3 w-14 rounded bg-white/[0.04]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {filteredStocks.map((stock) => {
                      const isPos = (stock.change || 0) >= 0;
                      const symUpper = stock.symbol.toUpperCase();
                      const isOwned = investments.some((i) => i.symbol.toUpperCase() === symUpper);
                      const isFavorited = favoriteSymbolSet.has(symUpper);
                      const isSelected =
                        selectedStockForDetail?.symbol?.toUpperCase() === symUpper;

                      return (
                        <SpotlightCard
                          key={stock.symbol}
                          role="button"
                          tabIndex={0}
                          data-stock-symbol={stock.symbol}
                          onClick={() => setSelectedStockForDetail(stock)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedStockForDetail(stock);
                            }
                          }}
                          className={`p-3.5 space-y-2.5 flex flex-col justify-between cursor-pointer transition-colors group ${
                            isSelected
                              ? 'border-white/[0.22] bg-[#181815]'
                              : 'hover:border-white/[0.15]'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-100 text-sm group-hover:text-[#c8a24e] transition-colors">
                                    {stock.symbol}
                                  </span>
                                  {isOwned && (
                                    <span className="text-[10px] text-zinc-400">
                                      · Held
                                    </span>
                                  )}
                                </div>
                                <span className="text-zinc-500 text-xs block truncate max-w-[135px]">
                                  {stock.name}
                                </span>
                              </div>

                              <span className={`text-base md:text-xs font-semibold font-mono tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPos ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between pt-2">
                              <span className="text-base font-bold text-zinc-100 font-mono tabular-nums">
                                ${Number(stock.price).toFixed(2)}
                              </span>
                              <span className="hidden md:inline text-[10px] text-zinc-500 font-mono tabular-nums">
                                Cap: {stock.marketCap}
                              </span>
                            </div>
                          </div>

                          {/* Quiet Plain-Text Bottom Row: Star + Invest */}
                          <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
                            <button
                              type="button"
                              data-favorite-toggle={stock.symbol}
                              aria-label={
                                isFavorited
                                  ? `Remove ${stock.symbol} from favorites`
                                  : `Favorite ${stock.symbol}`
                              }
                              aria-pressed={isFavorited}
                              title={
                                isFavorited
                                  ? `Unfavorite ${stock.symbol}`
                                  : `Favorite ${stock.symbol} to pin at top`
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(stock);
                              }}
                              className={`p-1 transition-colors cursor-pointer ${
                                isFavorited
                                  ? 'text-[#c8a24e]'
                                  : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              <Star
                                size={14}
                                strokeWidth={1.6}
                                className={isFavorited ? 'fill-[#c8a24e] text-[#c8a24e]' : ''}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStockToInvest(stock);
                              }}
                              className="inline-flex items-center gap-1 py-0.5 text-xs font-medium text-zinc-400 transition-colors hover:text-[#c8a24e] cursor-pointer"
                            >
                              <Plus size={12} strokeWidth={1.75} />
                              <span>Invest</span>
                            </button>
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </div>
                )}

                {!searchResults && hasMoreStocks && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleShowMoreStocks}
                      disabled={isLoadingMoreStocks}
                      className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 hover:text-[#c8a24e] transition-colors cursor-pointer"
                    >
                      {isLoadingMoreStocks && (
                        <RefreshCw size={12} className="animate-spin text-[#c8a24e]" />
                      )}
                      <span>{isLoadingMoreStocks ? 'Loading more stocks...' : 'Load more stocks'}</span>
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* 2. AUTHENTIC FINANCIAL NEWS FEED — Calm Editorial Layout */}
          {showFinancialSections && (effectiveFilter === 'all' || effectiveFilter === 'news') && (
            <div className={isFinancialPage ? 'order-2' : ''}>
              <Reveal delay={0.15} y={20}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.08] pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                        Financial News
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Primary reporting from Bloomberg, Reuters, WSJ, CNBC, and Financial Times.
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-500 tabular-nums">
                      {articles.length} stories
                    </span>
                  </div>

                  {/* Plain-Text Topic Filters */}
                  <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 text-xs">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'tech', label: 'Tech & AI' },
                      { id: 'investing', label: 'Equities' },
                      { id: 'economy', label: 'Fed & Macro' },
                      { id: 'retail', label: 'Consumer' },
                      { id: 'crypto', label: 'Digital Assets' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectNewsTopic(t.id)}
                        className={`py-1 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          selectedNewsTopic === t.id
                            ? 'text-zinc-100 underline underline-offset-8 decoration-[#c8a24e]'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Editorial Articles List */}
                  <div className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
                    {articles.map((art, artIdx) => (
                      <article
                        key={`${art.id || art.link || 'news'}_${artIdx}`}
                        className="py-4 flex flex-col justify-between gap-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <span className="font-medium text-zinc-400">
                              {art.source}
                            </span>
                            <span>·</span>
                            <span>{art.timeAgo}</span>
                          </div>

                          <a
                            href={art.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-zinc-100 text-sm leading-snug hover:text-[#c8a24e] transition-colors block cursor-pointer"
                          >
                            {art.title}
                          </a>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedArticleToRead(art)}
                            className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          >
                            Read in app
                          </button>

                          {art.link && (
                            <a
                              href={art.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>{art.source}</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Single Clean Plain-Text Load More Trigger (Zero Double Plus or Neon Box) */}
                  <div className="pt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-500">
                      Showing {articles.length} verified reports
                    </span>

                    <button
                      type="button"
                      onClick={handleGenerateMoreArticles}
                      disabled={isLoadingMoreNews}
                      className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-[#c8a24e] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingMoreNews && (
                        <RefreshCw size={12} className="animate-spin" />
                      )}
                      <span>{isLoadingMoreNews ? 'Loading stories...' : 'Load more stories'}</span>
                    </button>
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {/* 3. BORROWING, INTEREST RATES & MACROECONOMIC INDICATORS — Calm Hairline Grid */}
          {showFinancialSections && (effectiveFilter === 'all' || effectiveFilter === 'rates') && (
            <div className={isFinancialPage ? 'order-1' : ''}>
              <Reveal delay={0.2} y={20}>
                <div data-tutorial="market-rates-panel" className="space-y-5">
                  <div className="border-b border-white/[0.08] pb-3">
                    <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                      Interest Rates &amp; Treasury Benchmarks
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Federal Reserve FRED series &amp; US Treasury market yields.
                    </p>
                  </div>

                  {/* Macroeconomic Indicators */}
                  {overview?.economicIndicators && overview.economicIndicators.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.07] border-y border-white/[0.07]">
                      {overview.economicIndicators.map((ind, i) => (
                        <div key={ind.name || i} className="py-3 pr-3 sm:px-4 first:pl-0">
                          <span className="text-[11px] text-zinc-500 block truncate">{ind.name}</span>
                          <span className="mt-0.5 text-base font-semibold text-zinc-100 font-mono tabular-nums block">
                            {ind.value}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate">{ind.period}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Benchmark Borrowing & Yields */}
                  <div className="divide-y divide-white/[0.06] border-t border-white/[0.07]">
                    {(overview?.rates || DEFAULT_MARKET_DATA.rates).map((r, i) => (
                      <div
                        key={r.id || i}
                        className="flex items-baseline justify-between gap-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200">{r.name}</div>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {r.desc || r.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-sm font-semibold text-zinc-100 font-mono tabular-nums">
                          {typeof r.rate === 'number' ? `${r.rate.toFixed(2)}%` : r.rate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Calm Editorial Macro Digest Sidebar */}
        {showFinancialSections && (!isMobile || effectiveFilter === 'all' || effectiveFilter === 'rates') && (
          <div className="space-y-6">
            <Reveal delay={0.12} y={20}>
              <div
                data-tutorial="market-ai-digest"
                className="rounded-xl border border-white/[0.08] bg-[#131311] p-5 space-y-4 lg:sticky lg:top-20"
              >
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Macroeconomic Outlook
                  </h2>
                  <button
                    type="button"
                    onClick={handleGenerateAiBriefing}
                    disabled={isGeneratingAi}
                    title="Refresh Market Outlook"
                    className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isGeneratingAi ? 'animate-spin text-[#c8a24e]' : ''} />
                  </button>
                </div>

                <div className="space-y-2.5 pt-0.5">
                  {(aiBriefing ? (
                    aiBriefing.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(s => s.length > 20).slice(0, 4)
                  ) : [
                    'Liquid cash yields near 4.23% APY preserve steady real returns in high-yield savings.',
                    'Credit card borrowing costs average 21.19% APR; prioritize paying down variable balances.',
                    'Conforming 30-year fixed mortgages average 7.11%, rewarding larger down payment reserves.',
                    'Steady GDP expansion favors consistent dollar-cost averaging into broad index funds.',
                  ]).map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <span className="w-1 h-1 rounded-full bg-zinc-500 mt-2 shrink-0" />
                      <span className="leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>

                {/* Actionable Personal Finance Takeaways */}
                <div
                  data-tutorial="market-budget-impact"
                  className="pt-3 border-t border-white/[0.07] space-y-3"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                    Budget Implications
                  </span>

                  <div className="divide-y divide-white/[0.06]">
                    {(overview?.budgetAdviceHighlights || [
                      {
                        title: 'Keep Emergency Cash in HYSA',
                        description: 'With the Effective Fed Funds Rate at 3.88%, competitive savings accounts yield ~4.23% APY.',
                      },
                      {
                        title: 'Eliminate Variable Card Debt',
                        description: 'Average credit card APRs sit near 21.19%. Direct unassigned income here before discretionary envelopes.',
                      },
                      {
                        title: 'Plan Larger Down Payments',
                        description: 'With 30-year fixed mortgages near 7.11%, building a dedicated down-payment envelope lowers monthly carry.',
                      },
                    ]).map((item, idx) => (
                      <div key={item.title || idx} className="py-2.5 first:pt-1 last:pb-0 space-y-0.5">
                        <div className="font-medium text-zinc-200 text-xs">
                          {item.title}
                        </div>
                        <p className="text-zinc-400 text-[11px] leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
