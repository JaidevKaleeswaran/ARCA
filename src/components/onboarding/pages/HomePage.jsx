import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import OnboardingWorkbench from '../OnboardingWorkbench';
import ScrollFade from '../ScrollFade';

export default function HomePage({ navigate, onOpenApp }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-24">
      {/* ── 1. Minimal Editorial Hero (Scroll-fade + Pill CTA + Zero Clutter) ── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20">
        <ScrollFade y={14} delay={0} className="max-w-xl space-y-5">
          <h1 className="text-4xl sm:text-[52px] font-semibold tracking-[-0.035em] text-zinc-100 leading-[1.05]">
            Every dollar assigned before you spend.
          </h1>
          <p className="text-sm sm:text-[15px] text-zinc-400">
            Zero-based budgeting on a clean ledger.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onOpenApp}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#E7B956] px-5 text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] cursor-pointer"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => handleNav('/why-arca')}
              className="inline-flex h-10 items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-100 cursor-pointer"
            >
              <span>Why ARCA</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </ScrollFade>
      </section>

      {/* ── 2. Open Minimal Interactive Preview (Scroll-Fades In) ── */}
      <OnboardingWorkbench />

      {/* ── 3. Quiet Three-Point Principles (Staggered Scroll Fade, Trimmed Copy) ── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 pt-20 sm:pt-28">
        <div className="grid grid-cols-1 gap-10 border-t border-white/[0.08] pt-12 md:grid-cols-3 md:gap-12">
          <ScrollFade delay={0} className="space-y-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E7B956]" />
            <h2 className="text-sm font-semibold text-zinc-100">Zero-based limits</h2>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Assign every paycheck down to <span className="text-zinc-300 tabular-nums">$0</span> before spending begins.
            </p>
          </ScrollFade>

          <ScrollFade delay={90} className="space-y-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Voice &amp; receipt capture</h2>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Speak a purchase or scan a receipt. Media is deleted immediately.
            </p>
          </ScrollFade>

          <ScrollFade delay={180} className="space-y-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Private by default</h2>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Start in guest mode locally. No bank logins or ad trackers.
            </p>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
