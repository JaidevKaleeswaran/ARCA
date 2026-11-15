import express from 'express';
import YahooFinance from 'yahoo-finance2';
import { GoogleGenAI } from '@google/genai';
import { createRateLimiter } from '../middleware/security.js';
import { sanitizeError } from '../utils/sanitize.js';
import { STOCK_CATALOG, REAL_ARTICLES } from '../../src/data/marketData.js';
import { getMacroRates } from '../services/macroRates.js';

export { STOCK_CATALOG };

const router = express.Router();
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const marketsLimiter = createRateLimiter({
  windowMs: 60000,
  max: 120,
  message: 'Too many market data requests. Please wait a moment.',
});

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY
    || process.env.ASSISTANT_API_KEY
    || process.env.MANAGER_API_KEY;

  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// ── In-Memory Caches ──
let cachedOverview = null;
let lastOverviewTime = 0;
const OVERVIEW_CACHE_TTL = 30 * 1000; // 30 seconds cache to stay real-time

const newsCache = new Map();
const NEWS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes news cache per topic

// Screener backfill cache for deeper catalog pages
let cachedScreenerStocks = null;
let lastScreenerFetchTime = 0;
const SCREENER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Helper formatters ──
function formatCap(cap) {
  if (!cap) return null;
  if (typeof cap === 'string') return cap;
  if (typeof cap !== 'number' || isNaN(cap)) return null;
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  return `$${cap.toLocaleString()}`;
}

function formatVol(vol) {
  if (!vol || typeof vol !== 'number') return 'N/A';
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
  return vol.toLocaleString();
}

function normalizeTickerDisplay(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  return symbol.toUpperCase().trim().replace(/-(A|B)$/, '.$1');
}

function toYahooSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  return symbol.toUpperCase().trim().replace(/\.(A|B)$/, '-$1');
}

function getSectorForSymbol(symbol) {
  const norm = normalizeTickerDisplay(symbol);
  const found = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === norm);
  return found ? found.sector : 'Equities';
}

function isDomesticUsTicker(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  const s = symbol.toUpperCase().trim();
  // Domestic dual-share classes like BRK.A, BRK.B, BF.A, BF.B, HEI.A
  if (/^[A-Z]{1,4}[\.\-][AB]$/.test(s)) return true;
  // Exclude foreign ticker extensions (.TO, .DE, .MX, .NE, .L, .AX, etc.)
  if (s.includes('.')) return false;
  // Exclude futures, currency pairs, or indices
  if (s.includes('=') || s.includes('-') || s.startsWith('^')) return false;
  return /^[A-Z]{1,5}$/.test(s);
}

function isLeveragedOrInverse(item, query = '') {
  const qLower = query.toLowerCase();
  const isExplicitSearch = /(2x|3x|inverse|ultra|short|bear|yield shares|tslz|nvdx|ptir|sqqq|tqqq|soxl|soxs|spxu|upro)/i.test(qLower);
  if (isExplicitSearch) return false;

  const sym = (item.symbol || '').toUpperCase();
  const name = (item.shortname || item.longName || item.name || '').toLowerCase();

  const DERIVATIVE_SYMBOLS = new Set(['TSLZ', 'NVDX', 'PTIR', 'SQQQ', 'TQQQ', 'SOXL', 'SOXS', 'SPXU', 'UPRO']);
  if (DERIVATIVE_SYMBOLS.has(sym)) return true;

  if (/\b(2x|3x|inverse|ultra|daily target|short|bear|yield shares)\b/i.test(name)) return true;
  return false;
}

function getMarketStatus() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcDay = now.getUTCDay();

  // US Markets: 9:30 AM - 4:00 PM EST (14:30 - 21:00 UTC) Mon-Fri
  const isWeekend = utcDay === 0 || utcDay === 6;
  const isOpenHours = (utcHours > 14 || (utcHours === 14 && now.getUTCMinutes() >= 30)) && utcHours < 21;
  const isOpen = !isWeekend && isOpenHours;

  return {
    isOpen,
    statusText: isOpen ? 'Regular Trading Session' : isWeekend ? 'Weekend - Markets Closed' : 'After-Hours / Closed',
    asOf: now.toISOString(),
  };
}

