import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  Star,
} from 'lucide-react';
import { env } from '../../config/env';
import { formatCurrency } from '../../utils/formatCurrency';

const RANGES = [
  { id: '1d', label: '1D' },
  { id: '5d', label: '1W' },
  { id: '1mo', label: '1M' },
  { id: '3mo', label: '3M' },
  { id: '1y', label: '1Y' },
  { id: '5y', label: '5Y' },
];

const CHART_W = 420;
const CHART_H = 192;
const PAD_TOP = 16;
const PAD_BOTTOM = 14;
const PAD_X = 8;

function splitPriceParts(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return { whole: '0', cents: '.00' };
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const dotIdx = formatted.lastIndexOf('.');
  return {
    whole: dotIdx >= 0 ? formatted.slice(0, dotIdx) : formatted,
    cents: dotIdx >= 0 ? formatted.slice(dotIdx) : '.00',
  };
}

function formatAxisTick(timestamp, range) {
  const dt = new Date(timestamp);
  if (range === '1d') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }).format(dt);
  }
  if (range === '5d') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'America/New_York',
    }).format(dt);
  }
  if (range === '1mo') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    }).format(dt);
  }
  if (range === '5y') {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      timeZone: 'America/New_York',
    }).format(dt);
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'America/New_York',
  }).format(dt);
}

function formatHoverTimestamp(timestamp, range) {
  const dt = new Date(timestamp);
  if (range === '1d' || range === '5d') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    }).format(dt) + ' ET';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(dt);
}

