import React, { useState } from 'react';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';

export default function Navbar({ currentPath, navigate, appUrl }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#161614]/85 border-b border-[#38342e]/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center space-x-3 text-left focus:outline-none cursor-pointer group"
          >
            {/* 3 ARCA Gold/Bronze Pill Bars Mark */}
            <svg
              viewBox="0 0 36 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-auto shrink-0 transition-transform group-hover:scale-105"
            >
              <rect x="0" y="2" width="36" height="10" rx="3.5" fill="#8c6d37" />
              <rect x="0" y="17" width="36" height="10" rx="3.5" fill="#cfa143" />
              <rect x="0" y="32" width="36" height="10" rx="3.5" fill="#e7b956" />
            </svg>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-extrabold text-white text-2xl tracking-tight font-sans">
                ARCA
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button
              onClick={() => handleNav('/')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/' ? 'text-[#e7b956]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('/why-arca')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/why-arca' ? 'text-[#e7b956]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              Why We Made ARCA
            </button>
            <button
              onClick={() => handleNav('/about')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/about' ? 'text-[#e7b956]' : 'text-zinc-300 hover:text-white'
              }`}
            >
              About Us
            </button>
            <button
              onClick={() => handleNav('/privacy')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/privacy' ? 'text-[#e7b956]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleNav('/terms')}
              className={`transition-colors cursor-pointer ${
                currentPath === '/terms' ? 'text-[#e7b956]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Terms of Service
            </button>
          </nav>

          {/* Launch App CTA Button */}
          <div className="hidden sm:flex items-center space-x-4">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#e7b956] to-[#d4a23b] text-[#161614] font-bold px-5 py-2.5 rounded-xl hover:from-[#f0c76e] hover:to-[#e0b04c] transition-all shadow-lg hover:shadow-[#e7b956]/20 active:scale-95"
            >
              <Sparkles size={16} />
              <span>Launch ARCA</span>
              <ArrowUpRight size={16} />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1815] border-b border-[#38342e] px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => handleNav('/')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              currentPath === '/' ? 'text-[#e7b956]' : 'text-zinc-200'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/why-arca')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              currentPath === '/why-arca' ? 'text-[#e7b956]' : 'text-zinc-200'
            }`}
          >
            Why We Made ARCA
          </button>
          <button
            onClick={() => handleNav('/about')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              currentPath === '/about' ? 'text-[#e7b956]' : 'text-zinc-200'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => handleNav('/privacy')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              currentPath === '/privacy' ? 'text-[#e7b956]' : 'text-zinc-400'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => handleNav('/terms')}
            className={`block w-full text-left py-2 text-sm font-medium ${
              currentPath === '/terms' ? 'text-[#e7b956]' : 'text-zinc-400'
            }`}
          >
            Terms of Service
          </button>

          <div className="pt-2">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full bg-[#e7b956] text-[#161614] font-bold py-3 rounded-xl shadow-md"
            >
              <Sparkles size={16} />
              <span>Launch ARCA App</span>
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
