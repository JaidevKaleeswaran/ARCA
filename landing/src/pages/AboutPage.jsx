import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function AboutPage({ navigate, appUrl }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-primary text-text">
      {/* Back button */}
      <button
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center space-x-2 text-xs font-medium text-text-muted hover:text-accent transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to Overview</span>
      </button>

      {/* Header */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-accent font-mono">
          Organization & Mission
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
          About <span className="text-accent">ARCA</span>
        </h1>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          Building tools for disciplined, zero-based financial clarity.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 pt-4">
        <div className="border border-border bg-card hover:border-accent/40 rounded-xl p-6 sm:p-8 space-y-3 transition-colors">
          <span className="text-xs font-mono text-accent">OPERATOR</span>
          <h2 className="text-lg font-semibold text-white">Who We Are</h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            <strong className="text-accent">ARCA Budgeting</strong> is the founding entity and development team behind the <strong className="text-white">ARCA</strong> personal finance web application.
          </p>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            We built ARCA in response to personal finance software that felt punitive and overly complex. Our objective is to make prospective, zero-based allocation intuitive and reliable for individuals seeking direct command over their finances.
          </p>
        </div>

        {/* Guiding Principles */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-accent">
            Core Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border bg-card hover:border-accent/40 rounded-lg p-5 space-y-2 transition-colors">
              <span className="text-xs font-mono text-accent">01</span>
              <h4 className="font-semibold text-white text-sm">Clarity Over Jargon</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Direct metrics, simple math, and zero manipulative dark patterns or upsells.
              </p>
            </div>

            <div className="border border-border bg-card hover:border-accent/40 rounded-lg p-5 space-y-2 transition-colors">
              <span className="text-xs font-mono text-accent">02</span>
              <h4 className="font-semibold text-white text-sm">Strict Data Privacy</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                We do not sell personal financial records or transaction history to advertising networks.
              </p>
            </div>

            <div className="border border-border bg-card hover:border-accent/40 rounded-lg p-5 space-y-2 transition-colors">
              <span className="text-xs font-mono text-accent">03</span>
              <h4 className="font-semibold text-white text-sm">Frictionless Capture</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Automated inputs and voice tooling to keep tracking sustainable over the long term.
              </p>
            </div>
          </div>
        </div>

        {/* Note from co-founders */}
        <div className="border-l-2 border-accent bg-card p-6 rounded-r-lg space-y-2 border-t border-r border-b border-border">
          <p className="text-xs sm:text-sm text-zinc-200 italic leading-relaxed">
            "When every dollar has a dedicated role on payday, you eliminate the constant anxiety of wondering what will be left over at month end. ARCA was designed to provide that exact certainty."
          </p>
          <p className="text-xs font-mono text-accent pt-1">
            — ARCA Budgeting
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="border border-accent/40 bg-card rounded-xl p-6 sm:p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Begin Using ARCA
        </h3>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
          Set up your envelopes and balance your income today.
        </p>
        <div className="pt-1">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-accent hover:bg-accent-hover text-primary font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <span>Launch ARCA</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
