import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Lock,
  ReceiptText,
  SlidersHorizontal,
} from 'lucide-react';
import OnboardingWorkbench from '../components/OnboardingWorkbench';

export default function HomePage({ navigate, appUrl }) {
  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-24">
      {/* ── 1. Compact Editorial Header ── */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-8 sm:pt-10 pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-2xl sm:text-[34px] font-semibold tracking-[-0.03em] text-zinc-950 leading-[1.12]">
              Assign every dollar before you spend it.
            </h1>
            <p className="text-sm sm:text-[15px] text-zinc-600 leading-relaxed max-w-xl">
              ARCA is a zero-based personal ledger. Cap categories against take-home pay, track daily spending pace, and log expenses in seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-950 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <span>Open ARCA</span>
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>

            <button
              type="button"
              onClick={() => handleNav('/why-arca')}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-4 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 cursor-pointer"
            >
              <span>Why we made ARCA</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Split-Screen Interactive Onboarding + Live Ledger Preview ── */}
      <OnboardingWorkbench appUrl={appUrl} />

      {/* ── 3. Architectural Specification Strip (Zero Card-itis) ── */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-16 sm:pt-24">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              How ARCA works
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950">
              Ledger-first discipline, built for daily use.
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Zero bank logins required. Works in guest mode or synced with an account.
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-zinc-200/80 rounded-lg border border-zinc-200/80 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-950">
              <SlidersHorizontal className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold tracking-tight">
                Zero-based envelopes
              </h3>
            </div>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Divide each paycheck across housing, groceries, savings, and discretionary caps before the cycle starts. Unallocated dollars stay visible until your budget hits <span className="font-medium text-zinc-900 tabular-nums">$0</span>.
            </p>
          </div>

          <div className="p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-950">
              <ReceiptText className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold tracking-tight">
                Voice, receipt, or manual entry
              </h3>
            </div>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Speak a purchase aloud, snap a paper receipt, or type a row directly into the ledger. Every line item maps to its category and recalculates your daily safe spend immediately.
            </p>
          </div>

          <div className="p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-zinc-950">
              <Lock className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold tracking-tight">
                Private by architecture
              </h3>
            </div>
            <p className="text-[13px] text-zinc-500 leading-relaxed">
              Audio recordings and receipt photos are deleted immediately after extraction. We do not run ad trackers, push affiliate credit cards, or sell financial records to third parties.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Reading Index & Direct Launch Band ── */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 pt-16 sm:pt-20">
        <div className="grid grid-cols-1 divide-y divide-zinc-200/80 overflow-hidden rounded-lg border border-zinc-200/80 bg-white lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Hairline Editorial Links */}
          <div className="divide-y divide-zinc-100 lg:col-span-5">
            <button
              type="button"
              onClick={() => handleNav('/why-arca')}
              className="group flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-zinc-50/70 cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-zinc-950">
                  Why we made ARCA
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Prospective allocation instead of end-of-month spending autopsies.
                </p>
              </div>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-950"
                strokeWidth={1.5}
              />
            </button>

            <button
              type="button"
              onClick={() => handleNav('/about')}
              className="group flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-zinc-50/70 cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-zinc-950">
                  About the team
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Our privacy policy commitments and the principles behind ARCA.
                </p>
              </div>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-950"
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* Direct Launch Band */}
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 lg:col-span-7">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
                Start this cycle’s ledger.
              </h2>
              <p className="text-[13px] text-zinc-500 max-w-lg leading-relaxed">
                Free to use while in beta. Jump straight into guest mode to test your own numbers locally, or sign in to sync your budget across devices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-zinc-950 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
              >
                <span>Open ARCA</span>
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>

              <button
                type="button"
                onClick={() => handleNav('/privacy')}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                Read Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
