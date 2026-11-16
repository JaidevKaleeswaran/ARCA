import React from 'react';
import { Users, Shield, Compass, Sparkles, ArrowLeft, ArrowUpRight } from 'lucide-react';

export default function AboutPage({ navigate, appUrl }) {
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
          <Users size={14} />
          <span>Co-Founders & Mission</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          About <span className="gold-gradient-text">ARCA</span>
        </h1>
        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
          We are building the future of zero-based financial clarity.
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-4 shadow-lg">
          <h2 className="text-xl font-bold text-white">Who We Are</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            <strong className="text-white">ARCA-budgetting</strong> is the co-founding team behind the <strong className="text-[#e7b956]">ARCA</strong> personal finance web application.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            We started ARCA out of a frustration with complicated personal finance tools that treated budgeting as a punishment rather than an empowering roadmap. Our mission is to make intentional, zero-based budgeting accessible to everyone—from college students and freelancers to growing families and aggressive wealth-builders.
          </p>
        </div>

        {/* Guiding Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1c1a17] border border-[#38342e] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#e7b956]/10 text-[#e7b956] flex items-center justify-center border border-[#e7b956]/20">
              <Compass size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Clarity First</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              No financial jargon, no hidden fees, and no manipulative dark patterns. Every screen in ARCA is designed for instant comprehension.
            </p>
          </div>

          <div className="bg-[#1c1a17] border border-[#38342e] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#2e5b45]/30 text-[#3a7056] flex items-center justify-center border border-[#2e5b45]/40">
              <Shield size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Privacy by Design</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Your financial records belong exclusively to you. We do not sell your personal or budgeting data to advertisers or third-party lead generators.
            </p>
          </div>

          <div className="bg-[#1c1a17] border border-[#38342e] rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#8c6d37]/25 text-[#a48246] flex items-center justify-center border border-[#8c6d37]/35">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-white text-base">Autonomous Support</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              By pairing zero-based mathematics with multimodal AI agents, ARCA handles transaction sorting and voice transcription so you don't have to.
            </p>
          </div>
        </div>

        {/* Co-founder note */}
        <div className="bg-[#24221d] border border-[#38342e] rounded-2xl p-6 sm:p-8 space-y-3">
          <h3 className="text-base font-bold text-white">A Note from the Co-Founders</h3>
          <p className="text-sm text-zinc-300 italic leading-relaxed">
            "When we first designed ARCA, our goal was simple: if we can give every single dollar a job on payday, we never have to worry about whether there will be enough left over at the end of the month. We hope ARCA brings that same clarity and confidence to your financial life."
          </p>
          <p className="text-xs font-semibold text-[#e7b956] pt-1">
            — The ARCA-budgetting Co-Founding Team
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="text-center pt-4">
        <a
          href={appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 bg-[#e7b956] hover:bg-[#f0c76e] text-[#161614] font-bold px-6 py-3 rounded-xl transition-all shadow-xl active:scale-95"
        >
          <span>Get Started with ARCA</span>
          <ArrowUpRight size={18} />
        </a>
      </div>
    </div>
  );
}
