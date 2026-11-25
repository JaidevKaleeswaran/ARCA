import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import ScrollFade from '../ScrollFade';

export default function WhyPage({ navigate, onOpenApp }) {
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
          Why we made ARCA
        </h1>
        <p className="text-[15px] text-zinc-400 leading-relaxed">
          Control before spending begins, not after the month ends.
        </p>
      </ScrollFade>

      <div className="space-y-10">
        <ScrollFade as="section" delay={60} className="space-y-3">
          <h2 className="text-base font-semibold text-zinc-100">
            1. The rearview mirror problem
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Traditional budgeting apps rely on retroactive categorization. You connect bank accounts, wait until the end of the month, and open a pie chart showing where your budget drifted. Post-mortem charts produce guilt without giving you control in the moment you are deciding whether to spend.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            On top of that, many free consumer apps monetize through credit card referrals or require maintaining fragile multi-tab spreadsheets that fall behind after a busy week.
          </p>
        </ScrollFade>

        <ScrollFade as="section" delay={60} className="space-y-4 border-t border-white/[0.08] pt-10">
          <h2 className="text-base font-semibold text-zinc-100">
            2. Zero-based allocation
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Zero-based budgeting assigns every dollar of incoming take-home pay to a concrete category before the pay cycle runs. The accounting rule is exact:
          </p>
          <div className="border-y border-white/[0.08] py-3 font-mono text-xs font-medium text-[#E7B956] tabular-nums">
            Take-home pay − Category limits = $0.00
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            When housing, groceries, savings, debt repayment, and discretionary funds are capped up front, you stop checking a vague checking-account balance to guess what is safe to buy. Spending is either funded or it requires moving money from another limit.
          </p>
        </ScrollFade>

        <ScrollFade as="section" delay={60} className="space-y-4 border-t border-white/[0.08] pt-10">
          <h2 className="text-base font-semibold text-zinc-100">
            3. Built for daily capture
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Envelope budgets fail when logging expenses takes too many taps. ARCA reduces entry friction so the ledger stays current:
          </p>
          <dl className="divide-y divide-white/[0.07] border-y border-white/[0.08]">
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-200">Voice entry</dt>
              <dd className="mt-1 text-xs text-zinc-400 sm:col-span-2 sm:mt-0 leading-relaxed">
                Speak a merchant and amount; ARCA parses and logs it into the right category, then discards the audio immediately.
              </dd>
            </div>
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-200">Receipt capture</dt>
              <dd className="mt-1 text-xs text-zinc-400 sm:col-span-2 sm:mt-0 leading-relaxed">
                Photograph paper receipts to pull merchant, date, and totals automatically without retaining the image.
              </dd>
            </div>
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-200">Pay-cycle resets</dt>
              <dd className="mt-1 text-xs text-zinc-400 sm:col-span-2 sm:mt-0 leading-relaxed">
                Run weekly, bi-weekly, or monthly cycles aligned with your pay schedule instead of arbitrary calendar boundaries.
              </dd>
            </div>
            <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-200">Strict privacy</dt>
              <dd className="mt-1 text-xs text-zinc-400 sm:col-span-2 sm:mt-0 leading-relaxed">
                No ad trackers, no data brokers, and no selling personal financial records to third parties.
              </dd>
            </div>
          </dl>
        </ScrollFade>
      </div>

      <ScrollFade className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.08] pt-8">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Try your first cycle in ARCA</h3>
        </div>
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
