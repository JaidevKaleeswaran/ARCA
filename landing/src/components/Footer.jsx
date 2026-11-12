import React from 'react';
import { ArrowUpRight, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export default function Footer({ navigate, appUrl }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#121210] border-t border-[#38342e]/80 pt-16 pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#282622]">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <svg
                viewBox="0 0 36 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-auto shrink-0"
              >
                <rect x="0" y="2" width="36" height="10" rx="3.5" fill="#8c6d37" />
                <rect x="0" y="17" width="36" height="10" rx="3.5" fill="#cfa143" />
                <rect x="0" y="32" width="36" height="10" rx="3.5" fill="#e7b956" />
              </svg>
              <span className="font-extrabold text-white text-2xl tracking-tight">ARCA</span>
            </div>

            <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
              Zero-based budgeting redefined. Assign every dollar a concrete role, track expenditure cycles in real time, and query your finances with multi-agent AI.
            </p>

            <div className="pt-2">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-[#22201d] hover:bg-[#2c2a26] text-[#e7b956] border border-[#38342e] font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Sparkles size={14} />
                <span>Launch ARCA Web Application</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Overview</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNav('/')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home Dashboard Preview
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/why-arca')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Why We Made ARCA
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  About Us & Co-Founders
                </button>
              </li>
              <li>
                <a
                  href={`${appUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#e7b956] transition-colors inline-flex items-center gap-1"
                >
                  <span>Open App</span>
                  <ArrowUpRight size={12} />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Legal & Privacy</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => handleNav('/privacy')}
                  className="hover:text-[#e7b956] transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('/terms')}
                  className="hover:text-[#e7b956] transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li className="pt-2 text-xs text-zinc-500">
                Operated by <span className="text-zinc-300 font-semibold">ARCA-budgetting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Financial Disclaimer & Legal Details (as required by Terms) */}
        <div className="pt-8 space-y-4 text-xs text-zinc-500 leading-relaxed">
          <div className="bg-[#181816] p-4 rounded-xl border border-[#262420]">
            <p className="font-semibold text-zinc-400 mb-1">Financial & Legal Disclaimer</p>
            <p>
              Educational and Informational Purposes Only. ARCA is designed solely to assist you in tracking your personal finances, budgeting, and organizing expenses. ARCA-budgetting is not a financial advisor, broker, or certified public accountant (CPA). The application does not provide professional financial, investment, tax, or legal advice. Any financial decisions you make based on data or insights from this app are strictly your own responsibility.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 pt-2">
            <p>© {new Date().getFullYear()} ARCA-budgetting. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-xs">
              <button onClick={() => handleNav('/privacy')} className="hover:text-zinc-300 underline cursor-pointer">
                Privacy
              </button>
              <button onClick={() => handleNav('/terms')} className="hover:text-zinc-300 underline cursor-pointer">
                Terms
              </button>
              <button onClick={() => handleNav('/about')} className="hover:text-zinc-300 underline cursor-pointer">
                About
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
