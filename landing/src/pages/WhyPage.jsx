import React from 'react';
import { Target, Sparkles, HeartHandshake, Zap, ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function WhyPage({ navigate, appUrl }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Back button */}
      <button
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-[#e7b956] transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      {/* Hero Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#e7b956] bg-[#e7b956]/10 px-3 py-1 rounded-full border border-[#e7b956]/20">
          <Sparkles size={14} />
          <span>Our Origin & Purpose</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Why We Made <span className="gold-gradient-text">ARCA</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
          Most budgeting apps show you where your money went after it is already gone. We built ARCA to give you command over your money before you spend a single dime.
        </p>
      </div>

      {/* Story Sections */}
      <div className="grid grid-cols-1 gap-8">
        {/* Section 1: The Problem with Traditional Finance Apps */}
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <Target size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">
            The Problem: The "Rearview Mirror" Trap
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            For years, the personal finance industry has sold the idea that tracking expenses means staring at complicated retroactive pie charts at the end of the month. You see that you spent $400 on dining out, feel guilty, and do it all over again the next month.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Meanwhile, other apps push paid bank account sync integrations that disconnect constantly, monetize by selling credit cards, or overwhelm users with 50-tab spreadsheets.
          </p>
        </div>

        {/* Section 2: The Zero-Based Solution */}
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#e7b956]/10 text-[#e7b956] flex items-center justify-center border border-[#e7b956]/20">
            <Zap size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">
            The Philosophy: Giving Every Dollar a Job
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Zero-based budgeting is the gold standard for achieving genuine wealth velocity. The principle is simple:
          </p>
          <div className="bg-[#24221d] border border-[#33302a] p-4 rounded-xl text-xs sm:text-sm font-mono text-[#e7b956] my-2">
            Total Income − Total Allocated Category Envelopes = Exactly $0.00
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            When you assign your income into intentional buckets (Housing, Groceries, Savings, Investments, Fun) before your cycle begins, you eliminate financial anxiety. Spending money is no longer guilty—it's budgeted.
          </p>
        </div>

        {/* Section 3: AI Intelligence that actually helps */}
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#2e5b45]/30 text-[#3a7056] flex items-center justify-center border border-[#2e5b45]/40">
            <HeartHandshake size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">
            The Modern Edge: Multi-Agent AI
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Manual entry used to be painful. That is why we infused ARCA with specialized AI agents:
          </p>
          <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-5">
            <li><strong className="text-white">Voice Receipt dictation:</strong> Say "Spent $16 on fuel" while walking to your car. ARCA parses and logs it into your Transport envelope.</li>
            <li><strong className="text-white">Receipt OCR:</strong> Snap a photo of a store slip to extract merchants and tax details in seconds.</li>
            <li><strong className="text-white">Conversational Financial Queries:</strong> Ask ARCA real questions like "Can I afford dinner tonight?" or "How much have I saved this cycle?"</li>
            <li><strong className="text-white">Zero Advertising & Respect for Privacy:</strong> We never sell your personal financial records to third-party ad networks.</li>
          </ul>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-[#22201d] to-[#1c1a17] border border-[#e7b956]/40 rounded-2xl p-8 sm:p-10 text-center space-y-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-white">
          Experience the Difference with ARCA
        </h3>
        <p className="text-sm text-zinc-300 max-w-xl mx-auto">
          Start allocating with purpose. Free to use, instant setup, and zero unnecessary fluff.
        </p>
        <div>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-[#e7b956] hover:bg-[#f0c76e] text-[#161614] font-bold px-6 py-3 rounded-xl transition-all shadow-xl active:scale-95"
          >
            <span>Open ARCA Application</span>
            <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