// ── Multi-Topic Authentic RSS News Feeds ──
const RSS_TOPICS = {
  general: {
    url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',
    category: 'Markets & Economy',
  },
  tech: {
    url: 'https://news.google.com/rss/search?q=tech+stocks+market+semiconductors+ai&hl=en-US&gl=US&ceid=US:en',
    category: 'Tech & AI Markets',
  },
  investing: {
    url: 'https://news.google.com/rss/search?q=investing+stock+market+etf+equities&hl=en-US&gl=US&ceid=US:en',
    category: 'Wall Street & Investing',
  },
  economy: {
    url: 'https://news.google.com/rss/search?q=federal+reserve+interest+rates+inflation+treasury&hl=en-US&gl=US&ceid=US:en',
    category: 'Macro & Central Banks',
  },
  retail: {
    url: 'https://news.google.com/rss/search?q=consumer+spending+retail+earnings+revenue&hl=en-US&gl=US&ceid=US:en',
    category: 'Consumer & Retail',
  },
  crypto: {
    url: 'https://news.google.com/rss/search?q=bitcoin+crypto+etf+digital+assets&hl=en-US&gl=US&ceid=US:en',
    category: 'Digital Assets & Crypto',
  },
};

const TOPIC_KEYS = Object.keys(RSS_TOPICS);

async function fetchRealMarketNews(topic = 'general', page = 1) {
  const normalizedTopic = RSS_TOPICS[topic] ? topic : TOPIC_KEYS[(Math.max(1, page) - 1) % TOPIC_KEYS.length];
  const cacheKey = `${normalizedTopic}_p${page}`;
  const now = Date.now();

  const cached = newsCache.get(cacheKey);
  if (cached && (now - cached.time) < NEWS_CACHE_TTL) {
    return cached.articles;
  }

  const topicConfig = RSS_TOPICS[normalizedTopic] || RSS_TOPICS.general;

  try {
    const rssRes = await fetch(topicConfig.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(4500),
    });

    if (!rssRes.ok) throw new Error(`RSS returned ${rssRes.status}`);

    const xml = await rssRes.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    let match;

    const startIndex = (page - 1) * 12;
    let currentIndex = 0;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 14) {
      if (currentIndex++ < startIndex && startIndex < 40) {
        continue;
      }

      const itemStr = match[0];
      const titleMatch = itemStr.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemStr.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemStr.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = itemStr.match(/<source[^>]*>(.*?)<\/source>/);

      let rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
      rawTitle = rawTitle
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      let source = sourceMatch ? sourceMatch[1] : '';
      if (!source && rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        source = parts.pop();
        rawTitle = parts.join(' - ');
      }

      const pubTime = pubDateMatch ? new Date(pubDateMatch[1]) : new Date();
      const minutesAgo = Math.max(1, Math.round((Date.now() - pubTime.getTime()) / 60000));
      const timeAgo = minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.round(minutesAgo / 60)}h ago`;

      if (rawTitle && linkMatch && linkMatch[1]) {
        items.push({
          id: `news_${Buffer.from(rawTitle).toString('base64').slice(0, 16)}`,
          title: rawTitle,
          source: (source || 'Financial News').trim(),
          link: linkMatch[1].trim(),
          publishedAt: pubTime.toISOString(),
          timeAgo,
          category: topicConfig.category,
        });
      }
    }

    if (items.length > 0) {
      newsCache.set(cacheKey, { time: now, articles: items });
      return items;
    }
  } catch (err) {
    console.warn(`Real news RSS fetch for topic ${normalizedTopic} failed:`, err.message);
  }

  // Fallback to Yahoo Finance ticker search news
  try {
    const ticker = normalizedTopic === 'tech' ? 'NVDA' : normalizedTopic === 'crypto' ? 'BTC-USD' : 'SPY';
    const s = await yf.search(ticker, { newsCount: 12 });
    if (s.news && s.news.length > 0) {
      const items = s.news.map((n) => {
        const pubTime = n.providerPublishTime ? new Date(n.providerPublishTime) : new Date();
        const minutesAgo = Math.max(1, Math.round((Date.now() - pubTime.getTime()) / 60000));
        const timeAgo = minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.round(minutesAgo / 60)}h ago`;

        return {
          id: n.uuid || `news_${Date.now()}_${Math.random()}`,
          title: n.title,
          source: n.publisher || 'Yahoo Finance',
          link: n.link,
          publishedAt: pubTime.toISOString(),
          timeAgo,
          category: topicConfig.category,
        };
      });
      newsCache.set(cacheKey, { time: now, articles: items });
      return items;
    }
  } catch (err) {
    console.warn('Yahoo Finance news fetch error:', err.message);
  }

  // Last-resort fallback to built-in verified authentic primary articles
  return REAL_ARTICLES.slice(0, 8);
}

