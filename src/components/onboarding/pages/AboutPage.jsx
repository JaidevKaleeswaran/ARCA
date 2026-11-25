import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import ScrollFade from '../ScrollFade';

export default function AboutPage({ navigate, onOpenApp }) {
  return (
    <article className="mx-auto max-w-2xl px-5 sm:px-8 py-14 sm:py-20 space-y-12">
      <button
        type="button"
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>Back</span>
      </button>

      <ScrollFade as="header" className="space-y-3 border-b border-white/[0.08] pb-8">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-100 leading-[1.12]">
          About ARCA
        </h1>
        <p className="text-[15px] text-zinc-400">
          Direct, zero-based personal finance without noise.
        </p>
      </ScrollFade>

      <ScrollFade as="section" delay={60} className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-100">Who builds ARCA</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          <strong className="font-medium text-zinc-100">ARCA Budgeting</strong> builds and operates the <strong className="font-medium text-zinc-100">ARCA</strong> personal finance web application.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed">
          We built ARCA to make prospective zero-based allocation calm, fast, and sustainable without spreadsheet maintenance or upsells.
        </p>
      </ScrollFade>

      <ScrollFade as="section" delay={90} className="space-y-4 border-t border-white/[0.08] pt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Principles
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-100">Clarity over jargon</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Plain numbers, exact math, no dark patterns.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-100">Strict privacy</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We never sell financial records or transaction history.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-100">Fast capture</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Voice, receipt parsing, and keyboard-first entry.
            </p>
          </div>
        </div>
      </ScrollFade>

      <ScrollFade as="blockquote" delay={120} className="border-l-2 border-[#E7B956] pl-5 space-y-2">
        <p className="text-sm text-zinc-300 leading-relaxed">
          “When every dollar has a dedicated role on payday, you eliminate the constant anxiety of wondering what will be left over at month end.”
        </p>
        <footer className="text-xs text-zinc-500">— ARCA Budgeting</footer>
      </ScrollFade>

      <ScrollFade className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
        <h3 className="text-sm font-semibold text-zinc-100">Start using ARCA</h3>
        <button
          type="button"
          onClick={onOpenApp}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#E7B956] px-5 text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] cursor-pointer"
        >
          <span>Open ARCA</span>
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </ScrollFade>
    </article>
  );
}