function formatStatPrice(val) {
  if (typeof val !== 'number' || !Number.isFinite(val) || val <= 0) return '—';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StockDetailDrawer({
  stock,
  holding,
  isFavorited = false,
  onToggleFavorite,
  onClose,
  onInvest,
  onQuoteLoaded,
}) {
  const symbol = stock?.symbol || null;
  const [range, setRange] = useState('3mo');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const drawerRef = useRef(null);
  const svgRef = useRef(null);
  const onQuoteLoadedRef = useRef(onQuoteLoaded);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onQuoteLoadedRef.current = onQuoteLoaded;
    onCloseRef.current = onClose;
  });

  // Track viewport scroll & TabNavigation position at 60fps so drawer follows scroll
  // smoothly and NEVER crosses over the pages chooser (TabNavigation).
  useEffect(() => {
    if (!symbol) return;

    let rafId = null;

    const syncDrawerBounds = () => {
      rafId = null;
      const el = drawerRef.current;
      if (!el) return;

      const isDesktop = window.innerWidth >= 768;
      const navEl = document.querySelector('[data-tutorial="tab-nav"]');
      const headerEl = document.querySelector('header');

      if (isDesktop) {
        let topPx = 0;
        if (navEl) {
          const navRect = navEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(navRect.bottom));
        } else if (headerEl) {
          const headerRect = headerEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(headerRect.bottom));
        }
        el.style.top = `${topPx}px`;
        el.style.bottom = '0px';
      } else {
        // Mobile: TabNavigation is fixed at bottom; header sits at top and scrolls away
        let topPx = 0;
        if (headerEl) {
          const headerRect = headerEl.getBoundingClientRect();
          topPx = Math.max(0, Math.ceil(headerRect.bottom));
        }
        let bottomPx = 0;
        if (navEl) {
          const navRect = navEl.getBoundingClientRect();
          bottomPx = Math.max(0, Math.ceil(window.innerHeight - navRect.top + 8));
        }
        el.style.top = `${topPx}px`;
        el.style.bottom = `${bottomPx}px`;
      }
    };

    const scheduleSync = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(syncDrawerBounds);
      }
    };

    // Initial synchronous paint alignment
    syncDrawerBounds();

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });

    let resizeObserver = null;
    const navEl = document.querySelector('[data-tutorial="tab-nav"]');
    if (typeof ResizeObserver !== 'undefined' && navEl) {
      resizeObserver = new ResizeObserver(scheduleSync);
      resizeObserver.observe(navEl);
    }

    return () => {
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [symbol]);

  // Escape key closes the drawer & mark body so floating tutorial pill shifts cleanly left of drawer
  useEffect(() => {
    if (!symbol) return;
    document.body.dataset.stockDrawerOpen = 'true';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      delete document.body.dataset.stockDrawerOpen;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [symbol]);

  // Fetch accurate live quote + historical points from backend
  useEffect(() => {
    if (!symbol) return;
    const controller = new AbortController();

    const loadHistory = async () => {
      setLoading(true);
      setError(null);
      setHoverIdx(null);
      try {
        const apiBase = env.apiBaseUrl || '';
        const res = await fetch(
          `${apiBase}/api/markets/history/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error(`Quote service returned ${res.status}`);
        }
        const data = await res.json();
        if (!controller.signal.aborted) {
          setHistoryData(data);
          onQuoteLoadedRef.current?.(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('StockDetailDrawer history fetch failed:', err);
        setError('Live chart data could not be loaded. Try refreshing.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadHistory();
    return () => controller.abort();
  }, [symbol, range, refreshNonce]);

  // Clear stale chart if symbol changes cleanly by deriving matched data
  const activeData =
    historyData && historyData.symbol?.toUpperCase() === symbol?.toUpperCase()
      ? historyData
      : null;

  const points = useMemo(() => activeData?.points || [], [activeData]);

  // Compute chart geometry
  const chartGeom = useMemo(() => {
    if (!points || points.length < 2) return null;

    const prices = points.map((p) => p.price);
    const refPrice = activeData?.referencePrice ?? points[0].price;
    const rawMin = Math.min(...prices, refPrice);
    const rawMax = Math.max(...prices, refPrice);
    const span = rawMax - rawMin;
    const padVal = span > 0 ? span * 0.1 : Math.max(1, rawMax * 0.02);
    const minVal = rawMin - padVal;
    const maxVal = rawMax + padVal;
    const denom = maxVal - minVal || 1;

    const innerW = CHART_W - PAD_X * 2;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;

    const coords = points.map((pt, i) => {
      const x = PAD_X + (i / (points.length - 1)) * innerW;
      const y = PAD_TOP + (1 - (pt.price - minVal) / denom) * innerH;
      return { x, y, ...pt };
    });

    const linePath = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(' ');

    const baselineBottom = CHART_H - 2;
    const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${baselineBottom} L ${coords[0].x.toFixed(2)} ${baselineBottom} Z`;

    const refY = PAD_TOP + (1 - (refPrice - minVal) / denom) * innerH;

    // Select 4 evenly distributed X-axis tick labels
    const tickCount = 4;
    const tickIndices = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = Math.round((i / (tickCount - 1)) * (coords.length - 1));
      tickIndices.push(idx);
    }
    const ticks = tickIndices.map((idx) => ({
      idx,
      label: formatAxisTick(coords[idx].t, activeData?.range || range),
    }));

    return { coords, linePath, areaPath, refY, ticks };
  }, [points, activeData?.referencePrice, activeData?.range, range]);

  const handlePointerScrub = useCallback(
    (clientX) => {
      if (!svgRef.current || !chartGeom || chartGeom.coords.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const idx = Math.round(ratio * (chartGeom.coords.length - 1));
      setHoverIdx((prev) => (prev === idx ? prev : idx));
    },
    [chartGeom]
  );

  if (!symbol) return null;

  const isHovering = hoverIdx !== null && chartGeom?.coords?.[hoverIdx];
  const activePoint = isHovering
    ? chartGeom.coords[hoverIdx]
    : chartGeom?.coords?.[chartGeom.coords.length - 1] || null;

  const fallbackPrice = Number(stock?.price) || 0;
  const fallbackChange = Number(stock?.change) || 0;
  const fallbackChangePct = Number(stock?.changePercent) || 0;

  const headlinePrice = isHovering
    ? activePoint.price
    : (activeData?.price ?? fallbackPrice);

  const refPrice = activeData?.referencePrice ?? chartGeom?.coords?.[0]?.price ?? headlinePrice;
  const displayChange = isHovering
    ? Number((activePoint.price - refPrice).toFixed(2))
    : (activeData?.periodChange ?? fallbackChange);
  const displayChangePct = isHovering
    ? refPrice > 0
      ? Number((((activePoint.price - refPrice) / refPrice) * 100).toFixed(2))
      : 0
    : (activeData?.periodChangePercent ?? fallbackChangePct);

  const isPositive = displayChange >= 0;
  const strokeColor = isPositive ? '#5d9475' : '#c26662';
  const safeGradId = `arcaStockGrad_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const { whole, cents } = splitPriceParts(headlinePrice);

  const stats = activeData?.stats || {};
  const displayName = activeData?.name || stock?.name || symbol;
  const displaySector = activeData?.sector || stock?.sector || 'Equities';

  const contextLabel = isHovering
    ? formatHoverTimestamp(activePoint.t, activeData?.range || range)
    : activeData?.sinceDate
      ? activeData.range === '1d'
        ? 'vs prev close'
        : `since ${activeData.sinceDate}`
      : 'live quote';

  // Extended hours readout if active outside regular session
  const hasPostMarket =
    typeof stats.postMarketPrice === 'number' &&
    stats.postMarketPrice > 0 &&
    Math.abs(stats.postMarketPrice - (activeData?.price ?? 0)) >= 0.01;
  const hasPreMarket =
    !hasPostMarket &&
    typeof stats.preMarketPrice === 'number' &&
    stats.preMarketPrice > 0 &&
    Math.abs(stats.preMarketPrice - (activeData?.price ?? 0)) >= 0.01;

  const updatedTimeLabel = activeData?.asOf
    ? new Date(activeData.asOf).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  const investStockPayload = {
    symbol,
    name: displayName,
    sector: displaySector,
    price: activeData?.price ?? fallbackPrice,
    change: activeData?.dayChange ?? fallbackChange,
    changePercent: activeData?.dayChangePercent ?? fallbackChangePct,
    marketCap: stats.marketCap || stock?.marketCap || 'N/A',
  };

  const peRatio = stats.pe ?? stock?.pe;

  const drawerContent = (
    <aside
      ref={drawerRef}
      data-testid="stock-detail-drawer"
      aria-label={`${symbol} price history and details`}
      style={{ top: '101px', bottom: '0px' }}
      className="fixed right-0 z-[15] flex w-full flex-col border-l border-white/[0.1] bg-[#0B0B0A]/[0.98] backdrop-blur-md md:w-[33.3333vw] md:min-w-[340px]"
    >
      {/* Top Hairline Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-zinc-100">
              {symbol}
            </h2>
            <span className="text-[11px] text-zinc-500">
              · {displaySector}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{displayName}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(investStockPayload)}
              title={isFavorited ? `Remove ${symbol} from favorites` : `Favorite ${symbol}`}
              aria-label={isFavorited ? `Remove ${symbol} from favorites` : `Favorite ${symbol}`}
              aria-pressed={isFavorited}
              className={`rounded-full p-1.5 transition-colors cursor-pointer ${
                isFavorited
                  ? 'text-[#E7B956] bg-[#E7B956]/15 hover:bg-[#E7B956]/25'
                  : 'text-zinc-500 hover:bg-white/[0.06] hover:text-[#E7B956]'
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${isFavorited ? 'fill-[#E7B956] text-[#E7B956]' : ''}`}
                strokeWidth={1.75}
              />
            </button>
          )}
          <button
            type="button"
            onClick={() => setRefreshNonce((n) => n + 1)}
            disabled={loading}
            title="Refresh live price"
            aria-label="Refresh live price"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#E7B956]' : ''}`}
              strokeWidth={1.75}
            />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close stock details"
            aria-label="Close stock details"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Scrollable Inner Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 space-y-5">
        {/* Hero Price + Period Change */}
        <div>
          <div className="flex items-baseline tabular-nums leading-none">
            <span className="text-[30px] sm:text-[34px] font-semibold tracking-tight text-white">
              ${whole}
            </span>
            <span className="text-[19px] sm:text-[21px] font-medium text-zinc-500">
              {cents}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 whitespace-nowrap overflow-hidden text-xs tabular-nums">
            <span
              className={`inline-flex shrink-0 items-center gap-0.5 font-medium ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              <span>
                {isPositive ? '+' : '-'}${Math.abs(displayChange).toFixed(2)} (
                {isPositive ? '+' : ''}
                {displayChangePct.toFixed(2)}%)
              </span>
            </span>
            <span className="truncate text-zinc-500">{contextLabel}</span>
          </div>

          {(hasPostMarket || hasPreMarket) && (
            <p
              className={`mt-1.5 text-[11px] text-zinc-400 tabular-nums transition-opacity duration-150 ${
                isHovering ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {hasPostMarket ? 'After-hours' : 'Pre-market'}{' '}
              <span className="font-medium text-zinc-200">
                ${(hasPostMarket ? stats.postMarketPrice : stats.preMarketPrice).toFixed(2)}
              </span>{' '}
              {typeof (hasPostMarket ? stats.postMarketChangePercent : stats.preMarketChangePercent) ===
                'number' && (
                <span
                  className={
                    (hasPostMarket ? stats.postMarketChange : stats.preMarketChange) >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  (
                  {(hasPostMarket ? stats.postMarketChangePercent : stats.preMarketChangePercent) >= 0
                    ? '+'
                    : ''}
                  {(
                    hasPostMarket ? stats.postMarketChangePercent : stats.preMarketChangePercent
                  ).toFixed(2)}
                  %)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Clean Underline Timeframe Tabs */}
        <div
          role="tablist"
          aria-label="Chart timeframe"
          className="flex items-center justify-between border-b border-white/[0.08]"
        >
          {RANGES.map((r) => {
            const isSelected = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setRange(r.id)}
                className={`relative px-2 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {r.label}
                {isSelected && (
                  <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#c8a24e]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Area Price Chart */}
        <div className="relative">
          {loading && !chartGeom ? (
            <div className="flex h-[212px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#090908]">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#E7B956]" />
                <span>Loading live price history...</span>
              </div>
            </div>
          ) : error && !chartGeom ? (
            <div className="flex h-[212px] flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#090908] px-4 text-center">
              <AlertCircle className="h-4 w-4 text-rose-400" strokeWidth={1.5} />
              <p className="text-xs text-zinc-400">{error}</p>
              <button
                type="button"
                onClick={() => setRefreshNonce((n) => n + 1)}
                className="rounded-full border border-white/[0.12] px-3 py-1 text-[11px] font-medium text-zinc-200 hover:border-[#E7B956] hover:text-[#E7B956] cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : chartGeom ? (
            <div className="relative select-none">
              <div
                className={`transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}
              >
                <svg
                  ref={svgRef}
                  data-testid="stock-price-chart"
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  className="h-[192px] w-full touch-none overflow-visible cursor-crosshair"
                  onPointerMove={(e) => handlePointerScrub(e.clientX)}
                  onPointerDown={(e) => handlePointerScrub(e.clientX)}
                  onPointerLeave={() => setHoverIdx(null)}
                  role="img"
                  aria-label={`${symbol} ${activeData?.rangeLabel || ''} price chart`}
                >
                  <defs>
                    <linearGradient id={safeGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.34" />
                      <stop offset="72%" stopColor={strokeColor} stopOpacity="0.06" />
                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Dashed reference baseline */}
                  <line
                    pointerEvents="none"
                    x1={PAD_X}
                    x2={CHART_W - PAD_X}
                    y1={chartGeom.refY}
                    y2={chartGeom.refY}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                  />

                  {/* Gradient area fill */}
                  <path pointerEvents="none" d={chartGeom.areaPath} fill={`url(#${safeGradId})`} />

                  {/* Price curve */}
                  <path
                    pointerEvents="none"
                    d={chartGeom.linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive scrub vertical guide */}
                  {isHovering && activePoint && (
                    <line
                      pointerEvents="none"
                      x1={activePoint.x}
                      x2={activePoint.x}
                      y1={PAD_TOP - 4}
                      y2={CHART_H - 2}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1"
                    />
                  )}

                  {/* Terminal or active scrub glowing white dot */}
                  {activePoint && (
                    <g pointerEvents="none">
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="9"
                        fill={strokeColor}
                        fillOpacity="0.24"
                      />
                      <circle
                        cx={activePoint.x}
                        cy={activePoint.y}
                        r="4.25"
                        fill="#ffffff"
                      />
                    </g>
                  )}
                </svg>

                {/* X-axis clean ticks */}
                <div className="mt-1 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px] text-zinc-500 tabular-nums">
                  {chartGeom.ticks.map((tick, idx) => (
                    <span key={`${tick.idx}_${idx}`}>{tick.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[180px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#090908] text-xs text-zinc-500">
              No chart points available for this range.
            </div>
          )}
        </div>

        {/* Period High / Low Strip */}
        {activeData && typeof activeData.periodLow === 'number' && typeof activeData.periodHigh === 'number' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] tabular-nums">
              <span className="text-zinc-500">
                {activeData.rangeLabel} low{' '}
                <span className="font-medium text-zinc-200">
                  {formatStatPrice(activeData.periodLow)}
                </span>
              </span>
              <span className="text-zinc-500">
                {activeData.rangeLabel} high{' '}
                <span className="font-medium text-zinc-200">
                  {formatStatPrice(activeData.periodHigh)}
                </span>
              </span>
            </div>
            <div className="relative h-1 w-full rounded-full bg-white/[0.08]">
              {(() => {
                const span = activeData.periodHigh - activeData.periodLow;
                const pct =
                  span > 0
                    ? Math.max(0, Math.min(100, ((activeData.price - activeData.periodLow) / span) * 100))
                    : 50;
                return (
                  <div
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0B0B0A] bg-[#E7B956]"
                    style={{ left: `${pct}%` }}
                  />
                );
              })()}
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => onInvest?.(investStockPayload)}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#272724] text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          <span>{holding ? `Add to ${symbol} position` : `Invest in ${symbol}`}</span>
        </button>

        {/* User's Current Position (if held) */}
        {holding && (
          <div className="border-t border-white/[0.08] pt-4">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Your Position
            </p>
            <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-y border-white/[0.06] py-2.5 tabular-nums">
              <div className="pr-3">
                <span className="block text-[10px] text-zinc-500">Market value</span>
                <span className="mt-0.5 block text-sm font-semibold text-zinc-100">
                  {formatCurrency(holding.currentValue)}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {Number(holding.shares || 0).toFixed(4)} sh
                </span>
              </div>
              <div className="pl-3">
                <span className="block text-[10px] text-zinc-500">Total return</span>
                <span
                  className={`mt-0.5 block text-sm font-semibold ${
                    (Number(holding.unrealizedGain) || 0) >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {(Number(holding.unrealizedGain) || 0) >= 0 ? '+' : ''}
                  {formatCurrency(holding.unrealizedGain)}
                </span>
                <span className="text-[11px] text-zinc-500">
                  Avg ${Number(holding.avgCostPerShare || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Key Statistics — Hairline Ledger */}
        <div className="border-t border-white/[0.08] pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Key Statistics
          </p>
          <div className="divide-y divide-white/[0.06] text-xs tabular-nums">
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Open</span>
                <span className="font-medium text-zinc-200">{formatStatPrice(stats.open)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Prev close</span>
                <span className="font-medium text-zinc-200">
                  {formatStatPrice(stats.previousClose)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Day high</span>
                <span className="font-medium text-zinc-200">{formatStatPrice(stats.dayHigh)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Day low</span>
                <span className="font-medium text-zinc-200">{formatStatPrice(stats.dayLow)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">52W high</span>
                <span className="font-medium text-zinc-200">
                  {formatStatPrice(stats.high52 ?? stock?.high52)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">52W low</span>
                <span className="font-medium text-zinc-200">
                  {formatStatPrice(stats.low52 ?? stock?.low52)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Mkt cap</span>
                <span className="font-medium text-zinc-200">
                  {stats.marketCap || stock?.marketCap || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">P/E ratio</span>
                <span className="font-medium text-zinc-200">
                  {typeof peRatio === 'number' ? peRatio.toFixed(1) : '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Volume</span>
                <span className="font-medium text-zinc-200">
                  {stats.volume || stock?.volume || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Exchange</span>
                <span className="truncate max-w-[90px] font-medium text-zinc-200 text-right">
                  {stats.exchange || 'US'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Data Attribution */}
        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span>
              Yahoo Finance{updatedTimeLabel ? ` · ${updatedTimeLabel}` : ''}
            </span>
          </span>
          <span>Hover chart to inspect</span>
        </div>
      </div>
    </aside>
  );

  if (typeof document !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }
  return drawerContent;
}
