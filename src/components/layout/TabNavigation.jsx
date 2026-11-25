import React from 'react';
import { Wallet, ReceiptText, BarChart3, TrendingUp, Landmark, MessageSquare } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Budget', icon: Wallet },
  { id: 'transactions', label: 'Ledger', icon: ReceiptText },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'markets', label: 'Markets', icon: TrendingUp },
  { id: 'financial', label: 'Financial', icon: Landmark },
  { id: 'assistant', label: 'Assistant', icon: MessageSquare },
];

/**
 * Adaptive navigation:
 * - Mobile (< md): Clean solid floating bottom pill navigator
 * - Desktop (>= md): Clean sticky top hairline tab bar with separate Markets & Financial tabs
 */
export default function TabNavigation({ activeTab, setActiveTab }) {
  const activeIdx = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab)
  );

  return (
    <nav
      data-tutorial="tab-nav"
      aria-label="Workspace navigation"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 z-30 md:sticky md:top-0 md:bottom-auto md:inset-x-0 md:z-20 md:border-b md:border-white/[0.08] md:bg-[#090908]/95 md:backdrop-blur-md"
    >
      <div className="rounded-full border border-white/[0.1] bg-[#111110] p-1 shadow-[0_10px_28px_rgba(0,0,0,0.65)] mx-auto max-w-6xl md:rounded-none md:border-0 md:bg-transparent md:p-0 md:px-6 md:shadow-none">
        <div className="relative grid grid-cols-6 select-none md:flex md:items-center md:gap-7">
          {/* Clean sliding active indicator pill (Mobile Only) */}
          <div
            aria-hidden="true"
            className="md:hidden pointer-events-none absolute inset-y-0 left-0 z-0 rounded-full bg-white/[0.09] transition-transform duration-300 ease-out"
            style={{
              width: `${100 / TABS.length}%`,
              transform: `translate3d(${activeIdx * 100}%, 0, 0)`,
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
                    : 'text-zinc-400 hover:text-zinc-100 md:text-zinc-500 md:hover:text-zinc-200'
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
