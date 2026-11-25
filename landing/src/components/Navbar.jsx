import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark';

const NAV_ITEMS = [
  { path: '/', label: 'Overview' },
  { path: '/why-arca', label: 'Why ARCA' },
  { path: '/about', label: 'About' },
];

export default function Navbar({ currentPath, navigate, appUrl }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-[#F8F8F7]/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Brand + Primary Nav */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer group"
            >
              <BrandMark className="h-5 w-auto shrink-0 transition-opacity group-hover:opacity-80" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-950">
                ARCA
              </span>
            </button>

            <span className="hidden md:inline-block h-4 w-px bg-zinc-200" aria-hidden="true" />

            <nav className="hidden md:flex items-center gap-5" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`text-[13px] transition-colors cursor-pointer ${
                      isActive
                        ? 'font-medium text-zinc-950'
                        : 'text-zinc-500 hover:text-zinc-950'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 focus:outline-none"
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
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200/80 bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`block w-full rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                  isActive
                    ? 'bg-zinc-100 font-medium text-zinc-950'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="pt-2">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-zinc-950 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
