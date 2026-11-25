import React, { useRef, useState } from 'react';
import { Wallet, ReceiptText, BarChart3, TrendingUp, Landmark, MessageSquare } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Budget', icon: Wallet },
  { id: 'transactions', label: 'Ledger', icon: ReceiptText },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'financial', label: 'Financial', icon: Landmark, mobileOnly: true },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
];

/**
 * Adaptive navigation:
 * - Mobile (< md): iOS Liquid Glass floating tab bar with spring-sliding optical glass selection capsule
 * - Desktop (>= md): Clean sticky top hairline tab bar (unified Markets tab)
 */
export default function TabNavigation({ activeTab, setActiveTab }) {
  const trackRef = useRef(null);
  const dragOriginRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);

  const activeIdx = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab)
  );
  const isDragging = dragIndex !== null;
  const pillIndex = isDragging ? dragIndex : activeIdx;

  const getIndexFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return activeIdx;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return activeIdx;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(TABS.length - 1, ratio * TABS.length - 0.5));
    return clamped;
  };

  const handlePointerDown = (e) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragOriginRef.current = { x: e.clientX, pointerId: e.pointerId, moved: false };
  };

  const handlePointerMove = (e) => {
    const origin = dragOriginRef.current;
    if (!origin || origin.pointerId !== e.pointerId) return;
    if (!origin.moved && Math.abs(e.clientX - origin.x) < 8) return;

    if (!origin.moved) {
      origin.moved = true;
      try {
        trackRef.current?.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore pointer capture failures
      }
    }

    const nextFloat = getIndexFromClientX(e.clientX);
    setDragIndex(nextFloat);

    const snappedIdx = Math.max(0, Math.min(TABS.length - 1, Math.round(nextFloat)));
    const targetTab = TABS[snappedIdx];
    if (targetTab && targetTab.id !== activeTab) {
      setActiveTab(targetTab.id);
    }
  };

  const handlePointerEnd = (e) => {
    const origin = dragOriginRef.current;
    if (!origin || origin.pointerId !== e.pointerId) return;
    if (origin.moved) {
      try {
        trackRef.current?.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    }
    dragOriginRef.current = null;
    setDragIndex(null);
  };

  return (
    <nav
      data-tutorial="tab-nav"
      aria-label="Workspace navigation"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 z-30 md:sticky md:top-0 md:bottom-auto md:inset-x-0 md:z-20 md:border-b md:border-white/[0.08] md:bg-[#090908]/95 md:backdrop-blur-md"
    >
      <div className="relative ios-liquid-glass-bar rounded-full p-1 mx-auto max-w-6xl md:rounded-none md:p-0 md:px-6">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="relative grid grid-cols-6 touch-pan-y select-none md:flex md:items-center md:gap-7"
        >
          {/* iOS Liquid Glass Spring-Sliding Selection Capsule (Mobile Only) */}
          <div
            aria-hidden="true"
            className={`md:hidden pointer-events-none absolute inset-y-0 left-0 z-0 rounded-full ${
              isDragging ? 'ios-liquid-glass-pill-dragging' : 'ios-liquid-glass-pill'
            }`}
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translate3d(${pillIndex * 100}%, 0, 0) scale(${
                isDragging ? '1.06, 1.08' : '1, 1'
              })`,
              transition: isDragging
                ? 'background 140ms ease, box-shadow 140ms ease, transform 60ms linear'
                : 'transform 380ms cubic-bezier(0.32, 1.12, 0.42, 1), background 200ms ease, box-shadow 200ms ease',
            }}
          />

          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-tab-id={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-0 rounded-full md:rounded-none px-1 md:px-0 py-1.5 md:py-3 text-[10px] leading-tight md:text-[13px] transition-colors cursor-pointer min-h-[48px] md:min-h-0 ${
                  tab.mobileOnly ? 'md:hidden' : ''
                } ${
                  isActive
                    ? 'font-semibold text-[#E7B956] md:font-medium md:text-zinc-100'
                    : 'text-white/80 hover:text-white md:text-zinc-500 md:hover:text-zinc-200'
                }`}
              >
                <Icon
                  className="h-[18px] w-[18px] md:hidden shrink-0"
                  strokeWidth={isActive ? 2.1 : 1.65}
                />
                <span className="truncate max-w-full">{tab.label}</span>
                {isActive && (
                  <span className="hidden md:block absolute bottom-0 inset-x-0 h-[1.5px] bg-[#E7B956]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
