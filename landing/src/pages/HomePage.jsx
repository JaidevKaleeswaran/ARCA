import React, { useState } from 'react';
import {
  ArrowUpRight,
  Layers,
  Repeat,
  Brain,
  ArrowRight
} from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';

export default function HomePage({ navigate, appUrl }) {
  // Mini interactive demo state for the zero-based visualizer
  const [demoIncome, setDemoIncome] = useState(4200);
  const [housing, setHousing] = useState(1400);
  const [groceries, setGroceries] = useState(500);
  const [utilities, setUtilities] = useState(300);
  const [savings, setSavings] = useState(1200);
  const [discretionary, setDiscretionary] = useState(800);

  const totalAllocated = housing + groceries + utilities + savings + discretionary;
  const leftToBudget = demoIncome - totalAllocated;

  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Percentages for allocation distribution bar
  const housingPct = Math.min(100, Math.round((housing / demoIncome) * 100));
  const groceriesPct = Math.min(100, Math.round((groceries / demoIncome) * 100));
  const utilitiesPct = Math.min(100, Math.round((utilities / demoIncome) * 100));
  const savingsPct = Math.min(100, Math.round((savings / demoIncome) * 100));
  const discretionaryPct = Math.min(100, Math.round((discretionary / demoIncome) * 100));

  return (
    <div className="space-y-24 sm:space-y-32 pb-24 bg-primary text-text">
      {/* ── 1. Hero Section ── */}
      <section className="pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 border border-accent/40 bg-accent/10 px-3.5 py-1 rounded-full text-xs font-mono text-accent">
            <span>ZERO-BASED PERSONAL FINANCE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight leading-[1.15]">
            Give every dollar a purpose. <br />
            Meet <span className="text-accent">ARCA</span>.
          </h1>

          <p className="text-base sm:text-lg text-text-muted max-w-xl mx-auto leading-relaxed pt-1">
            Assign your income to envelopes before spending begins. Balance your cycle to exactly <span className="text-accent font-mono">$0.00</span> and maintain absolute clarity over your cash flow.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-accent hover:bg-accent-hover text-primary font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <span>Launch ARCA</span>
            <ArrowUpRight size={15} />
          </a>

          <button
            onClick={() => handleNav('/why-arca')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-card hover:bg-card-hover text-accent border border-accent/40 hover:border-accent font-medium text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            <span>Why We Made ARCA</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── 2. Interactive Zero-Based Allocator (Yellow & Black Theme) ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <SpotlightCard className="p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Interactive Allocation Console
              </h2>
              <p className="text-xs text-text-muted">
                Adjust values to observe how zero-based budgeting balances income against envelopes.
              </p>
            </div>
            <div className="font-mono text-xs">
              <span className="text-text-muted">Cycle: </span>
              <span className="text-accent font-semibold">Monthly</span>
            </div>
          </div>

          {/* Allocation Breakdown Bar (Disciplined Unified Palette) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-muted font-mono">
              <span className="text-accent">Allocation Distribution</span>
              <span className="text-accent font-semibold">{Math.round((totalAllocated / demoIncome) * 100)}% allocated</span>
            </div>
            <div className="w-full h-2.5 bg-card-hover rounded-full overflow-hidden flex border border-border">
              <div style={{ width: `${housingPct}%` }} className="bg-accent h-full" title="Housing" />
              <div style={{ width: `${groceriesPct}%` }} className="bg-forest-light h-full" title="Groceries" />
              <div style={{ width: `${utilitiesPct}%` }} className="bg-forest h-full" title="Utilities" />
              <div style={{ width: `${savingsPct}%` }} className="bg-accent-hover h-full" title="Savings" />
              <div style={{ width: `${discretionaryPct}%` }} className="bg-text-muted h-full" title="Discretionary" />
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-text-muted pt-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Housing (<span className="text-accent font-mono">${housing}</span>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-light" /> Groceries (<span className="text-accent font-mono">${groceries}</span>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-forest" /> Utilities (<span className="text-accent font-mono">${utilities}</span>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-hover" /> Savings (<span className="text-accent font-mono">${savings}</span>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-text-muted" /> Discretionary (<span className="text-accent font-mono">${discretionary}</span>)
              </span>
            </div>
          </div>

          {/* Minimalist Status Banner (Yellow & Black, Zero Emojis) */}
          <div
            className={`rounded-lg px-4 py-3 flex items-center justify-between text-xs font-mono border transition-colors ${
              leftToBudget === 0
                ? 'bg-accent/15 border-accent/60 text-accent'
                : leftToBudget > 0
                ? 'bg-card border-accent/30 text-accent'
                : 'bg-red-950/20 border-red-800/40 text-red-400'
            }`}
          >
            <span>
              {leftToBudget === 0
                ? 'Status: Balanced. Every dollar is assigned.'
                : leftToBudget > 0
                ? 'Status: Unallocated funds remaining.'
                : 'Status: Overallocated. Deficit exceeds income.'}
            </span>
            <span className="font-semibold text-sm">
              {leftToBudget === 0
                ? '$0.00 left to budget'
                : leftToBudget > 0
                ? `+$${leftToBudget.toLocaleString()} remaining`
                : `-$${Math.abs(leftToBudget).toLocaleString()} deficit`}
            </span>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-2 bg-card-hover p-3.5 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Monthly Income</span>
                <span className="font-mono text-accent font-bold text-sm">${demoIncome.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="8000"
                step="100"
                value={demoIncome}
                onChange={(e) => setDemoIncome(Number(e.target.value))}
                className="w-full accent-[#e7b956] cursor-pointer"
              />
            </div>

            <div className="space-y-2 bg-card-hover p-3.5 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Housing & Rent</span>
                <span className="font-mono text-accent font-bold text-sm">${housing.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="50"
                value={housing}
                onChange={(e) => setHousing(Number(e.target.value))}
                className="w-full accent-[#e7b956] cursor-pointer"
              />
            </div>

            <div className="space-y-2 bg-card-hover p-3.5 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Groceries</span>
                <span className="font-mono text-accent font-bold text-sm">${groceries.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={groceries}
                onChange={(e) => setGroceries(Number(e.target.value))}
                className="w-full accent-[#e7b956] cursor-pointer"
              />
            </div>

            <div className="space-y-2 bg-card-hover p-3.5 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-text-muted font-medium">Savings & Investments</span>
                <span className="font-mono text-accent font-bold text-sm">${savings.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={savings}
                onChange={(e) => setSavings(Number(e.target.value))}
                className="w-full accent-[#e7b956] cursor-pointer"
              />
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* ── 3. Core Architecture ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-accent font-mono">Architecture</p>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Designed for precision and discipline.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="hover:border-accent/60 rounded-xl p-6 space-y-3 transition-colors">
            <span className="text-xs font-mono text-accent">01 / METHOD</span>
            <div className="flex items-center space-x-2">
              <Layers size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-white">Intentional Allocation</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Every dollar is assigned to an envelope upon paycheck receipt. Spending occurs from allocated buckets, not ambiguous checking account totals.
            </p>
          </SpotlightCard>

          <SpotlightCard className="hover:border-accent/60 rounded-xl p-6 space-y-3 transition-colors">
            <span className="text-xs font-mono text-accent">02 / SPEED</span>
            <div className="flex items-center space-x-2">
              <Brain size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-white">Frictionless Entry</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Log expenditures instantly through voice dictation, camera receipt capture, or manual input with intelligent category matching.
            </p>
          </SpotlightCard>

          <SpotlightCard className="hover:border-accent/60 rounded-xl p-6 space-y-3 transition-colors">
            <span className="text-xs font-mono text-accent">03 / FLOW</span>
            <div className="flex items-center space-x-2">
              <Repeat size={18} className="text-accent" />
              <h3 className="text-base font-semibold text-white">Deterministic Cycles</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              Cycles archive automatically on pay schedules. Unspent funds roll over to designated targets or reset for clean new periods.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* ── 4. Narrative Teasers ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpotlightCard className="hover:border-accent/60 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-colors">
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-accent">Origin</span>
            <h3 className="text-lg font-semibold text-white">Why We Made ARCA</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Traditional personal finance software focuses on retroactive autopsy—showing you where money went after it is already spent. ARCA operates prospectively.
            </p>
          </div>
          <div>
            <button
              onClick={() => handleNav('/why-arca')}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              <span>Read the background</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </SpotlightCard>

        <SpotlightCard className="hover:border-accent/60 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-colors">
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-accent">Principles</span>
            <h3 className="text-lg font-semibold text-white">About the Team</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Operated by ARCA Budgeting. Built with strict privacy commitments: we do not sell financial telemetry to advertisers or third-party lead generators.
            </p>
          </div>
          <div>
            <button
              onClick={() => handleNav('/about')}
              className="inline-flex items-center space-x-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors cursor-pointer"
            >
              <span>Learn about the team</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </SpotlightCard>
      </section>

      {/* ── 5. Bottom Call-to-Action ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <SpotlightCard className="border-accent/40 p-8 sm:p-12 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Ready to balance your first cycle?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            Zero-based envelope budgeting. Free, privacy-respecting, and built for intentional money management.
          </p>
          <div className="pt-2">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-accent hover:bg-accent-hover text-primary font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <span>Launch ARCA</span>
              <ArrowUpRight size={15} />
            </a>
          </div>
        </SpotlightCard>
      </section>
    </div>
  );
}
