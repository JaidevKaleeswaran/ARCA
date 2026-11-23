import React, { useEffect } from 'react';
import { X, Zap, Clock, Gauge } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { QUOTA_LIMITS } from '../../utils/quotaManager';

export default function StackedProModal() {
  const { proModalConfig, closeProModal } = useBudget();
  const {
    isOpen = false,
    reason = 'QUOTA_EXHAUSTED',
    feature = 'receipts',
    used = QUOTA_LIMITS.receipts,
    limit = QUOTA_LIMITS.receipts,
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

  const weeklyCaps = [
    { label: 'Receipt Scanner', cap: `${QUOTA_LIMITS.receipts} scans / week` },
    { label: 'Voice Synthesis & Input', cap: `${QUOTA_LIMITS.voice} uses / week` },
    { label: 'AI Financial Assistant', cap: `${QUOTA_LIMITS.assistant} queries / week` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={closeProModal}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card-hover">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
              {isRateLimit ? <Zap size={18} /> : <Gauge size={18} />}
            </div>
            <h2 className="text-base font-bold text-text">
              {isRateLimit ? 'High Server Demand' : 'Weekly Limit Reached'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeProModal}
            className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Context Notice Banner */}
          <div className="p-4 rounded-xl bg-primary/60 border border-border space-y-3">
            <p className="text-xs text-text-muted leading-relaxed">
              {isRateLimit
                ? 'Our AI servers are experiencing high demand right now. Please try again in a few moments.'
                : `You have reached the weekly cap for ${featureLabel}. Usage automatically resets every Monday at 00:00 UTC.`}
            </p>

            {/* Usage & Reset Badge */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-text-muted font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                {used}/{limit} weekly {featureLabel} used
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 font-medium">
                <Clock size={12} />
                Resets Monday ({resetCountdown})
              </span>
            </div>
          </div>

          {/* Weekly Allowances Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted pl-1">
              Weekly Usage Limits
            </h4>
            <div className="divide-y divide-border rounded-xl border border-border bg-card-hover overflow-hidden">
              {weeklyCaps.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="font-medium text-text">{item.label}</span>
                  <span className="font-mono text-accent">{item.cap}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border bg-card-hover">
          <button
            type="button"
            onClick={closeProModal}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-accent hover:bg-accent-hover text-primary transition-colors shadow-sm cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
