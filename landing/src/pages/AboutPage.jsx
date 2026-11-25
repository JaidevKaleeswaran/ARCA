import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function AboutPage({ navigate, appUrl }) {
  return (
    <article className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>Back to overview</span>
      </button>

      {/* Editorial Header */}
      <header className="space-y-3 border-b border-zinc-200/80 pb-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Team & Principles
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 leading-[1.12]">
          About ARCA
        </h1>
        <p className="text-[15px] text-zinc-600 leading-relaxed">
          Software for direct, zero-based personal finance without noise or dark patterns.
        </p>
      </header>

      {/* Who We Are */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">
          Who builds ARCA
        </h2>
        <p className="text-sm text-zinc-600 leading-relaxed">
          <strong className="font-medium text-zinc-950">ARCA Budgeting</strong> is the founding team behind the <strong className="font-medium text-zinc-950">ARCA</strong> personal finance web application.
        </p>
        <p className="text-sm text-zinc-600 leading-relaxed">
          We created ARCA because most budgeting tools felt either punitive after the fact or weighed down by upsells and spreadsheet busywork. Our goal is a fast, calm ledger that makes prospective zero-based allocation sustainable every week.
        </p>
      </section>

      {/* Core Principles (Unified Hairline Strip) */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Operating Principles
        </h2>
        <div className="grid grid-cols-1 divide-y divide-zinc-200/80 rounded-lg border border-zinc-200/80 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4 space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-950">Clarity over jargon</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Plain numbers, exact math, and no credit card upsells or manipulative nudges.
            </p>
          </div>
          <div className="p-4 space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-950">Strict data privacy</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We never sell personal financial records or transaction history to ad networks.
            </p>
          </div>
          <div className="p-4 space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-950">Low-friction capture</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Voice logging, receipt parsing, and keyboard-first entry built to stay effortless.
            </p>
          </div>
        </div>
      </section>

      {/* Co-Founders Note */}
      <blockquote className="border-l-2 border-zinc-900 pl-5 space-y-2">
        <p className="text-sm text-zinc-700 leading-relaxed">
          “When every dollar has a dedicated role on payday, you eliminate the constant anxiety of wondering what will be left over at month end. ARCA was designed to provide that exact certainty.”
        </p>
        <footer className="text-xs font-medium text-zinc-500">
          — ARCA Budgeting
        </footer>
      </blockquote>

      {/* Contact & Launch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-zinc-200/80 bg-white p-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">
            Start using ARCA
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Set up your category limits and balance your current cycle.
          </p>
        </div>
        <a
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-3.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
        >
          <span>Open ARCA</span>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </a>
      </div>
    </article>
  );
}
