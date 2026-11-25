import { useState, useCallback, useMemo } from 'react';
import IncomeSettings from './IncomeSettings';
import CategoryGrid from './CategoryGrid';
import LeftToBudgetBanner from './LeftToBudgetBanner';
import StocksWidget from '../widgets/StocksWidget';
import StockHoldingWidget from '../widgets/StockHoldingWidget';
import InvestStockModal from '../markets/InvestStockModal';
import TransactionModal from '../transactions/TransactionModal';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { ArrowUpRight, MoreHorizontal, Plus, Search, X } from 'lucide-react';

function formatShortDate(dateStr) {
  if (!dateStr) return 'Today';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

export default function HomeTab({ onNavigateToMarkets, onNavigateToTransactions }) {
  const { investments = [], transactions = [], categories = [] } = useBudget();
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [query, setQuery] = useState('');
  const [editingTx, setEditingTx] = useState(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const handleCloseInvestModal = useCallback(() => {
    setSelectedStockToInvest(null);
  }, []);

  const handleOpenAddExpense = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditExpense = (tx) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const categoryColorMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.color || '#e4e4e7'])),
    [categories]
  );

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .filter((tx) => {
        const matchesCat = !selectedCategoryId || tx.categoryId === selectedCategoryId;
        const catName = categoryMap[tx.categoryId] || 'Uncategorized';
        const matchesQuery =
          !q ||
          (tx.description || '').toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });
  }, [transactions, selectedCategoryId, query, categoryMap]);

  const displayedTransactions = filteredTransactions.slice(0, 10);

  return (
    <div className="space-y-8 sm:space-y-10">
      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={handleCloseInvestModal}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        transaction={editingTx}
      />

      {/* 1. Open Hairline Summary Band + Semicircular PaceArc */}
      <LeftToBudgetBanner onAddExpense={handleOpenAddExpense} />

      {/* 2. Asymmetric 12-Col Workspace: Open Categories (5) + Chamfered Ledger Surface (7, desktop only) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <CategoryGrid
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        <section className="hidden md:block arca-chamfer rounded-xl border border-white/[0.08] bg-[#111110] lg:col-span-7">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Transactions
              </h2>
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer"
                >
                  <span>· {categoryMap[selectedCategoryId] || 'Filtered'}</span>
                  <X className="h-3 w-3" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {transactions.length > 0 && (
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter..."
                  className="h-8 sm:h-7 w-36 sm:w-44 rounded-lg border border-white/[0.09] bg-[#0b0b0a] pl-8 pr-3 text-base sm:text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
                />
              </div>
            )}
          </div>

          {displayedTransactions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              {transactions.length === 0 ? (
                <div className="space-y-2.5">
                  <p className="text-xs text-zinc-500">No expenses logged</p>
                  <button
                    type="button"
                    onClick={() => onNavigateToTransactions && onNavigateToTransactions()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#c8a24e] hover:underline cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>Add first expense</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No matching expenses</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Compact Stacked List (Zero Horizontal Scroll) */}
              <div className="divide-y divide-white/[0.06] sm:hidden">
                {displayedTransactions.map((tx) => {
                  const catLabel = categoryMap[tx.categoryId] || 'Uncategorized';
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => handleEditExpense(tx)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {tx.description || 'Untitled'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: categoryColorMap[tx.categoryId] || '#71717a' }}
                          />
                          <span className="truncate">{catLabel}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right tabular-nums">
                        <p className="text-sm font-medium text-zinc-100">
                          {formatCurrency(Math.abs(Number(tx.amount) || 0))}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          {formatShortDate(tx.date)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Dense Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-medium text-zinc-500">
                      <th className="py-2 pl-4 pr-3 font-medium">Merchant</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="py-2 pl-3 pr-10 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-sm">
                    {displayedTransactions.map((tx) => {
                      const catLabel = categoryMap[tx.categoryId] || 'Uncategorized';
                      return (
                        <tr
                          key={tx.id}
                          className="group transition-colors hover:bg-white/[0.025]"
                        >
                          <td className="py-2.5 pl-4 pr-3 font-medium text-zinc-100">
                            <span className="block truncate max-w-[200px]">
                              {tx.description || 'Untitled'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-zinc-300">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: categoryColorMap[tx.categoryId] || '#71717a' }}
                              />
                              <span>{catLabel}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500 tabular-nums">
                            {formatShortDate(tx.date)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pl-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-medium text-zinc-100 tabular-nums">
                                {formatCurrency(Math.abs(Number(tx.amount) || 0))}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEditExpense(tx)}
                                aria-label={`Edit ${tx.description}`}
                                className="rounded p-1 text-zinc-500 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-zinc-200 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Subtle Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 text-xs text-zinc-500">
            <span className="tabular-nums">
              {displayedTransactions.length} / {filteredTransactions.length}
            </span>
            {onNavigateToTransactions && (
              <button
                type="button"
                onClick={onNavigateToTransactions}
                className="inline-flex items-center gap-1 font-medium text-zinc-300 hover:text-[#E7B956] transition-colors cursor-pointer"
              >
                <span>Full ledger</span>
                <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </section>
      </div>

      {/* 3. Open Secondary Band: Income & Cycle + Portfolio (Portfolio desktop only) */}
      <div className="grid grid-cols-1 items-start gap-8 border-t border-white/[0.08] pt-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <IncomeSettings />
        </div>

        <div className="hidden md:block space-y-4 lg:col-span-7">
          <StocksWidget onNavigateToMarkets={onNavigateToMarkets} />

          {investments.length > 0 && (
            <div className="space-y-3" data-testid="stock-holding-widgets">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Holdings ({investments.length})
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {investments.map((inv) => (
                  <StockHoldingWidget
                    key={inv.id || inv.symbol}
                    holding={inv}
                    onNavigateToMarkets={onNavigateToMarkets}
                    onInvestMore={(stock) => setSelectedStockToInvest(stock)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
