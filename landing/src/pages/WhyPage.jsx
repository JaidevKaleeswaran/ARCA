import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function WhyPage({ navigate, appUrl }) {
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
          Background & Rationale
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
          Why We Made <span className="text-accent">ARCA</span>
        </h1>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          Most personal finance applications show you where your money went after it is already gone. We built ARCA to establish control before spending begins.
        </p>
      </div>

      {/* Narrative Sections */}
      <div className="space-y-8 pt-4">
        {/* Section 1 */}
        <div className="border border-border bg-card hover:border-accent/40 rounded-xl p-6 sm:p-8 space-y-3 transition-colors">
          <span className="text-xs font-mono text-accent">01 / PROBLEM</span>
          <h2 className="text-lg font-semibold text-white">
            The Rearview Mirror Trap
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Personal finance software has historically relied on retroactive categorization. Users connect accounts, wait for monthly cycles to conclude, and inspect pie charts showing where budgets failed. This post-mortem approach creates guilt without providing actionable structure.
          </p>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Furthermore, platforms often monetize through third-party credit card recommendations or complicated multi-tab spreadsheets that require excessive manual upkeep.
          </p>
        </div>

        {/* Section 2 */}
        <div className="border border-border bg-card hover:border-accent/40 rounded-xl p-6 sm:p-8 space-y-3 transition-colors">
          <span className="text-xs font-mono text-accent">02 / PRINCIPLE</span>
          <h2 className="text-lg font-semibold text-white">
            Zero-Based Envelope Allocation
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Zero-based budgeting assigns every single dollar of incoming cash a dedicated role prior to the start of an expense period. The mathematical rule is strict:
          </p>
          <div className="bg-primary border border-accent/40 p-4 rounded-lg text-xs font-mono text-accent font-semibold my-2">
            Total Income − Total Category Envelopes = $0.00
          </div>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            When rent, food, savings, debt repayment, and discretionary funds are allocated up front, spending guilt is eliminated. Spending is not accidental; it is funded.
          </p>
        </div>

        {/* Section 3 */}
        <div className="border border-border bg-card hover:border-accent/40 rounded-xl p-6 sm:p-8 space-y-3 transition-colors">
          <span className="text-xs font-mono text-accent">03 / IMPLEMENTATION</span>
          <h2 className="text-lg font-semibold text-white">
            Reduced Friction & Modern Tools
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Maintaining envelopes manually can create administrative fatigue. ARCA addresses this through streamlined capture mechanisms:
          </p>
          <ul className="text-xs sm:text-sm text-text-muted space-y-2 list-disc pl-5 pt-1">
            <li><strong className="text-white">Voice dictation:</strong> Speak a transaction amount and merchant; ARCA parses and assigns it directly to its envelope.</li>
            <li><strong className="text-white">Receipt parsing:</strong> Photograph paper receipts to extract line items and dates automatically.</li>
            <li><strong className="text-white">Deterministic rollovers:</strong> End cycles on your paycheck schedule, automatically advancing emergency and investment buckets.</li>
            <li><strong className="text-white">Strict privacy:</strong> Zero data sales to third parties or advertisers.</li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="border border-accent/40 bg-card rounded-xl p-6 sm:p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Experience Zero-Based Budgeting
        </h3>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
          Start your first cycle in ARCA. Free, direct, and private.
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