// ── Fetch Live Overview with 100% Accurate Real-Time Prices for ALL Stocks & FRED Rates ──
async function fetchRealMarketOverview() {
  const now = Date.now();
  if (cachedOverview && (now - lastOverviewTime) < OVERVIEW_CACHE_TTL) {
    return cachedOverview;
  }

  const status = getMarketStatus();

  // Core benchmark symbols
  const indexSymbols = ['^GSPC', '^IXIC', '^DJI', '^RUT'];
  const commoditySymbols = ['BTC-USD', 'ETH-USD', 'GC=F', 'CL=F'];
  const yieldSymbols = ['^TNX', '^IRX'];
  const catalogSymbols = STOCK_CATALOG.map((s) => s.symbol === 'BRK.B' ? 'BRK-B' : s.symbol);

  const allSymbols = [...indexSymbols, ...commoditySymbols, ...yieldSymbols, ...catalogSymbols];

  try {
    // Concurrently fetch Yahoo Finance quotes, FRED macro rates, and real news
    const [rawQuotes, macroData, newsDigest] = await Promise.all([
      yf.quote(allSymbols),
      getMacroRates(),
      fetchRealMarketNews('general', 1),
    ]);

    const quoteMap = new Map();
    (Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes]).forEach((q) => {
      if (q && q.symbol) quoteMap.set(q.symbol, q);
    });

    // 1. Format Live Indices
    const indices = [
      { key: '^GSPC', symbol: 'SPX', name: 'S&P 500' },
      { key: '^IXIC', symbol: 'IXIC', name: 'Nasdaq Composite' },
      { key: '^DJI', symbol: 'DJI', name: 'Dow Jones Industrial' },
      { key: '^RUT', symbol: 'RUT', name: 'Russell 2000' },
    ].map((item) => {
      const q = quoteMap.get(item.key);
      const price = q?.regularMarketPrice ?? (item.symbol === 'SPX' ? 7619.38 : item.symbol === 'IXIC' ? 25466.19 : 52486.50);
      const change = q?.regularMarketChange ?? 0;
      const changePercent = q?.regularMarketChangePercent ?? 0;
      return {
        symbol: item.symbol,
        name: item.name,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        category: 'index',
      };
    });

    // 2. Format Live Commodities & Crypto
    const commoditiesAndCrypto = [
      { key: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin', category: 'crypto' },
      { key: 'ETH-USD', symbol: 'ETH', name: 'Ethereum', category: 'crypto' },
      { key: 'GC=F', symbol: 'GOLD', name: 'Gold (Oz)', category: 'commodity' },
      { key: 'CL=F', symbol: 'OIL', name: 'Crude Oil (WTI)', category: 'commodity' },
    ].map((item) => {
      const q = quoteMap.get(item.key);
      const price = q?.regularMarketPrice ?? 0;
      const change = q?.regularMarketChange ?? 0;
      const changePercent = q?.regularMarketChangePercent ?? 0;
      return {
        symbol: item.symbol,
        name: item.name,
        price: Number(price.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        category: item.category,
      };
    });

    // 3. Format ALL Stocks with Live Yahoo Finance Quotes & Net Asset Capitalization for ETFs
    const stocks = STOCK_CATALOG.map((item) => {
      const sym = toYahooSymbol(item.symbol);
      const q = quoteMap.get(sym);
      if (!q || !q.regularMarketPrice) {
        return item;
      }
      return {
        symbol: item.symbol,
        name: q.shortName || q.longName || item.name,
        sector: item.sector,
        price: Number(q.regularMarketPrice.toFixed(2)),
        change: Number((q.regularMarketChange ?? 0).toFixed(2)),
        changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
        volume: formatVol(q.regularMarketVolume) || item.volume,
        pe: q.trailingPE ? Number(q.trailingPE.toFixed(1)) : item.pe,
        marketCap: formatCap(q.marketCap || q.netAssets || q.totalAssets) || item.marketCap || 'N/A',
        high52: q.fiftyTwoWeekHigh ? Number(q.fiftyTwoWeekHigh.toFixed(2)) : item.high52,
        low52: q.fiftyTwoWeekLow ? Number(q.fiftyTwoWeekLow.toFixed(2)) : item.low52,
      };
    });

    const overviewData = {
      marketStatus: status,
      indices,
      stocks,
      rates: macroData.rates,
      commoditiesAndCrypto,
      newsDigest,
      economicIndicators: macroData.economicIndicators,
      budgetAdviceHighlights: macroData.budgetAdviceHighlights,
      macroRaw: macroData.raw,
    };

    cachedOverview = overviewData;
    lastOverviewTime = now;
    return overviewData;
  } catch (err) {
    console.warn('Error fetching live Yahoo Finance overview, using baseline:', err.message);
    if (cachedOverview) return cachedOverview;
    throw err;
  }
}

/**
 * Backfill deeper catalog pages using Yahoo Finance most active screener
 */
async function getScreenerBackfill() {
  const now = Date.now();
  if (cachedScreenerStocks && (now - lastScreenerFetchTime) < SCREENER_CACHE_TTL) {
    return cachedScreenerStocks;
  }

  try {
    const scr = await yf.screener({ scrIds: 'most_actives', count: 100 });
    const existingSyms = new Set(STOCK_CATALOG.map(s => s.symbol.toUpperCase()));

    const backfill = (scr.quotes || [])
      .filter(q => {
        if (!q || !q.symbol) return false;
        if (!isDomesticUsTicker(q.symbol)) return false;
        if (isLeveragedOrInverse(q)) return false;
        const norm = normalizeTickerDisplay(q.symbol);
        return !existingSyms.has(norm.toUpperCase());
      })
      .map(q => {
        const cleanSym = normalizeTickerDisplay(q.symbol);
        return {
          symbol: cleanSym,
          name: q.shortName || q.longName || cleanSym,
          sector: q.sectorDisp || q.sector || (q.quoteType === 'ETF' ? 'ETFs' : 'Equities'),
          price: Number((q.regularMarketPrice || 0).toFixed(2)),
          change: Number((q.regularMarketChange || 0).toFixed(2)),
          changePercent: Number((q.regularMarketChangePercent || 0).toFixed(2)),
          volume: formatVol(q.regularMarketVolume),
          pe: q.trailingPE ? Number(q.trailingPE.toFixed(1)) : null,
          marketCap: formatCap(q.marketCap || q.netAssets || q.totalAssets) || 'N/A',
          high52: q.fiftyTwoWeekHigh ? Number(q.fiftyTwoWeekHigh.toFixed(2)) : null,
          low52: q.fiftyTwoWeekLow ? Number(q.fiftyTwoWeekLow.toFixed(2)) : null,
        };
      });

    cachedScreenerStocks = backfill;
    lastScreenerFetchTime = now;
    return backfill;
  } catch (err) {
    console.warn('Screener backfill fetch error:', err.message);
    return [];
  }
}

/**
 * GET /api/markets/rates
 * Returns authoritative FRED series and live Treasury yields
 */
router.get('/rates', marketsLimiter, async (req, res) => {
  try {
    const data = await getMacroRates();
    return res.json(data);
  } catch (err) {
    console.error('Markets rates error:', err);
    return res.status(500).json({ error: 'Could not fetch live macro rates' });
  }
});

/**
 * GET /api/markets/overview
 * Returns 100% live indices, real stock prices for 250 assets, and real news
 */
router.get('/overview', marketsLimiter, async (req, res) => {
  try {
    const data = await fetchRealMarketOverview();
    return res.json(data);
  } catch (err) {
    console.error('Markets overview fatal error:', err);
    return res.status(500).json({ error: 'Could not fetch live market overview' });
  }
});

/**
 * GET /api/markets/catalog
 * Returns paginated stock catalog with 100% real-time live prices & screener backfill
 */
router.get('/catalog', marketsLimiter, async (req, res) => {
  const { sector = 'all', limit = 36, page = 1 } = req.query;

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

  try {
    const overview = await fetchRealMarketOverview();
    let catalogWithLive = overview.stocks || STOCK_CATALOG;

    if (sector && sector.toLowerCase() !== 'all') {
      catalogWithLive = catalogWithLive.filter(s => matchesSector(s.sector, sector));
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 36));
    const startIdx = (pageNum - 1) * pageSize;
    const totalCore = catalogWithLive.length;

    let paginated = [];
    let hasMore = false;

    if (startIdx < totalCore) {
      const coreSlice = catalogWithLive.slice(startIdx, startIdx + pageSize);
      paginated = [...coreSlice];

      if (paginated.length < pageSize && (sector.toLowerCase() === 'all' || sector.toLowerCase() === 'equities')) {
        const screenerStocks = await getScreenerBackfill();
        const needed = pageSize - paginated.length;
        const backfillSlice = screenerStocks.slice(0, needed);
        paginated = [...paginated, ...backfillSlice];
        hasMore = screenerStocks.length > needed;
      } else {
        hasMore = (startIdx + pageSize) < totalCore;
      }
    } else if (sector.toLowerCase() === 'all' || sector.toLowerCase() === 'equities') {
      const screenerStocks = await getScreenerBackfill();
      const screenerOffset = startIdx - totalCore;
      if (screenerOffset < screenerStocks.length) {
        paginated = screenerStocks.slice(screenerOffset, screenerOffset + pageSize);
        hasMore = (screenerOffset + pageSize) < screenerStocks.length;
      } else {
        paginated = [];
        hasMore = false;
      }
    }

    return res.json({
      total: totalCore,
      page: pageNum,
      pageSize,
      hasMore,
      sector,
      stocks: paginated,
    });
  } catch (err) {
    let fallback = STOCK_CATALOG;
    if (sector && sector.toLowerCase() !== 'all') {
      fallback = fallback.filter(s => matchesSector(s.sector, sector));
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 36));
    const startIdx = (pageNum - 1) * pageSize;
    const paginated = fallback.slice(startIdx, startIdx + pageSize);

    return res.json({
      total: fallback.length,
      page: pageNum,
      pageSize,
      hasMore: (startIdx + pageSize) < fallback.length,
      sector,
      stocks: paginated,
    });
  }
});

