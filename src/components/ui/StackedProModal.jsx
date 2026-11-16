import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Shield, ArrowRight, Clock, Gauge, Loader2 } from 'lucide-react';
import { useBudget } from '../../contexts/BudgetContext';
import { toast } from 'react-hot-toast';

export default function StackedProModal() {
  const { proModalConfig, closeProModal, subscribeToPro } = useBudget();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const {
    isOpen = false,
    reason = 'QUOTA_EXHAUSTED',
    feature = 'receipts',
    used = 5,
    limit = 5,
    resetCountdown = 'in 2d 6h',
  } = proModalConfig || {};

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsSubscribing(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      if (subscribeToPro) {
        await subscribeToPro();
      }
      toast.success('Welcome to ARCA Pro! Unlimited AI assistant queries, receipt scans, and voice inputs unlocked.', {
        icon: '✓',
        duration: 4000,
      });
      setTimeout(() => {
        closeProModal();
        setIsSubscribing(false);
      }, 500);
    } catch (err) {
      console.warn('Subscription activation error:', err);
      toast.error('Failed to activate ARCA Pro. Please try again.');
      setIsSubscribing(false);
    }
  };

  if (!isOpen) return null;

  const featureLabels = {
    receipts: 'receipt scans',
    voice: 'voice inputs',
    assistant: 'assistant queries',
  };

  const featureLabel = featureLabels[feature] || 'AI operations';

  const isRateLimit = reason === 'UPSTREAM_RATE_LIMIT';

  const proFeatures = [
    { title: 'Unlimited Receipt Scans', desc: 'No weekly caps (Free: 5/wk)' },
    { title: 'Unlimited Voice Inputs', desc: 'Hands-free voice logging (Free: 5/wk)' },
    { title: 'Unlimited Financial Assistant', desc: 'Financial Q&A and analysis (Free: 10/wk)' },
    { title: 'Live Market Quotes & Benchmark Rates', desc: 'Live FRED rates, stock/crypto quotes & verified news' },
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
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-card-hover">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text flex items-center gap-1.5">
                ARCA Pro
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-accent/20 text-accent border border-accent/40 px-2 py-0.5 rounded-full">
                  Upgrade
                </span>
              </h2>
            </div>
          </div>
          <button
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
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
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
                    ? 'High demand: upgrade to ARCA Pro for priority dedicated bandwidth.'
                    : 'Your free weekly limit has been reached. Subscribe to ARCA Pro in order to scan/record further receipts and get unlimited AI access.'}
                </p>
              </div>
            </div>

            {/* Usage & Reset Badge */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-text-muted font-medium flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                {used}/{limit} weekly {featureLabel} used
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 font-medium">
                <Clock size={12} />
                Resets on Monday ({resetCountdown})
              </span>
            </div>
          </div>

          {/* Value Proposition List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted pl-1">
              Everything in ARCA Pro:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {proFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-2.5 rounded-lg bg-card-hover border border-border hover:border-accent/30 transition-colors"
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
        <div className="p-5 border-t border-border bg-card-hover space-y-2">
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-accent hover:bg-accent-hover text-primary disabled:opacity-90 transition-all shadow-md flex items-center justify-center space-x-2 group cursor-pointer"
          >
            {isSubscribing ? (
              <>
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Activating ARCA Pro...</span>
              </>
            ) : (
              <>
                <span>Subscribe to ARCA Pro</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          <button
            onClick={closeProModal}
            className="w-full py-2 text-xs font-medium text-text-muted hover:text-text transition-colors text-center cursor-pointer"
          >
            Continue with Free (Resets Monday)
          </button>
        </div>
      </div>
    </div>
  );
}
