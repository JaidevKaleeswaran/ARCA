import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Footer({ navigate, appUrl }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary border-t border-border pt-12 pb-10 text-text-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <svg
                viewBox="0 0 36 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-auto shrink-0"
              >
                <rect x="0" y="2" width="36" height="10" rx="3.5" fill="#8c6d37" />
                <rect x="0" y="17" width="36" height="10" rx="3.5" fill="#cfa143" />
                <rect x="0" y="32" width="36" height="10" rx="3.5" fill="#e7b956" />
              </svg>
              <span className="font-bold text-white text-base tracking-tight">ARCA</span>
            </div>

            <p className="text-xs text-text-muted max-w-sm leading-relaxed">
              Zero-based budgeting for modern personal finance. Allocate income with intention, track expenses in real time, and eliminate cycle deficits.
            </p>

            <div className="pt-1">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-accent hover:text-accent-hover transition-colors font-semibold"
              >
                <span>Launch ARCA Web App</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2.5 text-xs">
            <p className="font-mono uppercase tracking-wider text-accent text-[11px]">Overview</p>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => handleNav('/')}
                  className="hover:text-accent transition-colors cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/why-arca')}
                  className="hover:text-accent transition-colors cursor-pointer text-left"
                >
                  Why We Made ARCA
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="hover:text-accent transition-colors cursor-pointer text-left"
                >
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links (Bottom only) */}
          <div className="space-y-2.5 text-xs">
            <p className="font-mono uppercase tracking-wider text-accent text-[11px]">Legal</p>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => handleNav('/privacy')}
                  className="hover:text-accent transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/terms')}
                  className="hover:text-accent transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li className="pt-2 text-[11px] text-zinc-500 font-mono">
                Operated by <span className="text-accent">ARCA Budgeting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Financial Disclaimer & Legal Details */}
        <div className="space-y-4 text-[11px] text-zinc-500 leading-relaxed font-mono">
          <p>
            Disclaimer: The Service is for general information and educational purposes only. It does not constitute financial, investment, tax, legal, or accounting advice. ARCA Budgeting is not a registered investment adviser, broker-dealer, or financial planner. Users are solely responsible for their financial decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-500 pt-2 border-t border-border">
            <p>© {new Date().getFullYear()} ARCA Budgeting. All rights reserved.</p>
            <div className="flex items-center space-x-5 text-[11px]">
              <button onClick={() => handleNav('/privacy')} className="hover:text-accent cursor-pointer">
                Privacy
              </button>
              <button onClick={() => handleNav('/terms')} className="hover:text-accent cursor-pointer">
                Terms
              </button>
              <button onClick={() => handleNav('/about')} className="hover:text-accent cursor-pointer">
                About
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