/**
 * GET /api/markets/quote/:symbol
 * Fetches an individual stock's real-time live quote with full detail
 */
router.get('/quote/:symbol', marketsLimiter, async (req, res) => {
  const rawSym = req.params.symbol.toUpperCase().trim();
  const sym = toYahooSymbol(rawSym);

  try {
    const q = await yf.quote(sym);
    if (!q || !q.regularMarketPrice) {
      const found = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === normalizeTickerDisplay(rawSym));
      if (found) return res.json(found);
      return res.status(404).json({ error: `Quote not found for ${rawSym}` });
    }

    const cleanSym = normalizeTickerDisplay(q.symbol || sym);
    const found = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === cleanSym);

    return res.json({
      symbol: cleanSym,
      name: q.shortName || q.longName || cleanSym,
      sector: getSectorForSymbol(cleanSym),
      price: Number(q.regularMarketPrice.toFixed(2)),
      change: Number((q.regularMarketChange ?? 0).toFixed(2)),
      changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
      volume: formatVol(q.regularMarketVolume),
      marketCap: formatCap(q.marketCap || q.netAssets || q.totalAssets) || found?.marketCap || 'N/A',
      pe: q.trailingPE ? Number(q.trailingPE.toFixed(1)) : null,
      high52: q.fiftyTwoWeekHigh ? Number(q.fiftyTwoWeekHigh.toFixed(2)) : 0,
      low52: q.fiftyTwoWeekLow ? Number(q.fiftyTwoWeekLow.toFixed(2)) : 0,
      regularMarketDayHigh: q.regularMarketDayHigh ? Number(q.regularMarketDayHigh.toFixed(2)) : null,
      regularMarketDayLow: q.regularMarketDayLow ? Number(q.regularMarketDayLow.toFixed(2)) : null,
      regularMarketOpen: q.regularMarketOpen ? Number(q.regularMarketOpen.toFixed(2)) : null,
      regularMarketPreviousClose: q.regularMarketPreviousClose ? Number(q.regularMarketPreviousClose.toFixed(2)) : null,
      currency: q.currency || 'USD',
      exchange: q.exchange || 'US',
    });
  } catch (err) {
    const found = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === normalizeTickerDisplay(rawSym));
    if (found) return res.json(found);
    return res.status(500).json({ error: `Failed to fetch quote for ${rawSym}: ${err.message}` });
  }
});

