import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark';

const NAV_ITEMS = [
  { path: '/why-arca', label: 'Why ARCA' },
  { path: '/about', label: 'About' },
];

export default function Navbar({ currentPath, navigate, onOpenApp }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenApp = () => {
    setMobileMenuOpen(false);
    onOpenApp();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#090908]/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Brand + Quiet Nav */}
          <div className="flex items-center gap-7">
            <button
              type="button"
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
            >
              <BrandMark className="h-5 w-auto shrink-0 transition-opacity group-hover:opacity-80" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
                ARCA
              </span>
            </button>

            <nav className="hidden sm:flex items-center gap-5" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`text-[13px] transition-colors cursor-pointer ${
                      isActive
                        ? 'font-medium text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right CTA */}
          <div className="hidden sm:flex items-center">
            <button
              type="button"
              onClick={handleOpenApp}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#E7B956] px-4 text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] cursor-pointer"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="sm:hidden rounded-md p-1.5 text-zinc-400 hover:text-zinc-100 focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/[0.07] bg-[#090908] px-5 py-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNav(item.path)}
              className={`block w-full py-1.5 text-left text-xs ${
                currentPath === item.path ? 'font-medium text-zinc-100' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenApp}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#E7B956] text-xs font-semibold text-[#090908]"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
