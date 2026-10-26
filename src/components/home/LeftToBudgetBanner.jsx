import React from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function LeftToBudgetBanner() {
  const { totalIncome, leftToBudget } = useBudget();

  if (totalIncome === 0) {
    return (
      <div
        data-tutorial="budget-banner"
        className="w-full rounded-xl border border-zinc-800 bg-[#1c1a17] p-3.5 flex items-center justify-center space-x-2.5 shadow-sm mb-6 text-zinc-400"
      >
        <Sparkles size={17} className="text-accent shrink-0" />
        <span className="font-medium text-xs sm:text-sm">Set your income sources to calculate your Zero-Based Budget</span>
      </div>
    );
  }

  let bgColor = '';
  let textColor = '';
  let borderColor = '';
  let IconComponent = null;
  let message = '';

  if (leftToBudget > 0) {
    bgColor = 'bg-[#2e5b45]/20';
    textColor = 'text-[#3a7056]';
    borderColor = 'border-[#2e5b45]/40';
    IconComponent = CheckCircle2;
    message = `${formatCurrency(leftToBudget)} Left to Budget`;
  } else if (leftToBudget === 0) {
    bgColor = 'bg-[#e7b956]/20';
    textColor = 'text-[#e7b956]';
    borderColor = 'border-[#e7b956]/40';
    IconComponent = CheckCircle2;
    message = 'Perfect! Every dollar has a job.';
  } else {
    bgColor = 'bg-[#ef4444]/10';
    textColor = 'text-[#ef4444]';
    borderColor = 'border-[#ef4444]/20';
    IconComponent = AlertTriangle;
    message = `Over-allocated by ${formatCurrency(Math.abs(leftToBudget))}! Reduce your category limits.`;
  }

  return (
    <div
      data-tutorial="budget-banner"
      className={`w-full rounded-xl border p-4 flex items-center justify-center space-x-3 shadow-sm mb-6 ${bgColor} ${borderColor} ${textColor}`}
    >
      {IconComponent && <IconComponent size={22} className="shrink-0" />}
      <span className="font-semibold text-lg">{message}</span>
    </div>
  );
}