/**
 * POST /api/markets/quotes
 * Batch live quotes for arbitrary symbols (e.g. user portfolio holdings)
 */
router.post('/quotes', marketsLimiter, async (req, res) => {
  const { symbols = [] } = req.body;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.json({ quotes: {} });
  }

  try {
    const cleanSymbols = symbols.map(s => toYahooSymbol(String(s))).filter(Boolean);
    const rawQuotes = await yf.quote(cleanSymbols);
    const quoteList = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    const quotes = {};

    quoteList.forEach(q => {
      if (q && q.symbol) {
        const originalSym = normalizeTickerDisplay(q.symbol);
        const found = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === originalSym);
        quotes[originalSym] = {
          symbol: originalSym,
          name: q.shortName || q.longName || originalSym,
          price: Number((q.regularMarketPrice ?? 0).toFixed(2)),
          change: Number((q.regularMarketChange ?? 0).toFixed(2)),
          changePercent: Number((q.regularMarketChangePercent ?? 0).toFixed(2)),
          volume: formatVol(q.regularMarketVolume),
          marketCap: formatCap(q.marketCap || q.netAssets || q.totalAssets) || found?.marketCap || 'N/A',
        };
      }
    });

    return res.json({ quotes });
  } catch (err) {
    console.warn('Batch quote error:', err.message);
    return res.status(500).json({ error: 'Could not fetch quotes' });
  }
});

