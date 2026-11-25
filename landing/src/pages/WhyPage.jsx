import React from 'react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function WhyPage({ navigate, appUrl }) {
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
          Background
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-zinc-950 leading-[1.12]">
          Why we made ARCA
        </h1>
        <p className="text-[15px] text-zinc-600 leading-relaxed">
          Most personal finance tools show where money went after the month is already over. We built ARCA to give every dollar a boundary before spending begins.
        </p>
      </header>

      {/* Essay Sections */}
      <div className="space-y-10">
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            1. The rearview mirror problem
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Traditional budgeting apps rely on retroactive categorization. You connect bank accounts, wait until the end of the month, and open a pie chart showing where your budget drifted. Post-mortem charts produce guilt without giving you control in the moment you are deciding whether to spend.
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            On top of that, many free consumer apps monetize through credit card referrals or require maintaining fragile multi-tab spreadsheets that fall behind after a busy week.
          </p>
        </section>

        <section className="space-y-4 border-t border-zinc-200/80 pt-10">
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            2. Zero-based allocation
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Zero-based budgeting assigns every dollar of incoming take-home pay to a concrete category before the pay cycle runs. The accounting rule is exact:
          </p>
          <div className="rounded-lg border border-zinc-200/80 bg-white px-4 py-3 font-mono text-xs font-medium text-zinc-900 tabular-nums">
            Take-home pay − Category limits = $0.00
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            When housing, groceries, savings, debt repayment, and discretionary funds are capped up front, you stop checking a vague checking-account balance to guess what is safe to buy. Spending is either funded or it requires moving money from another limit.
          </p>
        </section>

        <section className="space-y-4 border-t border-zinc-200/80 pt-10">
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            3. Built for daily capture
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Envelope budgets fail when logging expenses takes too many taps. ARCA reduces entry friction so the ledger stays current:
          </p>
          <dl className="divide-y divide-zinc-200/80 rounded-lg border border-zinc-200/80 bg-white">
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-950">Voice entry</dt>
              <dd className="mt-1 text-xs text-zinc-600 sm:col-span-2 sm:mt-0 leading-relaxed">
                Speak a merchant and amount; ARCA parses and logs it into the right category, then discards the audio immediately.
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-950">Receipt capture</dt>
              <dd className="mt-1 text-xs text-zinc-600 sm:col-span-2 sm:mt-0 leading-relaxed">
                Photograph paper receipts to pull merchant, date, and totals automatically without retaining the image.
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-950">Pay-cycle resets</dt>
              <dd className="mt-1 text-xs text-zinc-600 sm:col-span-2 sm:mt-0 leading-relaxed">
                Run weekly, bi-weekly, or monthly cycles aligned with your pay schedule instead of arbitrary calendar boundaries.
              </dd>
            </div>
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-xs font-medium text-zinc-950">Strict privacy</dt>
              <dd className="mt-1 text-xs text-zinc-600 sm:col-span-2 sm:mt-0 leading-relaxed">
                No ad trackers, no data brokers, and no selling personal financial records to third parties.
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Quiet Bottom Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-zinc-200/80 bg-white p-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">
            Try your first cycle in ARCA
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Free in guest mode or with an account.
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
