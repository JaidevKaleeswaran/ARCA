import React, { useEffect } from 'react';
import { X, Sparkles, Check, Zap, Shield, ArrowRight, Clock, Gauge } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';

export default function StackedProModal() {
  const { proModalConfig, closeProModal } = useBudget();
  const {
    isOpen = false,
    reason = 'QUOTA_EXHAUSTED',
    feature = 'receipts',
    used = 18,
    limit = 18,
    resetCountdown = 'in 2d 6h',
  } = proModalConfig || {};

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const featureLabels = {
    receipts: 'receipt scans',
    voice: 'voice inputs',
    assistant: 'assistant queries',
  };

  const featureLabel = featureLabels[feature] || 'AI operations';

  const isRateLimit = reason === 'UPSTREAM_RATE_LIMIT';

  const proFeatures = [
    { title: 'Unlimited Receipt Scans', desc: 'No weekly caps (Free: 18/wk)' },
    { title: 'Unlimited Voice Inputs', desc: 'Hands-free voice logging (Free: 25/wk)' },
    { title: 'Unlimited AI Intelligence', desc: 'Financial Q&A and analysis (Free: 35/wk)' },
    { title: 'In-Process MCP Real-Time Tools', desc: 'Live FRED rates, stock/crypto quotes & verified news' },
    { title: 'Dedicated Priority Bandwidth', desc: 'Zero queue delays during peak market hours' },
    { title: 'Cloud Sync & Zero Data Loss', desc: 'Cross-device instant hydration and backup' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeProModal}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#0e0e11] border border-accent/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-amber-400 to-yellow-500" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-accent/15 blur-3xl rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-[#121217]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text flex items-center gap-1.5">
                Stacked Pro
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/20 text-accent border border-accent/40 px-2 py-0.5 rounded-full">
                  Upgrade
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={closeProModal}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-card-hover transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Context Notice Banner */}
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0 mt-0.5">
                {isRateLimit ? <Zap size={18} /> : <Gauge size={18} />}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-text">
                  {isRateLimit ? 'High Server Demand' : 'Weekly AI Limit Reached'}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {isRateLimit
                    ? 'High demand: upgrade to Stacked Pro for priority dedicated bandwidth.'
                    : 'Your free weekly limit has been reached. Subscribe to Stacked Pro in order to scan/record further receipts and get unlimited AI access.'}
                </p>
              </div>
            </div>

            {/* Usage & Reset Badge */}
            <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-text-muted font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                {used}/{limit} weekly {featureLabel} used
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                <Clock size={12} />
                Resets on Monday ({resetCountdown})
              </span>
            </div>
          </div>

          {/* Value Proposition List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted pl-1">
              Everything in Stacked Pro:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {proFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2.5 rounded-lg bg-card/60 border border-border/30 hover:border-accent/30 transition-colors"
                >
                  <div className="p-1 rounded-full bg-accent/15 text-accent shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text block">{feat.title}</span>
                    <span className="text-[11px] text-text-muted">{feat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Guarantee */}
          <div className="flex items-center justify-center space-x-2 text-[11px] text-text-muted pt-1">
            <Shield size={13} className="text-accent" />
            <span>Cancel anytime with 1-click. Instant activation.</span>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-5 border-t border-border/50 bg-[#121217] space-y-2">
          <button
            onClick={() => {
              // Simulated Pro Upgrade flow / Stripe redirect
              alert('Thank you for choosing Stacked Pro! Pro tier subscription checkout is now initializing.');
              closeProModal();
            }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-accent via-amber-400 to-yellow-500 text-black hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-accent/20 flex items-center justify-center space-x-2 group cursor-pointer"
          >
            <span>Upgrade to Stacked Pro — $9.99/mo</span>
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={closeProModal}
            className="w-full py-2 text-xs font-medium text-text-muted hover:text-text transition-colors text-center"
          >
            Continue with Free (Resets Monday)
          </button>
        </div>
      </div>
    </div>
  );
}