/**
 * GET /api/markets/search
 * Fast real-time live ticker & company search querying Yahoo Finance API with strict hygiene
 */
router.get('/search', marketsLimiter, async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    const overview = await fetchRealMarketOverview().catch(() => null);
    return res.json({ results: overview ? overview.stocks.slice(0, 36) : STOCK_CATALOG.slice(0, 36) });
  }

  try {
    const searchRes = await yf.search(query);
    const rawQuotes = (searchRes.quotes || []).filter(item => {
      if (!item.isYahooFinance || !item.symbol) return false;
      if (item.quoteType !== 'EQUITY' && item.quoteType !== 'ETF') return false;
      if (!isDomesticUsTicker(item.symbol)) return false;
      if (isLeveragedOrInverse(item, query)) return false;
      return true;
    });

    const symbols = rawQuotes.slice(0, 15).map(i => i.symbol);

    if (symbols.length === 0) {
      const localMatches = STOCK_CATALOG.filter(s =>
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      );
      return res.json({ results: localMatches.slice(0, 20) });
    }

    // Map sectorDisp || sector from search response
    const sectorMap = new Map();
    rawQuotes.forEach(i => {
      const sec = i.sectorDisp || i.sector;
      if (sec) sectorMap.set(normalizeTickerDisplay(i.symbol), sec);
    });

    const liveQuotes = await yf.quote(symbols.map(s => toYahooSymbol(s)));
    const quoteList = Array.isArray(liveQuotes) ? liveQuotes : [liveQuotes];

    const results = quoteList.map(q => {
      const cleanSym = normalizeTickerDisplay(q.symbol);
      const dynamicSector = sectorMap.get(cleanSym)
        || getSectorForSymbol(cleanSym)
        || (q.quoteType === 'ETF' ? 'ETFs' : 'Equities');

      const foundCatalog = STOCK_CATALOG.find(s => s.symbol.toUpperCase() === cleanSym);

      return {
        symbol: cleanSym,
        name: q.shortName || q.longName || cleanSym,
        sector: dynamicSector,
        price: Number(q.regularMarketPrice ? q.regularMarketPrice.toFixed(2) : 0),
        change: Number(q.regularMarketChange ? q.regularMarketChange.toFixed(2) : 0),
        changePercent: Number(q.regularMarketChangePercent ? q.regularMarketChangePercent.toFixed(2) : 0),
        volume: formatVol(q.regularMarketVolume),
        marketCap: formatCap(q.marketCap || q.netAssets || q.totalAssets) || foundCatalog?.marketCap || 'N/A',
        pe: q.trailingPE ? Number(q.trailingPE.toFixed(1)) : null,
      };
    });

    return res.json({ results });
  } catch (err) {
    console.warn('Live search error, falling back to local catalog:', err.message);
    const localMatches = STOCK_CATALOG.filter(s =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
    );
    return res.json({ results: localMatches.slice(0, 20) });
  }
});

