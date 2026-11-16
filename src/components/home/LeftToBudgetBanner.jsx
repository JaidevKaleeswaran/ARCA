import { useBudget } from '../../contexts/BudgetContext';
import NumberTicker from '../ui/reactbits/NumberTicker';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LeftToBudgetBanner() {
  const { totalIncome, leftToBudget } = useBudget();

  if (totalIncome === 0) {
    return (
      <div
        data-tutorial="budget-banner"
        className="w-full rounded-xl border border-border bg-card p-3.5 flex items-center justify-center space-x-2.5 shadow-sm mb-6 text-text-muted"
      >
        <span className="font-medium text-xs sm:text-sm">Set your income sources to calculate your Zero-Based Budget</span>
      </div>
    );
  }

  let bgColor = '';
  let textColor = '';
  let borderColor = '';
  let IconComponent = null;
  let message = null;

  if (leftToBudget > 0) {
    bgColor = 'bg-[#2e5b45]/20';
    textColor = 'text-[#3a7056]';
    borderColor = 'border-[#2e5b45]/40';
    IconComponent = CheckCircle2;
    message = (
      <span>
        <NumberTicker value={leftToBudget} prefix="$" /> Left to Budget
      </span>
    );
  } else if (leftToBudget === 0) {
    bgColor = 'bg-accent/15';
    textColor = 'text-accent';
    borderColor = 'border-accent/30';
    IconComponent = CheckCircle2;
    message = <span>Perfect! Every dollar has a job.</span>;
  } else {
    bgColor = 'bg-[#ef4444]/10';
    textColor = 'text-[#ef4444]';
    borderColor = 'border-[#ef4444]/20';
    IconComponent = AlertTriangle;
    message = (
      <span>
        Over-allocated by <NumberTicker value={Math.abs(leftToBudget)} prefix="$" />! Reduce your category limits.
      </span>
    );
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
