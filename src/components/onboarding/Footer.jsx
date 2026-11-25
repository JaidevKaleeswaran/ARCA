import React from 'react';
import BrandMark from './BrandMark';

export default function Footer({ navigate, onOpenApp }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/[0.07] bg-[#090908] text-zinc-500">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-4 w-auto shrink-0" />
            <span className="text-sm font-semibold tracking-tight text-zinc-100">ARCA</span>
            <span className="text-xs text-zinc-600">· Zero-based personal ledger</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <button
              type="button"
              onClick={onOpenApp}
              className="text-[#E7B956] hover:text-[#d8aa45] font-medium transition-colors cursor-pointer"
            >
              Open app
            </button>
            <button
              type="button"
              onClick={() => handleNav('/why-arca')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Why ARCA
            </button>
            <button
              type="button"
              onClick={() => handleNav('/about')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleNav('/privacy')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => handleNav('/terms')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Terms
            </button>
          </div>
        </div>

        <div className="space-y-3 border-t border-white/[0.06] pt-6 text-[11px] text-zinc-600 leading-relaxed">
          <p>
            Disclaimer: The Service is for general information and educational purposes only. It does not constitute financial, investment, tax, legal, or accounting advice. ARCA Budgeting is not a registered investment adviser, broker-dealer, or financial planner. Users are solely responsible for their financial decisions.
          </p>
          <p className="tabular-nums text-zinc-500">
            © {new Date().getFullYear()} ARCA Budgeting. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
