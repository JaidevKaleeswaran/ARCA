import React, { useEffect, useState } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { Modal } from '../ui/Modal';
import {
  AlertTriangle,
  AlertOctagon,
  Bell,
  TrendingDown,
  CreditCard,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import CategoryModal from '../home/CategoryModal';

function AlertRow({ alert, onAction }) {
  const configs = {
    danger: {
      dot: 'bg-rose-500',
      text: 'text-rose-400',
      icon: AlertOctagon,
    },
    warning: {
      dot: 'bg-[#E7B956]',
      text: 'text-[#E7B956]',
      icon: AlertTriangle,
    },
    large: {
      dot: 'bg-[#E7B956]',
      text: 'text-[#E7B956]',
      icon: TrendingDown,
    },
    subscription: {
      dot: 'bg-zinc-400',
      text: 'text-zinc-200',
      icon: CreditCard,
    },
    unallocated: {
      dot: 'bg-[#E7B956]',
      text: 'text-[#E7B956]',
      icon: Wallet,
    },
    info: {
      dot: 'bg-zinc-600',
      text: 'text-zinc-400',
      icon: Bell,
    },
  };

  const cfg = configs[alert.type] || configs.info;
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.text}`} strokeWidth={1.5} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium text-zinc-100">{alert.category || alert.title}</h4>
          {alert.tag && (
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-400">
              {alert.tag}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{alert.message}</p>
        {alert.cta && (
          <button
            type="button"
            onClick={() => onAction(alert)}
            className="inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-[#E7B956] hover:underline cursor-pointer"
          >
            <span>{alert.cta}</span>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationHub() {
  const { categories, categorySpending, transactions, totalIncome, leftToBudget } = useBudget();
  const [alerts, setAlerts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);

  useEffect(() => {
    const newAlerts = [];

    categories.forEach((category) => {
      const spent = categorySpending[category.id] || 0;
      const limit = category.limit;
      if (limit === 0) return;

      const percent = (spent / limit) * 100;
      if (percent > 100) {
        newAlerts.push({
          id: `over_${category.id}`,
          type: 'danger',
          categoryObj: category,
          category: category.name,
          tag: 'Over budget',
          message: `Exceeded limit by ${formatCurrency(spent - limit)} (${formatCurrency(spent)} of ${formatCurrency(limit)}).`,
          cta: 'Adjust category limit',
        });
      } else if (percent === 100) {
        newAlerts.push({
          id: `limit_${category.id}`,
          type: 'danger',
          categoryObj: category,
          category: category.name,
          tag: 'Limit reached',
          message: `Entire ${formatCurrency(limit)} limit has been spent.`,
          cta: 'Edit category limit',
        });
      } else if (percent >= 85) {
        newAlerts.push({
          id: `warn_${category.id}`,
          type: 'warning',
          categoryObj: category,
          category: category.name,
          tag: `${Math.round(percent)}% used`,
          message: `Approaching ${formatCurrency(limit)} limit — ${formatCurrency(limit - spent)} remaining.`,
          cta: 'Review limit',
        });
      }
    });

    transactions.forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      if (!cat || !cat.limit) return;
      if (Number(tx.amount) > cat.limit * 0.25) {
        newAlerts.push({
          id: `large_${tx.id}`,
          type: 'large',
          categoryObj: cat,
          category: cat.name,
          tag: 'Large expense',
          message: `"${tx.description}" (${formatCurrency(tx.amount)}) exceeds 25% of your ${cat.name} cap.`,
          cta: 'Review category',
        });
      }
    });

    const subKeywords =
      /netflix|spotify|equinox|gym|icloud|apple|hulu|disney|prime|amazon prime|utility|internet|wifi|youtube|hbo|paramount|subscription/i;
    const detectedSubs = transactions.filter(
      (tx) => tx.recurring || tx.isSubscription || subKeywords.test(tx.description || '')
    );
    const subTotal = detectedSubs.reduce((s, t) => s + Number(t.amount), 0);
    setActiveSubscriptions(detectedSubs);

    if (detectedSubs.length > 0) {
      newAlerts.push({
        id: 'subs_overview',
        type: 'subscription',
        title: 'Recurring subscriptions',
        tag: `${detectedSubs.length} detected`,
        message: `${detectedSubs.length} recurring charge${detectedSubs.length > 1 ? 's' : ''} totalling ${formatCurrency(subTotal)} per cycle.`,
        cta: 'Inspect subscriptions',
      });
    }

    if (totalIncome > 0 && leftToBudget > totalIncome * 0.05) {
      newAlerts.push({
        id: 'unallocated',
        type: 'unallocated',
        title: 'Unallocated income',
        tag: 'Zero-based gap',
        message: `${formatCurrency(leftToBudget)} has no assigned category yet.`,
        cta: 'Create Savings envelope',
      });
    }

    if (transactions.length > 0) {
      categories.forEach((category) => {
        const spent = categorySpending[category.id] || 0;
        const hasTransactions = transactions.some((tx) => tx.categoryId === category.id);
        if (spent === 0 && !hasTransactions && category.limit > 0) {
          newAlerts.push({
            id: `zero_${category.id}`,
            type: 'info',
            categoryObj: category,
            category: category.name,
            tag: 'No activity',
            message: `No expenses logged yet against ${formatCurrency(category.limit)} limit.`,
            cta: 'Edit category',
          });
        }
      });
    }

    const priority = { danger: 0, warning: 1, large: 2, subscription: 3, unallocated: 4, info: 5 };
    newAlerts.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9));

    setAlerts(newAlerts);
  }, [categories, categorySpending, transactions, totalIncome, leftToBudget]);

  const handleAlertAction = (alert) => {
    if (alert.type === 'subscription') {
      setIsSubModalOpen(true);
    } else if (alert.type === 'unallocated') {
      setSelectedCategory({ name: 'Savings & Emergency Fund', limit: leftToBudget, color: '#e7b956' });
      setIsCategoryModalOpen(true);
    } else if (alert.categoryObj) {
      setSelectedCategory(alert.categoryObj);
      setIsCategoryModalOpen(true);
    }
  };

  const dangerCount = alerts.filter((a) => a.type === 'danger').length;
  const warningCount = alerts.filter((a) => a.type === 'warning' || a.type === 'large').length;
  const totalSubAmount = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Alerts
        </h2>

        <div className="flex items-center gap-2 text-[11px] tabular-nums">
          {dangerCount > 0 && <span className="text-rose-400">{dangerCount} over</span>}
          {warningCount > 0 && <span className="text-[#E7B956]">{warningCount} warning</span>}
          {alerts.length === 0 && <span className="text-zinc-500">Clear</span>}
        </div>
      </div>

      <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
        {alerts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-zinc-500">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onAction={handleAlertAction} />
          ))
        )}
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
      />

      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title="Recurring Subscriptions"
      >
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs text-zinc-500">
              {activeSubscriptions.length} recurring charges
            </span>
            <span className="text-base font-semibold text-[#E7B956] tabular-nums">
              {formatCurrency(totalSubAmount)} / cycle
            </span>
          </div>

          <div className="divide-y divide-white/[0.06] max-h-[260px] overflow-y-auto">
            {activeSubscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between py-2.5 text-xs">
                <div>
                  <p className="font-medium text-zinc-100">{sub.description}</p>
                  <p className="text-zinc-500 tabular-nums">{sub.date}</p>
                </div>
                <span className="font-medium text-zinc-100 tabular-nums">
                  {formatCurrency(sub.amount)}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsSubModalOpen(false)}
            className="h-9 w-full rounded-md bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] cursor-pointer"
          >
            Done
          </button>
        </div>
      </Modal>
    </section>
  );
}