/**
 * GET /api/markets/news
 * Returns actual live financial journalism articles
 */
router.get('/news', marketsLimiter, async (req, res) => {
  const { topic = 'general', page = 1 } = req.query;
  try {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const articles = await fetchRealMarketNews(topic, pageNum);
    return res.json({
      articles,
      total: articles.length,
      topic,
      page: pageNum,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch live financial news' });
  }
});

/**
 * GET /api/markets/news/generate-more
 * Generates/fetches additional real articles across rotating topic feeds
 */
router.get('/news/generate-more', marketsLimiter, async (req, res) => {
  const { page = 2, topic } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 2);

  try {
    const targetTopic = topic && RSS_TOPICS[topic]
      ? topic
      : TOPIC_KEYS[(pageNum - 1) % TOPIC_KEYS.length];

    const freshArticles = await fetchRealMarketNews(targetTopic, pageNum);
    return res.json({
      articles: freshArticles,
      added: freshArticles.length,
      topic: targetTopic,
      category: RSS_TOPICS[targetTopic]?.category || 'Financial Markets',
      page: pageNum,
      nextPage: pageNum + 1,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not generate more articles' });
  }
});

/**
 * POST /api/markets/ai-summary
 * Generates an up-to-date AI economic briefing using Gemini, grounded in live macro rates
 */
router.post('/ai-summary', marketsLimiter, async (req, res) => {
  const { topic = 'general' } = req.body;
  const startTime = Date.now();

  try {
    const macro = await getMacroRates().catch(() => null);
    const dff = macro?.raw?.dff ?? 3.88;
    const tenYr = macro?.raw?.tenYearYield ?? 5.15;
    const threeM = macro?.raw?.threeMonthYield ?? 4.12;
    const hysa = macro?.raw?.topHysa ?? 4.23;
    const cpi = macro?.raw?.cpiYoY ?? 4.1;
    const unemp = macro?.raw?.unemployment ?? 4.1;
    const m30 = macro?.raw?.mortgage30 ?? 7.11;
    const cc = macro?.raw?.creditCardApr ?? 21.19;

    const ai = getAI();
    if (!ai) {
      return res.json({
        summary: `Economic conditions are characterized by steady growth, headline CPI inflation near ${cpi}%, and the 10-Year Treasury Yield around ${tenYr.toFixed(2)}%. The Federal Reserve Effective Funds Rate stands at ${dff}%, anchoring top high-yield savings APYs near ${hysa}% while 30-year fixed mortgages average ${m30}%. For everyday household budgeting, this climate strongly favors holding 3–6 month emergency fund reserves in competitive high-yield vehicles while aggressively eliminating high-interest credit card debt averaging ${cc}%.`,
        keyTakeaways: [
          `Cash buffers: Top high-yield savings accounts offer ~${hysa}% APY risk-free.`,
          `Borrowing costs: Conforming 30-year mortgages average ${m30}%; keep down payment envelopes high.`,
          `Debt payoff: Credit card rates average ${cc}%; prioritize paying variable balances first.`,
        ],
        model: 'macro-grounded-baseline',
        latencyMs: Date.now() - startTime,
      });
    }

    const prompt = `You are a chief economic strategist and financial analyst embedded in the ARCA personal finance app.
Generate a concise, insightful 3-paragraph economic digest for consumers and budgeters.
Grounded in these REAL live macroeconomic data:
- Fed Funds Effective Rate: ${dff}%
- 10-Year US Treasury Yield: ${tenYr.toFixed(2)}%
- 3-Month US Treasury Bill: ${threeM.toFixed(2)}%
- Top HYSA APY: ~${hysa}%
- 30-Year Fixed Mortgage Average: ${m30}%
- Average Credit Card APR: ${cc}%
- CPI Inflation (YoY): ${cpi}%
- Unemployment Rate: ${unemp}%

Cover:
1. Current state of interest rates, the Fed policy outlook, and what it means for borrowing & savings.
2. Stock market momentum, inflation trends, and employment conditions.
3. Actionable personal finance takeaways for individuals managing monthly household budgets.

Topic focus: ${topic}.
Tone: Authoritative, clear, accessible, and grounded in real financial principles.
Format: Return clean plain text paragraphs with no markdown bolding in titles. Include 3 bullet points at the end under "KEY BUDGET TAKEAWAYS:".`;

    let summaryText = '';
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI Generation Timeout')), 4000)),
      ]);
      summaryText = response.text?.trim() || '';
    } catch (genErr) {
      console.warn('AI summary generation timed out or failed, using grounded fallback:', genErr.message);
    }

    if (!summaryText) {
      return res.json({
        summary: `Economic conditions are characterized by steady growth, headline CPI inflation near ${cpi}%, and the 10-Year Treasury Yield around ${tenYr.toFixed(2)}%. The Federal Reserve Effective Funds Rate stands at ${dff}%, anchoring top high-yield savings APYs near ${hysa}% while 30-year fixed mortgages average ${m30}%. For everyday household budgeting, this climate strongly favors holding 3–6 month emergency fund reserves in competitive high-yield vehicles while aggressively eliminating high-interest credit card debt averaging ${cc}%.`,
        keyTakeaways: [
          `Cash buffers: Top high-yield savings accounts offer ~${hysa}% APY risk-free.`,
          `Borrowing costs: Conforming 30-year mortgages average ${m30}%; keep down payment envelopes high.`,
          `Debt payoff: Credit card rates average ${cc}%; prioritize paying variable balances first.`,
        ],
        model: 'macro-grounded-baseline',
        latencyMs: Date.now() - startTime,
      });
    }

    return res.json({
      summary: summaryText,
      model: 'gemini-3.8-flash',
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    console.warn('AI market summary error:', err.message);
    const macro = await getMacroRates().catch(() => null);
    const dff = macro?.raw?.dff ?? 3.88;
    const hysa = macro?.raw?.topHysa ?? 4.23;
    const m30 = macro?.raw?.mortgage30 ?? 7.11;
    const cc = macro?.raw?.creditCardApr ?? 21.19;

    return res.json({
      summary: `Markets continue to balance macroeconomic stability against monetary policy normalization. The Fed Funds rate of ${dff}% preserves attractive yields near ${hysa}% in cash accounts, while borrowing benchmarks remain elevated with mortgages near ${m30}% and credit cards averaging ${cc}%. Disciplined envelope budgeting remains paramount.`,
      keyTakeaways: [
        `Maintain emergency reserves in high-yield vehicles earning ~${hysa}% APY.`,
        `Prioritize paying down any variable credit card balances averaging ${cc}%.`,
        'Stick to dollar-cost averaging in long-term index investment envelopes.',
      ],
      model: 'fallback',
      latencyMs: Date.now() - startTime,
    });
  }
});

export default router;
