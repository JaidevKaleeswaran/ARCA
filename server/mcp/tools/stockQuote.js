import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// In-memory 60s cache
const quoteCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function formatCap(cap) {
  if (!cap || typeof cap !== 'number') return 'N/A';
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

/**
 * Normalizes symbols: crypto tickers (BTC -> BTC-USD), share classes (BRK.B -> BRK-B)
 */
export function normalizeTicker(symbol) {
  if (!symbol || typeof symbol !== 'string') return '';
  let sym = symbol.toUpperCase().trim();

  // Normalize common crypto tickers
  const CRYPTO_MAP = {
    BTC: 'BTC-USD',
    ETH: 'ETH-USD',
    SOL: 'SOL-USD',
    DOGE: 'DOGE-USD',
    XRP: 'XRP-USD',
    ADA: 'ADA-USD',
    AVAX: 'AVAX-USD',
    DOT: 'DOT-USD',
    LINK: 'LINK-USD',
  };

  if (CRYPTO_MAP[sym]) {
    return CRYPTO_MAP[sym];
  }

  // Handle BRK.B / BF.B
  if (sym === 'BRK.B') return 'BRK-B';
  if (sym === 'BF.B') return 'BF-B';

  return sym;
}

/**
 * MCP Tool: get_stock_quote
 * Retrieves real-time stock or crypto quote with 60s in-memory caching
 */
export async function getStockQuote({ symbol }) {
  if (!symbol) {
    return { error: 'Ticker symbol is required' };
  }

  const normalized = normalizeTicker(symbol);
  const now = Date.now();

  const cached = quoteCache.get(normalized);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const q = await yf.quote(normalized);
    if (!q || (!q.regularMarketPrice && q.regularMarketPrice !== 0)) {
      return { error: `No quote found for symbol: ${symbol}` };
    }

    const cleanSymbol = normalized === 'BRK-B' ? 'BRK.B' : normalized;
    const dayLow = q.regularMarketDayLow ?? q.fiftyTwoWeekLow ?? null;
    const dayHigh = q.regularMarketDayHigh ?? q.fiftyTwoWeekHigh ?? null;
    const dayRange = (dayLow !== null && dayHigh !== null)
      ? `$${dayLow.toFixed(2)} - $${dayHigh.toFixed(2)}`
      : 'N/A';

    // Per rules: correctly extract net asset capitalization for ETFs
    const capVal = q.marketCap || q.netAssets || q.totalAssets;
    const marketCap = formatCap(capVal);

    const data = {
      symbol: cleanSymbol,
      name: q.shortName || q.longName || cleanSymbol,
      price: Number((q.regularMarketPrice || 0).toFixed(2)),
      change: Number((q.regularMarketChange || 0).toFixed(2)),
      changePercent: Number((q.regularMarketChangePercent || 0).toFixed(2)),
      volume: formatVol(q.regularMarketVolume),
      dayRange,
      marketCap,
      quoteType: q.quoteType || 'EQUITY',
      exchange: q.exchange || 'US',
      currency: q.currency || 'USD',
      updatedAt: new Date().toISOString(),
    };

    quoteCache.set(normalized, { timestamp: now, data });
    return data;
  } catch (err) {
    console.warn(`[stockQuoteTool] Failed to fetch quote for ${normalized}:`, err.message);
    return {
      symbol: normalized,
      error: `Could not fetch live quote for ${symbol}: ${err.message}`,
    };
  }
}
