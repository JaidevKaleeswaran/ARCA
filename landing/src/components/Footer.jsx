import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark';

export default function Footer({ navigate, appUrl }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-200/80 bg-[#F8F8F7] text-zinc-500">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-zinc-200/80">
          {/* Brand Summary */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-5 w-auto shrink-0" />
              <span className="text-sm font-semibold tracking-tight text-zinc-950">
                ARCA
              </span>
            </div>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Zero-based personal finance built around a clean ledger. Assign take-home pay to category limits and track spending velocity in real time.
            </p>
            <div className="pt-1">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
              >
                <span>Open ARCA web app</span>
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="md:col-span-3 space-y-2.5 text-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Product
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/')}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/why-arca')}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Why ARCA
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/about')}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-3 space-y-2.5 text-xs">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/privacy')}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('/terms')}
                  className="text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li className="pt-1 text-[11px] text-zinc-400">
                Operated by <span className="text-zinc-600 font-medium">ARCA Budgeting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="space-y-4 text-[11px] text-zinc-400 leading-relaxed">
          <p>
            Disclaimer: The Service is for general information and educational purposes only. It does not constitute financial, investment, tax, legal, or accounting advice. ARCA Budgeting is not a registered investment adviser, broker-dealer, or financial planner. Users are solely responsible for their financial decisions.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-200/70">
            <p className="tabular-nums">
              © {new Date().getFullYear()} ARCA Budgeting. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => handleNav('/privacy')}
                className="hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => handleNav('/terms')}
                className="hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => handleNav('/about')}
                className="hover:text-zinc-900 transition-colors cursor-pointer"
              >
                About
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
