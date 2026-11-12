import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTutorial } from './TutorialContext';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

const TAB_NAMES = {
  home: 'Home Page',
  assistant: 'AI Assistant',
  markets: 'Market Tracker',
  summary: 'Financial Summary',
  transactions: 'Expenses',
};

export default function TutorialOverlay() {
  const {
    activeTabId,
    currentStepIndex,
    currentStep,
    totalSteps,
    isTutorialActive,
    nextStep,
    prevStep,
    skipTutorial,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const popoverRef = useRef(null);

  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    let targetEl = document.querySelector(currentStep.targetSelector);
    if (!targetEl && currentStep.fallbackSelector) {
      targetEl = document.querySelector(currentStep.fallbackSelector);
    }

    if (!targetEl) {
      // Element not in DOM yet or condition not met
      setTargetRect(null);
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
  }, [currentStep]);

  // Scroll target into view & update rect when step changes
  useEffect(() => {
    if (!isTutorialActive || !currentStep) return;

    let targetEl = document.querySelector(currentStep.targetSelector);
    if (!targetEl && currentStep.fallbackSelector) {
      targetEl = document.querySelector(currentStep.fallbackSelector);
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Small delay to let scroll/animations settle
    const timer = setTimeout(() => {
      updateTargetPosition();
    }, 150);

    return () => clearTimeout(timer);
  }, [isTutorialActive, currentStep, updateTargetPosition]);

  // Recalculate on scroll, resize, or DOM mutations
  useEffect(() => {
    if (!isTutorialActive) return;

    const handleScrollOrResize = () => {
      updateTargetPosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isTutorialActive, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTutorialActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialActive, nextStep, prevStep, skipTutorial]);

  // Compute popover placement based on targetRect and viewport
  useEffect(() => {
    const popoverEl = popoverRef.current;
    const popoverWidth = popoverEl ? popoverEl.offsetWidth : 340;
    const popoverHeight = popoverEl ? popoverEl.offsetHeight : 180;
    const padding = 12;

    if (!targetRect) {
      // Center in viewport if target not found
      setPopoverPos({
        top: Math.max(20, (window.innerHeight - popoverHeight) / 2),
        left: Math.max(16, (window.innerWidth - popoverWidth) / 2),
        placement: 'center',
      });
      return;
    }

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    let top = 0;
    let left = 0;
    let placement = 'bottom';

    // On narrow screens (mobile), dock near bottom or top
    if (window.innerWidth < 640) {
      left = 16;
      if (spaceBelow > popoverHeight + 20) {
        top = Math.min(window.innerHeight - popoverHeight - 16, targetRect.bottom + 12);
        placement = 'bottom';
      } else {
        top = Math.max(16, targetRect.top - popoverHeight - 12);
        placement = 'top';
      }
    } else {
      // Desktop positioning
      if (spaceBelow >= popoverHeight + 20) {
        top = targetRect.bottom + 12;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        placement = 'bottom';
      } else if (spaceAbove >= popoverHeight + 20) {
        top = targetRect.top - popoverHeight - 12;
        left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        placement = 'top';
      } else {
        // Position to side if vertical space is constrained
        top = Math.max(20, targetRect.top);
        if (window.innerWidth - targetRect.right >= popoverWidth + 20) {
          left = targetRect.right + 12;
          placement = 'right';
        } else {
          left = Math.max(20, targetRect.left - popoverWidth - 12);
          placement = 'left';
        }
      }

      // Clamp horizontally within screen
      left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - popoverHeight - 16));
    }

    setPopoverPos({ top, left, placement });
  }, [targetRect, currentStep]);

  if (!isTutorialActive || !currentStep) return null;

  const isLastStep = currentStepIndex + 1 >= totalSteps;
  const padding = 8;
  const rx = 10;

  return (
    <div className="fixed inset-0 z-[9990] select-none">
      {/* SVG Mask Backdrop - Darkens everything EXCEPT the active spotlight target */}
      <svg className="fixed inset-0 w-full h-full pointer-events-auto" style={{ width: '100vw', height: '100vh' }}>
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White reveals the darkness */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole */}
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx={rx}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay fill with cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 8, 8, 0.78)"
          mask="url(#tutorial-spotlight-mask)"
        />

        {/* Golden animated glowing border around the cutout */}
        {targetRect && (
          <rect
            x={targetRect.left - padding}
            y={targetRect.top - padding}
            width={targetRect.width + padding * 2}
            height={targetRect.height + padding * 2}
            rx={rx}
            fill="none"
            stroke="#e7b956"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Floating Popover Tooltip Box */}
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: `${popoverPos.top}px`,
          left: `${popoverPos.left}px`,
          zIndex: 9999,
        }}
        className="w-[calc(100vw-32px)] sm:w-[380px] bg-[#1a1815] border border-[#38342e] rounded-2xl p-5 shadow-2xl backdrop-blur-md text-text transition-all duration-200 pointer-events-auto"
      >
        {/* Header: Tab badge + Step Counter */}
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-accent">
            <Sparkles size={14} className="animate-spin text-accent" style={{ animationDuration: '4s' }} />
            <span>{TAB_NAMES[activeTabId] || 'Page'} Tutorial</span>
          </div>
          <span className="text-[11px] font-medium bg-[#2a2620] text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700/50">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Content: Title & Description */}
        <div className="space-y-1.5 mb-5">
          <h3 className="text-base font-bold text-white tracking-tight">
            {currentStep.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center space-x-1 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-6 bg-accent'
                  : i < currentStepIndex
                  ? 'w-2 bg-accent/40'
                  : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={skipTutorial}
            className="text-xs text-zinc-400 hover:text-zinc-200 hover:underline transition-colors font-medium py-1 px-1"
          >
            Already did tutorial
          </button>

          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="p-1.5 text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
                title="Previous step"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={nextStep}
              className="flex items-center space-x-1.5 text-xs bg-accent hover:bg-accent-hover text-primary font-bold px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>{isLastStep ? 'Finish' : 'Next'}</span>
              {isLastStep ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
