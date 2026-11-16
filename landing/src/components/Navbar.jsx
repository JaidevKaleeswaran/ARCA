import React, { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

export default function Navbar({ currentPath, navigate, appUrl }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-primary/90 border-b border-border transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center space-x-2.5 text-left focus:outline-none cursor-pointer group"
          >
            {/* 3 ARCA Pill Bars Mark */}
            <svg
              viewBox="0 0 36 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-auto shrink-0 transition-opacity group-hover:opacity-85"
            >
              <rect x="0" y="2" width="36" height="10" rx="3.5" fill="#8c6d37" />
              <rect x="0" y="17" width="36" height="10" rx="3.5" fill="#cfa143" />
              <rect x="0" y="32" width="36" height="10" rx="3.5" fill="#e7b956" />
            </svg>
            <span className="font-bold text-white text-lg tracking-tight font-sans group-hover:text-accent transition-colors">
              ARCA
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium">
            <button
              onClick={() => handleNav('/')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/' ? 'text-accent font-semibold' : 'text-text-muted hover:text-accent'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('/why-arca')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/why-arca' ? 'text-accent font-semibold' : 'text-text-muted hover:text-accent'
              }`}
            >
              Why We Made ARCA
            </button>
            <button
              onClick={() => handleNav('/about')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/about' ? 'text-accent font-semibold' : 'text-text-muted hover:text-accent'
              }`}
            >
              About Us
            </button>
          </nav>

          {/* Launch App CTA Button */}
          <div className="hidden sm:flex items-center">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-accent hover:bg-accent-hover text-primary font-semibold text-xs px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <span>Launch ARCA</span>
              <ArrowUpRight size={13} />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-text-muted hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-border px-4 pt-3 pb-5 space-y-2.5">
          <button
            onClick={() => handleNav('/')}
            className={`block w-full text-left py-1.5 text-xs font-medium ${
              currentPath === '/' ? 'text-accent font-semibold' : 'text-text-muted'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/why-arca')}
            className={`block w-full text-left py-1.5 text-xs font-medium ${
              currentPath === '/why-arca' ? 'text-accent font-semibold' : 'text-text-muted'
            }`}
          >
            Why We Made ARCA
          </button>
          <button
            onClick={() => handleNav('/about')}
            className={`block w-full text-left py-1.5 text-xs font-medium ${
              currentPath === '/about' ? 'text-accent font-semibold' : 'text-text-muted'
            }`}
          >
            About Us
          </button>

          <div className="pt-2">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-1.5 w-full bg-accent hover:bg-accent-hover text-primary font-semibold text-xs py-2.5 rounded-lg"
            >
              <span>Launch ARCA</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
