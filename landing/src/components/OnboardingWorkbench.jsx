import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CornerDownLeft,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

// --- Cycle Definitions ---
const CYCLES = {
  monthly: {
    id: 'monthly',
    label: 'Monthly',
    title: 'November 2026',
    unit: 'month',
    daysInCycle: 30,
    defaultDay: 23,
    dayPresets: [8, 15, 23, 28],
    incomePresets: [3200, 3820, 5200, 7400],
    scale: 1,
  },
  biweekly: {
    id: 'biweekly',
    label: 'Bi-weekly',
    title: 'Nov 14 – Nov 27',
    unit: 'cycle',
    daysInCycle: 14,
    defaultDay: 10,
    dayPresets: [3, 7, 10, 13],
    incomePresets: [1600, 1910, 2600, 3700],
    scale: 0.5,
  },
  weekly: {
    id: 'weekly',
    label: 'Weekly',
    title: 'Nov 19 – Nov 25',
    unit: 'week',
    daysInCycle: 7,
    defaultDay: 5,
    dayPresets: [2, 4, 5, 6],
    incomePresets: [800, 955, 1300, 1850],
    scale: 0.25,
  },
};

// --- Initial Categories (Monthly Base) ---
const BASE_CATEGORIES = [
  { id: 'housing', name: 'Housing & Utilities', budget: 2200, priorSpent: 0 },
  { id: 'groceries', name: 'Groceries', budget: 650, priorSpent: 315.9 },
  { id: 'dining', name: 'Dining & Coffee', budget: 300, priorSpent: 322.3 },
  { id: 'transport', name: 'Transit & Gas', budget: 220, priorSpent: 111.6 },
  { id: 'software', name: 'Subscriptions', budget: 100, priorSpent: 73.0 },
  { id: 'misc', name: 'Shopping & Misc', budget: 350, priorSpent: 86.5 },
];

// --- Initial Transactions (Monthly Base) ---
const BASE_TRANSACTIONS = [
  { id: 't1', merchant: 'Trader Joe’s', categoryId: 'groceries', date: 'Nov 23', amount: -84.32, pending: true },
  { id: 't2', merchant: 'Blue Bottle Coffee', categoryId: 'dining', date: 'Nov 23', amount: -6.75 },
  { id: 't3', merchant: 'Shell Service Station', categoryId: 'transport', date: 'Nov 22', amount: -52.4 },
  { id: 't4', merchant: 'Stripe Payroll', categoryId: 'income', date: 'Nov 21', amount: 3450.0 },
  { id: 't5', merchant: 'Sweetgreen', categoryId: 'dining', date: 'Nov 21', amount: -19.85 },
  { id: 't6', merchant: 'Whole Foods Market', categoryId: 'groceries', date: 'Nov 20', amount: -142.18 },
  { id: 't7', merchant: 'Linear Orbit', categoryId: 'software', date: 'Nov 19', amount: -16.0 },
  { id: 't8', merchant: 'Apple Store', categoryId: 'misc', date: 'Nov 18', amount: -129.0 },
  { id: 't9', merchant: 'Avalon Residential', categoryId: 'housing', date: 'Nov 15', amount: -2150.0 },
];

const STEPS = [
  { id: 0, num: '01', label: 'Take-home' },
  { id: 1, num: '02', label: 'Limits' },
  { id: 2, num: '03', label: 'Pace' },
];

const formatUSD = (value, showSign = false, alwaysCents = false) => {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: alwaysCents ? 2 : abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (showSign && value > 0) return `+${formatted}`;
  if (showSign && value < 0) return `-${formatted}`;
  return formatted;
};

const roundTo5 = (val) => Math.max(0, Math.round(val / 5) * 5);

