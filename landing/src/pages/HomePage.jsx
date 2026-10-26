import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Brain,
  Mic,
  Camera,
  Layers,
  Repeat,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function HomePage({ navigate, appUrl }) {
  // Mini interactive demo state for the zero-based visualizer
  const [demoIncome, setDemoIncome] = useState(4200);
  const [housing, setHousing] = useState(1400);
  const [groceries, setGroceries] = useState(500);
  const [utilities, setUtilities] = useState(300);
  const [savings, setSavings] = useState(1200);
  const [fun, setFun] = useState(800);

  const totalAllocated = housing + groceries + utilities + savings + fun;
  const leftToBudget = demoIncome - totalAllocated;

  const handleNav = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-12 sm:pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#e7b956]/10 blur-[130px] rounded-full pointer-events-none -z-10" />

        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-[#22201d] border border-[#38342e] px-4 py-1.5 rounded-full text-xs font-medium text-zinc-300 shadow-sm animate-pulse">
          <Sparkles size={14} className="text-[#e7b956]" />
          <span>Next-Generation Zero-Based Budgeting</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#e7b956]">Multi-Agent AI</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Give every dollar a job. <br />
            Meet <span className="gold-gradient-text">ARCA</span>.
          </h1>
          <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate financial stress through intentional envelope allocation. Balance your cycle income to exactly $0, track expenses in real time, and converse with multi-agent AI.
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-gradient-to-r from-[#e7b956] to-[#cfa143] hover:from-[#f3cb6d] hover:to-[#dfaf4d] text-[#161614] font-bold text-base px-8 py-4 rounded-xl shadow-xl hover:shadow-[#e7b956]/20 transition-all active:scale-95 cursor-pointer"
          >
            <span>Launch ARCA App</span>
            <ArrowUpRight size={18} />
          </a>

          <button
            onClick={() => handleNav('/why-arca')}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#22201d] hover:bg-[#2c2a26] text-zinc-200 border border-[#38342e] font-semibold text-base px-7 py-4 rounded-xl transition-all cursor-pointer"
          >
            <span>Why We Made ARCA</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* App Showcase Card / Mockup */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="bg-[#181816] border border-[#38342e] rounded-3xl p-4 sm:p-8 shadow-2xl gold-glow-subtle relative overflow-hidden">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-[#2e2b26] pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <svg viewBox="0 0 36 44" fill="none" className="h-6 w-auto">
                  <rect x="0" y="2" width="36" height="10" rx="3.5" fill="#8c6d37" />
                  <rect x="0" y="17" width="36" height="10" rx="3.5" fill="#cfa143" />
                  <rect x="0" y="32" width="36" height="10" rx="3.5" fill="#e7b956" />
                </svg>
                <span className="font-extrabold text-white text-lg tracking-tight">ARCA</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-[#2e5b45]/30 text-[#3a7056] border border-[#2e5b45]/40 px-2.5 py-1 rounded-full font-medium">
                  Active Master Cycle: Monthly
                </span>
              </div>
            </div>

            {/* Mock Banner */}
            <div className="bg-[#e7b956]/15 border border-[#e7b956]/30 text-[#e7b956] rounded-xl p-3.5 mb-6 flex items-center justify-center space-x-2 font-semibold text-sm">
              <CheckCircle2 size={18} />
              <span>Perfect! Every dollar has a job. Balance: $0.00 Left to Budget</span>
            </div>

            {/* Mock Envelopes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-[#201e1a] border border-[#33302a] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-sm">Rent & Housing</span>
                  <span className="text-xs font-mono text-[#8c6d37]">$1,400.00</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#8c6d37] h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Spent: $1,400</span>
                  <span className="text-[#3a7056] font-medium">Remaining: $0</span>
                </div>
              </div>

              <div className="bg-[#201e1a] border border-[#33302a] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-sm">Groceries & Food</span>
                  <span className="text-xs font-mono text-[#2e5b45]">$500.00</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#2e5b45] h-full rounded-full" style={{ width: '64%' }} />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Spent: $320</span>
                  <span className="text-[#3a7056] font-medium">Remaining: $180</span>
                </div>
              </div>

              <div className="bg-[#201e1a] border border-[#33302a] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white text-sm">Emergency Savings</span>
                  <span className="text-xs font-mono text-[#e7b956]">$1,200.00</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#e7b956] h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Rollover Enabled</span>
                  <span className="text-[#e7b956] font-medium">Auto-Save</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Zero-Based Budgeting Sandbox ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Try Zero-Based Allocation Live
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Adjust the sliders below to see how ARCA ensures every dollar has a dedicated mission.
            </p>
          </div>

          {/* Real-time status banner */}
          <div
            className={`rounded-xl p-4 text-center font-bold text-sm sm:text-base border transition-all ${
              leftToBudget === 0
                ? 'bg-[#e7b956]/20 border-[#e7b956]/40 text-[#e7b956]'
                : leftToBudget > 0
                ? 'bg-[#2e5b45]/20 border-[#2e5b45]/40 text-[#3a7056]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {leftToBudget === 0
              ? '🎉 Exact Zero Allocation: Perfect! Every dollar has a job.'
              : leftToBudget > 0
              ? `💡 $${leftToBudget.toLocaleString()} Unassigned: Give this remaining money a purpose.`
              : `⚠️ Overallocated by $${Math.abs(leftToBudget).toLocaleString()}: Reduce envelopes to balance.`}
          </div>

          {/* Sliders grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2 bg-[#22201d] p-4 rounded-xl border border-[#33302a]">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Monthly Income</span>
                <span className="font-mono text-white font-bold">${demoIncome.toLocaleString()}</span>
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

            <div className="space-y-2 bg-[#22201d] p-4 rounded-xl border border-[#33302a]">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Housing & Rent</span>
                <span className="font-mono text-white font-bold">${housing.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="50"
                value={housing}
                onChange={(e) => setHousing(Number(e.target.value))}
                className="w-full accent-[#8c6d37] cursor-pointer"
              />
            </div>

            <div className="space-y-2 bg-[#22201d] p-4 rounded-xl border border-[#33302a]">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Groceries</span>
                <span className="font-mono text-white font-bold">${groceries.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="200"
                max="1500"
                step="50"
                value={groceries}
                onChange={(e) => setGroceries(Number(e.target.value))}
                className="w-full accent-[#2e5b45] cursor-pointer"
              />
            </div>

            <div className="space-y-2 bg-[#22201d] p-4 rounded-xl border border-[#33302a]">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-medium">Savings & Investments</span>
                <span className="font-mono text-white font-bold">${savings.toLocaleString()}</span>
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
        </div>
      </section>

      {/* ── 3. Core Features ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#e7b956] uppercase tracking-wider">
            <Layers size={14} />
            <span>Built for Speed & Insight</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Engineered from first principles to save time and give you absolute clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 hover:border-[#e7b956]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#e7b956]/10 text-[#e7b956] flex items-center justify-center border border-[#e7b956]/20">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Smart Quick-Fill</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Don't want to calculate percentages manually? Tap Quick-Fill to instantly apply 50/30/20, Student, or Aggressive Saver templates across all your envelopes.
            </p>
          </div>

          <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 hover:border-[#e7b956]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#2e5b45]/30 text-[#3a7056] flex items-center justify-center border border-[#2e5b45]/40">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Multi-Agent Intelligence</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Chat naturally with your AI financial advisor, dictate expenses with voice, or photograph paper receipts for automated parsing.
            </p>
          </div>

          <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 hover:border-[#e7b956]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#8c6d37]/25 text-[#a48246] flex items-center justify-center border border-[#8c6d37]/35">
              <Repeat size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Automated Cycle Rollover</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Whether your pay schedule is weekly, bi-weekly, or monthly, ARCA automatically archives cycles, audits leftovers, and rolls over designated savings envelopes.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Narrative Teasers: "Why We Made ARCA" & "About Us" ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#e7b956] uppercase tracking-wider">Origin</span>
            <h3 className="text-2xl font-bold text-white">Why We Made ARCA</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Traditional budgeting apps treat personal finance as an autopsy—analyzing spending when it's too late to change anything. We created ARCA so you can command every paycheck on day one.
            </p>
          </div>
          <div>
            <button
              onClick={() => handleNav('/why-arca')}
              className="inline-flex items-center space-x-2 text-sm font-semibold text-[#e7b956] hover:text-[#f3cb6d] transition-colors cursor-pointer"
            >
              <span>Read the full story</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="bg-[#1c1a17] border border-[#38342e] rounded-3xl p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#3a7056] uppercase tracking-wider">Mission</span>
            <h3 className="text-2xl font-bold text-white">About ARCA Budgeting</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              We are a dedicated team committed to financial empowerment and uncompromising privacy. We never sell your data to financial advertisers or flood your feed with high-interest loans.
            </p>
          </div>
          <div>
            <button
              onClick={() => handleNav('/about')}
              className="inline-flex items-center space-x-2 text-sm font-semibold text-[#3a7056] hover:text-[#529e7b] transition-colors cursor-pointer"
            >
              <span>Meet the co-founders</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 5. Big Bottom Call-to-Action ── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-b from-[#22201d] to-[#161614] border border-[#e7b956]/30 rounded-3xl p-8 sm:p-16 space-y-6 gold-glow-subtle">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to take command of your finances?
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto">
            Experience modern zero-based envelope budgeting. Free, privacy-respecting, and built for peace of mind.
          </p>
          <div className="pt-2">
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-[#e7b956] hover:bg-[#f0c76e] text-[#161614] font-bold text-base px-8 py-4 rounded-xl shadow-xl active:scale-95 cursor-pointer"
            >
              <span>Launch ARCA Now</span>
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