export default function OnboardingWorkbench({ appUrl }) {
  // --- Interactive Onboarding State ---
  const [step, setStep] = useState(0);
  const [cycleId, setCycleId] = useState('monthly');
  const [dayOfCycle, setDayOfCycle] = useState(CYCLES.monthly.defaultDay);
  const [income, setIncome] = useState(3820);
  const [categories, setCategories] = useState(BASE_CATEGORIES);
  const [transactions, setTransactions] = useState(BASE_TRANSACTIONS);

  // --- Preview Interactive State ---
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMerchant, setNewMerchant] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('dining');
  const [newAmount, setNewAmount] = useState('');
  const [openMenuTxId, setOpenMenuTxId] = useState(null);

  // Refs for invisible keyboard progression (preventScroll so mount never jumps viewport)
  const incomeInputRef = useRef(null);
  const firstLimitInputRef = useRef(null);
  const limitInputRefs = useRef([]);
  const addMerchantRef = useRef(null);
  const hasInteractedStep = useRef(false);

  const cycle = CYCLES[cycleId];
  const monthPacePct = Math.round((dayOfCycle / cycle.daysInCycle) * 100);
  const daysRemaining = Math.max(1, cycle.daysInCycle - dayOfCycle);

  // Focus primary input cleanly on step transitions
  useEffect(() => {
    if (!hasInteractedStep.current) return;
    if (step === 0) {
      incomeInputRef.current?.focus({ preventScroll: true });
      incomeInputRef.current?.select?.();
    } else if (step === 1) {
      firstLimitInputRef.current?.focus({ preventScroll: true });
      firstLimitInputRef.current?.select?.();
    }
  }, [step]);

  useEffect(() => {
    if (showAddForm) {
      addMerchantRef.current?.focus({ preventScroll: true });
    }
  }, [showAddForm]);

  const goToStep = (nextStep) => {
    hasInteractedStep.current = true;
    setStep(nextStep);
  };

  // Switch pay cycle & scale values proportionally
  const handleCycleChange = (nextCycleId) => {
    if (nextCycleId === cycleId) return;
    const prevScale = CYCLES[cycleId].scale;
    const nextCycle = CYCLES[nextCycleId];
    const ratio = nextCycle.scale / prevScale;

    setCycleId(nextCycleId);
    setDayOfCycle(nextCycle.defaultDay);
    setIncome((prev) => Math.max(100, Math.round(prev * ratio)));
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        budget: roundTo5(cat.budget * ratio),
        priorSpent: Number((cat.priorSpent * ratio).toFixed(2)),
      }))
    );
    setTransactions((prev) =>
      prev.map((tx) => ({
        ...tx,
        amount: Number((tx.amount * ratio).toFixed(2)),
      }))
    );
  };

  // Compute live spent per category directly from priorSpent + transactions
  const categoriesWithSpent = useMemo(() => {
    const txTotals = {};
    for (const tx of transactions) {
      if (tx.amount < 0) {
        txTotals[tx.categoryId] = (txTotals[tx.categoryId] || 0) + Math.abs(tx.amount);
      }
    }
    return categories.map((cat) => ({
      ...cat,
      spent: Number((cat.priorSpent + (txTotals[cat.id] || 0)).toFixed(2)),
    }));
  }, [categories, transactions]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const totals = useMemo(() => {
    const budget = categoriesWithSpent.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
    const spent = categoriesWithSpent.reduce((acc, c) => acc + c.spent, 0);
    const remaining = budget - spent;
    const unassigned = income - budget;
    return {
      budget,
      spent,
      remaining,
      unassigned,
      spentPct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
    };
  }, [categoriesWithSpent, income]);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      const matchesCat = !selectedCategory || tx.categoryId === selectedCategory;
      const matchesQuery =
        !q ||
        tx.merchant.toLowerCase().includes(q) ||
        (categoryMap[tx.categoryId] ?? 'Income').toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [transactions, selectedCategory, query, categoryMap]);

  // Update individual category limit
  const handleLimitChange = (id, rawValue) => {
    const cleaned = rawValue.replace(/[^0-9]/g, '');
    const numeric = cleaned === '' ? 0 : Math.min(99999, Number(cleaned));
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, budget: numeric } : c))
    );
  };

  // Apply clean allocation presets relative to current income
  const applyPresetSplit = (preset) => {
    const weights =
      preset === '503020'
        ? { housing: 0.44, groceries: 0.14, dining: 0.08, transport: 0.08, software: 0.04, misc: 0.22 }
        : preset === 'lean'
        ? { housing: 0.55, groceries: 0.18, dining: 0.06, transport: 0.07, software: 0.03, misc: 0.11 }
        : { housing: 0.576, groceries: 0.17, dining: 0.079, transport: 0.058, software: 0.026, misc: 0.091 };

    let running = 0;
    const next = categories.map((cat, idx) => {
      if (idx === categories.length - 1) {
        return { ...cat, budget: Math.max(0, income - running) };
      }
      const val = roundTo5(income * (weights[cat.id] || 0.1));
      running += val;
      return { ...cat, budget: val };
    });
    setCategories(next);
  };

  // Auto-balance unassigned difference into Shopping & Misc (or proportionally)
  const handleAutoBalance = () => {
    if (totals.unassigned === 0) return;
    if (totals.budget === 0) {
      applyPresetSplit('default');
      return;
    }
    const factor = income / totals.budget;
    let running = 0;
    const next = categories.map((cat, idx) => {
      if (idx === categories.length - 1) {
        return { ...cat, budget: Math.max(0, income - running) };
      }
      const scaled = roundTo5(cat.budget * factor);
      running += scaled;
      return { ...cat, budget: scaled };
    });
    setCategories(next);
  };

  // Add a live test transaction to the preview ledger
  const handleAddTransaction = (e) => {
    e.preventDefault();
    const merchant = newMerchant.trim();
    const parsedAmount = parseFloat(newAmount);
    if (!merchant || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    const newTx = {
      id: `tx_${Date.now()}`,
      merchant,
      categoryId: newCategoryId,
      date: `Nov ${dayOfCycle}`,
      amount: -Math.abs(Number(parsedAmount.toFixed(2))),
      pending: true,
      isCustom: true,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNewMerchant('');
    setNewAmount('');
    setShowAddForm(false);
    setSelectedCategory(null);
  };

  const handleRecategorizeTx = (txId, nextCategoryId) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === txId ? { ...tx, categoryId: nextCategoryId } : tx))
    );
    setOpenMenuTxId(null);
  };

  const handleDeleteTx = (txId) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== txId));
    setOpenMenuTxId(null);
  };

  return (
    <section
      aria-label="Interactive ARCA budget setup and live preview"
      className="mx-auto max-w-[1280px] px-4 sm:px-6"
    >
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white lg:flex">
        {/* ════════════════════════════════════════════════════════════════════
            LEFT COLUMN: Focused Single-Column Onboarding
           ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col justify-between border-b border-zinc-200/80 bg-white lg:w-[376px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div>
            {/* Minimal Hairline Step Navigation */}
            <div className="grid grid-cols-3 border-b border-zinc-100">
              {STEPS.map((item) => {
                const isActive = step === item.id;
                const isCompleted = step > item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToStep(item.id)}
                    className={`relative flex items-center justify-center gap-1.5 py-3 text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'font-medium text-zinc-950'
                        : isCompleted
                        ? 'text-zinc-600 hover:text-zinc-950'
                        : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-zinc-400">
                      {isCompleted ? (
                        <Check className="h-3 w-3 text-zinc-900" strokeWidth={2} />
                      ) : (
                        item.num
                      )}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-[1.5px] bg-zinc-950" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="p-6">
              {/* STEP 0: Take-Home Pay & Cycle */}
              {step === 0 && (
                <div key="step-0" className="animate-step-enter space-y-6">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                      {cycle.label} take-home pay
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                      Enter net pay after taxes. Watch the live budget on the right recalculate immediately.
                    </p>
                  </div>

                  {/* Pay Cycle Segmented Control */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-zinc-500">
                      Pay schedule
                    </label>
                    <div
                      role="group"
                      aria-label="Pay schedule"
                      className="grid grid-cols-3 rounded-md bg-zinc-100/90 p-0.5"
                    >
                      {Object.values(CYCLES).map((item) => {
                        const active = cycleId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleCycleChange(item.id)}
                            className={`rounded-[5px] py-1.5 text-xs transition-colors cursor-pointer ${
                              active
                                ? 'bg-white font-medium text-zinc-950 border border-zinc-200/80'
                                : 'text-zinc-500 hover:text-zinc-900 border border-transparent'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Numeric Currency Input */}
                  <div className="space-y-2.5">
                    <label
                      htmlFor="onboarding-income"
                      className="block text-[11px] font-medium text-zinc-500"
                    >
                      Net amount per {cycle.unit}
                    </label>
                    <div className="relative flex items-center">
                      <span className="pointer-events-none absolute left-3 text-base font-medium text-zinc-400">
                        $
                      </span>
                      <input
                        id="onboarding-income"
                        ref={incomeInputRef}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="100000"
                        value={income || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                          setIncome(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            goToStep(1);
                          }
                        }}
                        className="h-11 w-full rounded-md border border-zinc-200 bg-white pl-7 pr-3 text-lg font-semibold tracking-tight text-zinc-950 tabular-nums focus:border-zinc-950 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Quick-Select Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {cycle.incomePresets.map((preset) => {
                        const isMatch = income === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setIncome(preset)}
                            className={`rounded-md border px-2.5 py-1 text-xs tabular-nums transition-colors cursor-pointer ${
                              isMatch
                                ? 'border-zinc-950 bg-zinc-950 font-medium text-white'
                                : 'border-zinc-200/80 bg-zinc-50/70 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950'
                            }`}
                          >
                            {formatUSD(preset)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zero-Based Alignment Readout */}
                  <div className="border-t border-zinc-100 pt-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Zero-based balance</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium tabular-nums ${
                            totals.unassigned === 0
                              ? 'text-emerald-700'
                              : totals.unassigned < 0
                              ? 'text-rose-600'
                              : 'text-zinc-900'
                          }`}
                        >
                          {totals.unassigned === 0
                            ? '$0 unassigned'
                            : totals.unassigned > 0
                            ? `+${formatUSD(totals.unassigned)} left`
                            : `${formatUSD(totals.unassigned, true)} over`}
                        </span>
                        {totals.unassigned !== 0 && (
                          <button
                            type="button"
                            onClick={handleAutoBalance}
                            className="rounded border border-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950 cursor-pointer"
                          >
                            Fit
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fixed vs Flexible Snapshot */}
                    <dl className="divide-y divide-zinc-100 rounded-md border border-zinc-200/80 bg-[#F8F8F7] px-3">
                      {(() => {
                        const fixed = categories
                          .filter((c) => c.id === 'housing' || c.id === 'software')
                          .reduce((sum, c) => sum + c.budget, 0);
                        const flexible = Math.max(0, totals.budget - fixed);
                        const fixedPct = income > 0 ? Math.round((fixed / income) * 100) : 0;
                        const flexPct = income > 0 ? Math.round((flexible / income) * 100) : 0;

                        return (
                          <>
                            <div className="flex items-center justify-between py-2">
                              <dt className="text-zinc-500">Fixed bills</dt>
                              <dd className="tabular-nums text-zinc-900 font-medium">
                                {formatUSD(fixed)}{' '}
                                <span className="font-normal text-zinc-400">({fixedPct}%)</span>
                              </dd>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <dt className="text-zinc-500">Flexible envelopes</dt>
                              <dd className="tabular-nums text-zinc-900 font-medium">
                                {formatUSD(flexible)}{' '}
                                <span className="font-normal text-zinc-400">({flexPct}%)</span>
                              </dd>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <dt className="text-zinc-500">Daily safe spend</dt>
                              <dd className="tabular-nums text-zinc-900 font-medium">
                                {formatUSD(Math.max(0, totals.remaining / daysRemaining), false, true)}
                                <span className="font-normal text-zinc-400"> / day</span>
                              </dd>
                            </div>
                          </>
                        );
                      })()}
                    </dl>
                  </div>
                </div>
              )}

              {/* STEP 1: Set Category Limits */}
              {step === 1 && (
                <div key="step-1" className="animate-step-enter space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                        Set category limits
                      </h2>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Assign every dollar of {formatUSD(income)} across envelopes.
                      </p>
                    </div>
                  </div>

                  {/* Compact Zero-Based Bar + Split Presets */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200/80 bg-[#F8F8F7] px-3 py-2 text-xs">
                    <span
                      className={`font-medium tabular-nums ${
                        totals.unassigned === 0
                          ? 'text-emerald-700'
                          : totals.unassigned < 0
                          ? 'text-rose-600'
                          : 'text-zinc-800'
                      }`}
                    >
                      {totals.unassigned === 0
                        ? 'Balanced ($0 unassigned)'
                        : totals.unassigned > 0
                        ? `${formatUSD(totals.unassigned)} left to assign`
                        : `${formatUSD(Math.abs(totals.unassigned))} over take-home`}
                    </span>
                    {totals.unassigned !== 0 && (
                      <button
                        type="button"
                        onClick={handleAutoBalance}
                        className="text-[11px] font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600 cursor-pointer"
                      >
                        Balance to $0
                      </button>
                    )}
                  </div>

                  {/* Quick Allocation Presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 mr-1">Presets:</span>
                    {[
                      { id: 'default', label: 'Balanced' },
                      { id: '503020', label: '50 / 30 / 20' },
                      { id: 'lean', label: 'Lean' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPresetSplit(preset.id)}
                        className="rounded border border-zinc-200/80 bg-white px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Compact Inline Numeric Category List */}
                  <div className="divide-y divide-zinc-100 border-y border-zinc-100">
                    {categories.map((cat, idx) => {
                      const sharePct = income > 0 ? Math.round((cat.budget / income) * 100) : 0;
                      const isFocused = focusedCategory === cat.id;

                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center justify-between gap-3 py-2 transition-colors ${
                            isFocused ? 'bg-zinc-50/80 -mx-2 px-2 rounded' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <label
                              htmlFor={`limit-${cat.id}`}
                              className="block truncate text-xs font-medium text-zinc-900"
                            >
                              {cat.name}
                            </label>
                            <span className="text-[11px] text-zinc-400 tabular-nums">
                              {sharePct}% of pay
                            </span>
                          </div>

                          <div className="relative flex items-center">
                            <span className="pointer-events-none absolute left-2 text-xs text-zinc-400">
                              $
                            </span>
                            <input
                              id={`limit-${cat.id}`}
                              ref={(el) => {
                                limitInputRefs.current[idx] = el;
                                if (idx === 0) firstLimitInputRef.current = el;
                              }}
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={cat.budget === 0 ? '' : cat.budget}
                              placeholder="0"
                              onFocus={() => setFocusedCategory(cat.id)}
                              onBlur={() => setFocusedCategory(null)}
                              onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const nextEl = limitInputRefs.current[idx + 1];
                                  if (nextEl) {
                                    nextEl.focus({ preventScroll: true });
                                    nextEl.select?.();
                                  } else {
                                    goToStep(2);
                                  }
                                }
                              }}
                              className="h-7 w-24 rounded border border-zinc-200/90 bg-white pl-5 pr-2 text-right text-xs font-medium text-zinc-950 tabular-nums focus:border-zinc-950 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Pace Check & Launch */}
              {step === 2 && (
                <div key="step-2" className="animate-step-enter space-y-5">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                      Track spending pace
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                      Every category bar marks where you are in the {cycle.unit} with a 1px vertical tick so overruns show up early.
                    </p>
                  </div>

                  {/* Interactive Day Scrubber */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-zinc-500">Simulate cycle day</span>
                      <span className="font-mono text-zinc-900 tabular-nums">
                        Day {dayOfCycle} / {cycle.daysInCycle} ({monthPacePct}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {cycle.dayPresets.map((d) => {
                        const active = dayOfCycle === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDayOfCycle(d)}
                            className={`rounded-md border py-1.5 text-xs tabular-nums transition-colors cursor-pointer ${
                              active
                                ? 'border-zinc-950 bg-zinc-950 font-medium text-white'
                                : 'border-zinc-200/80 bg-zinc-50/70 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950'
                            }`}
                          >
                            Day {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Compact Plan Summary Table */}
                  <dl className="divide-y divide-zinc-100 border-y border-zinc-100 text-xs">
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-zinc-500">{cycle.label} take-home</dt>
                      <dd className="font-medium text-zinc-950 tabular-nums">
                        {formatUSD(income)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-zinc-500">Assigned across {categories.length} limits</dt>
                      <dd className="font-medium text-zinc-950 tabular-nums">
                        {formatUSD(totals.budget)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-zinc-500">Spent to date</dt>
                      <dd className="font-medium text-zinc-950 tabular-nums">
                        {formatUSD(totals.spent)} ({totals.spentPct}%)
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-zinc-500">Daily safe spend</dt>
                      <dd className="font-medium text-zinc-950 tabular-nums">
                        {formatUSD(Math.max(0, totals.remaining / daysRemaining))} / day
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Left Column Sticky Action Footer */}
          <div className="border-t border-zinc-100 bg-white px-6 py-4">
            {step < 2 ? (
              <div className="flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(step - 1)}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                    <span>Press</span>
                    <kbd className="inline-flex items-center gap-0.5 rounded border border-zinc-200 bg-zinc-50 px-1 py-0.2 font-mono text-[10px] text-zinc-600">
                      Enter
                      <CornerDownLeft className="h-2.5 w-2.5" strokeWidth={1.75} />
                    </kbd>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => goToStep(step + 1)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 px-3.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 cursor-pointer"
                >
                  <span>{step === 0 ? 'Set category limits' : 'Check pace'}</span>
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
                >
                  Edit limits
                </button>

                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 px-3.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <span>Open ARCA</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Live Ledger Preview (Mercury / Linear / Copilot Style)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 bg-[#F8F8F7] p-4 sm:p-5">
          {/* 1. Minimal App Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
                  title="Live preview updates as you edit"
                />
                <h3 className="text-base font-semibold tracking-tight text-zinc-950">
                  {cycle.title}
                </h3>
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">
                Day {dayOfCycle} of {cycle.daysInCycle} ({monthPacePct}% through {cycle.unit})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800 cursor-pointer"
            >
              {showAddForm ? (
                <>
                  <X className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Add expense</span>
                </>
              )}
            </button>
          </div>

          {/* 2. Unified Summary Strip (Hairline-Divided, Zero Shadows) */}
          <div className="mb-4 grid grid-cols-1 divide-y divide-zinc-200/80 rounded-lg border border-zinc-200/80 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="p-3.5 sm:col-span-2">
              <p className="text-xs font-medium text-zinc-500">Left to spend</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={`text-2xl font-semibold tracking-tight tabular-nums ${
                    totals.remaining < 0 ? 'text-rose-600' : 'text-zinc-950'
                  }`}
                >
                  {totals.remaining < 0
                    ? `-${formatUSD(Math.abs(totals.remaining))}`
                    : formatUSD(totals.remaining)}
                </span>
                <span className="text-xs text-zinc-500 tabular-nums">
                  of {formatUSD(totals.budget)} budgeted
                </span>
              </div>
            </div>

            <div className="p-3.5">
              <p className="text-xs font-medium text-zinc-500">
                Spent this {cycle.unit}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tracking-tight tabular-nums text-zinc-950">
                  {formatUSD(totals.spent)}
                </span>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {totals.spentPct}%
                </span>
              </div>
            </div>

            <div className="p-3.5">
              <p className="text-xs font-medium text-zinc-500">Daily safe spend</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-semibold tracking-tight tabular-nums text-zinc-950">
                  {formatUSD(Math.max(0, totals.remaining / daysRemaining))}
                </span>
                <span className="text-xs text-zinc-500">/ day left</span>
              </div>
            </div>
          </div>

          {/* 3. Asymmetric 12-Col Workspace: Categories (5) + Ledger (7) */}
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
            {/* LEFT: Monochrome Category Progress Bars with 1px Pace Tick */}
            <div className="rounded-lg border border-zinc-200/80 bg-white xl:col-span-5">
              <div className="flex items-center justify-between border-b border-zinc-100 px-3.5 py-2.5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Categories
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 tabular-nums">
                  <span className="inline-block h-2.5 w-px bg-zinc-400" />
                  <span>Pace ({monthPacePct}%)</span>
                </div>
              </div>

              <div className="divide-y divide-zinc-100">
                {categoriesWithSpent.map((cat) => {
                  const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : cat.spent > 0 ? 100 : 0;
                  const remaining = cat.budget - cat.spent;
                  const isOver = remaining < 0;
                  const isNearLimit = !isOver && pct >= 85;
                  const isSelected = selectedCategory === cat.id;
                  const isFocused = focusedCategory === cat.id;

                  // Strict semantic color discipline: charcoal default, amber/rose strictly for warnings/overages
                  const barColor = isOver
                    ? 'bg-rose-600'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-zinc-900';

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className={`w-full px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-100/80'
                          : isFocused
                          ? 'bg-zinc-50'
                          : 'hover:bg-zinc-50/70'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[13px] font-medium text-zinc-900">
                          {cat.name}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium tabular-nums ${
                            isOver ? 'text-rose-600' : 'text-zinc-900'
                          }`}
                        >
                          {isOver
                            ? `${formatUSD(Math.abs(remaining))} over`
                            : `${formatUSD(remaining)} left`}
                        </span>
                      </div>

                      {/* Progress Track + 1px Vertical Pace Notch */}
                      <div className="relative mt-2 h-1.5 w-full rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                        <div
                          className="absolute -top-0.5 h-2.5 w-px bg-zinc-400/80 transition-all duration-200"
                          style={{ left: `${monthPacePct}%` }}
                          title={`Cycle pace: ${monthPacePct}%`}
                        />
                      </div>

                      {/* Exact Ratio Micro-Row */}
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400 tabular-nums">
                        <span>
                          {formatUSD(cat.spent)} of {formatUSD(cat.budget)}
                        </span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Dense Hover-Interactive Transaction Ledger */}
            <div className="rounded-lg border border-zinc-200/80 bg-white xl:col-span-7">
              {/* Ledger Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Transactions
                  </h4>
                  {selectedCategory && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200 cursor-pointer"
                    >
                      <span>{categoryMap[selectedCategory]}</span>
                      <X className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                  )}
                </div>

                {/* Inline Filter Input */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter merchant..."
                    className="h-7 w-40 rounded-md border border-zinc-200/80 bg-zinc-50/50 pl-7 pr-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Inline Add-Expense Row (Toggled by "+ Add expense") */}
              {showAddForm && (
                <form
                  onSubmit={handleAddTransaction}
                  className="animate-step-enter flex flex-wrap items-center gap-2 border-b border-zinc-200/80 bg-[#F8F8F7] px-3.5 py-2.5"
                >
                  <input
                    ref={addMerchantRef}
                    type="text"
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setShowAddForm(false);
                    }}
                    placeholder="Merchant (e.g. Philz Coffee)"
                    required
                    className="h-7 min-w-[130px] flex-1 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                  />
                  <select
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    aria-label="Expense category"
                    className="h-7 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-zinc-950 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-2 text-xs text-zinc-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="14.50"
                      required
                      className="h-7 w-20 rounded border border-zinc-200 bg-white pl-5 pr-2 text-right text-xs text-zinc-900 tabular-nums focus:border-zinc-950 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-7 rounded bg-zinc-950 px-2.5 text-xs font-medium text-white hover:bg-zinc-800 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              {/* Dense Tabular Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[11px] font-medium text-zinc-400">
                      <th className="py-2 pl-3.5 pr-2 font-medium">Merchant</th>
                      <th className="px-2 py-2 font-medium">Category</th>
                      <th className="px-2 py-2 font-medium">Date</th>
                      <th className="py-2 pl-2 pr-10 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-[13px]">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center text-xs text-zinc-400"
                        >
                          No transactions match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const isIncome = tx.amount > 0;
                        const catLabel =
                          tx.categoryId === 'income'
                            ? 'Income'
                            : categoryMap[tx.categoryId] ?? 'Uncategorized';
                        const isMenuOpen = openMenuTxId === tx.id;

                        return (
                          <React.Fragment key={tx.id}>
                            <tr
                              className={`group transition-colors ${
                                isMenuOpen ? 'bg-zinc-50' : 'hover:bg-zinc-50/80'
                              }`}
                            >
                              {/* Merchant */}
                              <td className="py-2.5 pl-3.5 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-zinc-900 truncate max-w-[155px]">
                                    {tx.merchant}
                                  </span>
                                  {tx.pending && (
                                    <span className="shrink-0 rounded border border-zinc-200 px-1 py-0.2 text-[10px] font-medium text-zinc-500">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Monochrome Category Pill */}
                              <td className="px-2 py-2.5">
                                <span className="inline-block whitespace-nowrap rounded bg-zinc-100/80 px-1.5 py-0.5 text-[11px] text-zinc-600">
                                  {catLabel}
                                </span>
                              </td>

                              {/* Date */}
                              <td className="whitespace-nowrap px-2 py-2.5 text-xs text-zinc-500 tabular-nums">
                                {tx.date}
                              </td>

                              {/* Amount + Hover-Only Action */}
                              <td className="whitespace-nowrap py-2.5 pl-2 pr-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span
                                    className={`font-medium tabular-nums ${
                                      isIncome ? 'text-emerald-700' : 'text-zinc-950'
                                    }`}
                                  >
                                    {isIncome
                                      ? formatUSD(tx.amount, true, true)
                                      : formatUSD(Math.abs(tx.amount), false, true)}
                                  </span>

                                  <button
                                    type="button"
                                    aria-label={`Actions for ${tx.merchant}`}
                                    aria-expanded={isMenuOpen}
                                    onClick={() =>
                                      setOpenMenuTxId(isMenuOpen ? null : tx.id)
                                    }
                                    className={`rounded p-1 text-zinc-400 transition-opacity hover:bg-zinc-200/70 hover:text-zinc-700 cursor-pointer ${
                                      isMenuOpen
                                        ? 'opacity-100 bg-zinc-200/70 text-zinc-800'
                                        : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                                    }`}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Inline Expanded Row Action Strip (Zero Clipping) */}
                            {isMenuOpen && (
                              <tr className="bg-[#F8F8F7]">
                                <td colSpan={4} className="px-3.5 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                    <div className="flex flex-wrap items-center gap-1">
                                      {!isIncome ? (
                                        <>
                                          <span className="mr-1 text-zinc-400">Category:</span>
                                          {categories.map((c) => {
                                            const active = tx.categoryId === c.id;
                                            return (
                                              <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleRecategorizeTx(tx.id, c.id)}
                                                className={`rounded border px-1.5 py-0.5 transition-colors cursor-pointer ${
                                                  active
                                                    ? 'border-zinc-950 bg-zinc-950 font-medium text-white'
                                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950'
                                                }`}
                                              >
                                                {c.name}
                                              </button>
                                            );
                                          })}
                                        </>
                                      ) : (
                                        <span className="text-zinc-500">Payroll inflow</span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTx(tx.id)}
                                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Subtle Ledger Footer */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-3.5 py-2 text-xs text-zinc-400">
                <span className="tabular-nums">
                  Showing {filteredTransactions.length} transactions
                </span>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
                >
                  <span>Full ledger</span>
                  <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
