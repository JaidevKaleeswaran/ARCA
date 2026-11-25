import React, { useState, useMemo, useEffect } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import TransactionModal from './TransactionModal';
import ReceiptScannerModal from './ReceiptScannerModal';
import VoiceInputPanel from '../assistant/VoiceInputPanel';
import { processTransaction } from '../../services/agents/managerAgent';
import { reviewSuspiciousTransaction } from '../../services/agents/assistantAgent';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Mic,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Repeat,
  Download,
  Search,
  X,
} from 'lucide-react';

function MobileLedgerItem({
  tx,
  isExpanded,
  onToggleExpand,
  categories,
  getCategoryName,
  getCategoryColor,
  formatDate,
  isSuspicious,
  reviewingTxId,
  onAIReview,
  dispatch,
}) {
  const [formData, setFormData] = useState({
    amount: tx.amount ?? '',
    categoryId: tx.categoryId || (categories[0]?.id ?? ''),
    description: tx.description || '',
    date: tx.date || new Date().toISOString().split('T')[0],
    isSubscription: Boolean(tx.isSubscription || tx.recurring),
  });

  useEffect(() => {
    setFormData({
      amount: tx.amount ?? '',
      categoryId: tx.categoryId || (categories[0]?.id ?? ''),
      description: tx.description || '',
      date: tx.date || new Date().toISOString().split('T')[0],
      isSubscription: Boolean(tx.isSubscription || tx.recurring),
    });
  }, [tx.id, tx.amount, tx.categoryId, tx.description, tx.date, tx.isSubscription, tx.recurring, categories]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Merchant / description is required');
      return;
    }

    let targetCategoryId = formData.categoryId;
    if (!targetCategoryId && categories.length === 0) {
      targetCategoryId = `cat_general_${Date.now()}`;
      dispatch({
        type: 'ADD_CATEGORY',
        payload: {
          id: targetCategoryId,
          name: 'General',
          limit: Math.max(200, Math.round(Number(formData.amount) || 100)),
          color: '#e7b956',
          endOfCycleAction: 'none',
        },
      });
    }

    dispatch({
      type: 'UPDATE_TRANSACTION',
      payload: {
        id: tx.id,
        amount: Number(formData.amount) || 0,
        categoryId: targetCategoryId,
        description: formData.description.trim(),
        date: formData.date,
        isSubscription: formData.isSubscription,
        recurring: formData.isSubscription,
        source: tx.source,
      },
    });
    toast.success('Expense updated');
    onToggleExpand();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${tx.description}"?`)) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: tx.id });
      toast.success('Expense deleted');
    }
  };

  const activeColor = getCategoryColor(formData.categoryId || tx.categoryId);

  return (
    <div data-mobile-tx-id={tx.id}>
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        className={`relative z-10 flex w-full items-center justify-between gap-3 rounded-xl border bg-[#121210] px-4 py-3.5 text-left transition-colors cursor-pointer ${
          isExpanded
            ? 'border-white/[0.16] shadow-[0_6px_16px_rgba(0,0,0,0.45)]'
            : isSuspicious
            ? 'border-amber-500/30'
            : 'border-white/[0.07]'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-base font-semibold text-zinc-100">
              {tx.description}
            </span>
            {isSuspicious && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" strokeWidth={1.75} />
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: getCategoryColor(tx.categoryId) }}
            />
            <span className="truncate">{getCategoryName(tx.categoryId)}</span>
            <span className="text-zinc-600">·</span>
            <span className="tabular-nums shrink-0">{formatDate(tx.date)}</span>
          </div>
        </div>

        <span className="shrink-0 text-lg font-bold tracking-tight text-zinc-100 tabular-nums">
          {formatCurrency(Math.abs(Number(tx.amount) || 0))}
        </span>
      </button>

      {/* Distinct Indented Dropdown Editor */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="mx-2 -mt-1.5 space-y-3.5 rounded-b-xl border-x border-b border-white/[0.12] bg-[#252520] px-4 pt-5 pb-4 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
          >
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-400">
                Merchant / Name
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#11110f] px-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
                placeholder="Merchant name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#11110f] px-3 text-base text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#11110f] px-3 text-base text-zinc-100 tabular-nums focus:border-[#c8a24e] focus:outline-none [color-scheme:dark]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeColor }}
                />
                <span>Category</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                className="h-9 w-full rounded-lg border border-white/[0.09] bg-[#11110f] px-3 text-base text-zinc-100 focus:border-[#c8a24e] focus:outline-none"
                required={categories.length > 0}
              >
                {categories.length === 0 && (
                  <option value="">General (Auto-created)</option>
                )}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between border-y border-white/[0.08] py-2.5">
              <span className="text-xs font-medium text-zinc-300">
                Recurring subscription
              </span>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.isSubscription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isSubscription: e.target.checked,
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c8a24e] peer-checked:after:bg-[#0b0b0a]" />
              </label>
            </div>

            {isSuspicious && (
              <div>
                <button
                  type="button"
                  onClick={() => onAIReview(tx)}
                  disabled={reviewingTxId === tx.id}
                  className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-amber-400 hover:underline disabled:opacity-40 cursor-pointer"
                >
                  {reviewingTxId === tx.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                  <span>AI Review</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1.5">
              <button
                type="submit"
                className="h-9 flex-1 rounded-lg bg-[#272724] px-4 text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] cursor-pointer"
              >
                Save changes
              </button>

              <button
                type="button"
                onClick={handleDelete}
                title={`Delete ${tx.description}`}
                aria-label={`Delete ${tx.description}`}
                className="p-1.5 text-rose-400 transition-colors hover:text-rose-300 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsTab({ addExpenseTrigger = 0 }) {
  const budgetState = useBudget();
  const { transactions, categories, dispatch } = budgetState;
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [reviewingTxId, setReviewingTxId] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [expandedMobileTxId, setExpandedMobileTxId] = useState(null);

  useEffect(() => {
    if (addExpenseTrigger > 0) {
      setSelectedTx(null);
      setIsModalOpen(true);
    }
  }, [addExpenseTrigger]);

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const categoryColorMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.color || '#e4e4e7'])),
    [categories]
  );

  const getCategoryName = (id) => categoryMap[id] || 'Uncategorized';
  const getCategoryColor = (id) => categoryColorMap[id] || '#71717a';

  const handleAddClick = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (tx) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleVoiceTransaction = async (parsedData) => {
    setShowVoicePanel(false);
    try {
      const result = await processTransaction(parsedData, budgetState, dispatch);
      toast.success(result.message || 'Voice expense added.');
    } catch (err) {
      console.error('Voice transaction processing error:', err);
      toast.error('Failed to add voice expense');
    }
  };

  const handleAIReview = async (tx) => {
    setReviewingTxId(tx.id);
    try {
      const snapshot = { transactions, categories };
      const result = await reviewSuspiciousTransaction(tx, snapshot);
      toast(result.verdict, {
        duration: 6000,
        style: {
          background: '#111110',
          borderColor: result.isSuspicious ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.35)',
          border: '1px solid',
          color: '#f4f4f0',
          maxWidth: '380px',
        },
      });
    } catch {
      toast.error('AI review failed');
    } finally {
      setReviewingTxId(null);
    }
  };

  const handleExportCSV = () => {
    const rawTxs = budgetState.transactions || [];
    const txs = [...rawTxs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Source'];
    const rows = txs.map((tx) => {
      const cat = budgetState.categories?.find((c) => c.id === tx.categoryId);
      return [
        tx.date || '',
        tx.description || '',
        tx.amount,
        cat?.name || 'Unassigned',
        tx.source || 'manual',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ARCA_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(rawTxs.length > 0 ? 'CSV exported.' : 'Exported template.');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : String(dateStr);
    } catch {
      return String(dateStr);
    }
  };

  const suspiciousIds = useMemo(() => {
    const ids = new Set();
    const txMap = {};
    transactions.forEach((tx) => {
      const key = `${tx.description?.toLowerCase()}_${tx.amount}`;
      if (!txMap[key]) txMap[key] = [];
      txMap[key].push(tx);
    });
    Object.values(txMap).forEach((group) => {
      if (group.length > 1) {
        group.sort((a, b) => new Date(a.date) - new Date(b.date));
        for (let i = 1; i < group.length; i++) {
          const diff = Math.abs(new Date(group[i].date) - new Date(group[i - 1].date));
          if (diff < 24 * 60 * 60 * 1000) ids.add(group[i].id);
        }
      }
    });
    categories.forEach((cat) => {
      const catTxs = transactions.filter((tx) => tx.categoryId === cat.id);
      if (catTxs.length < 2) return;
      const avg = catTxs.reduce((s, t) => s + Number(t.amount), 0) / catTxs.length;
      catTxs.forEach((tx) => {
        if (Number(tx.amount) > avg * 3) ids.add(tx.id);
      });
    });
    return ids;
  }, [transactions, categories]);

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .filter((tx) => {
        const matchesCat = !selectedCatId || tx.categoryId === selectedCatId;
        const catName = categoryMap[tx.categoryId] || 'Uncategorized';
        const matchesQuery =
          !q ||
          (tx.description || '').toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });
  }, [transactions, query, selectedCatId, categoryMap]);

  const totalDisplayed = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0),
    [filteredTransactions]
  );

  return (
    <div className="space-y-6">
      {/* Header + Plain Text Capture Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100">Ledger</h1>
          <span className="text-xs text-zinc-500 tabular-nums">
            {filteredTransactions.length} · {formatCurrency(totalDisplayed)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            data-tutorial="expense-speak-btn"
            onClick={() => setShowVoicePanel(!showVoicePanel)}
            className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
          >
            <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Speak</span>
          </button>

          <button
            type="button"
            data-tutorial="expense-scan-btn"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
          >
            <Receipt className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Scan</span>
          </button>

          <button
            type="button"
            data-tutorial="expense-export-btn"
            onClick={handleExportCSV}
            title="Export CSV"
            className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>CSV</span>
          </button>

          <button
            type="button"
            data-tutorial="expense-add-btn"
            onClick={handleAddClick}
            className="inline-flex items-center gap-1 py-1 text-xs font-semibold text-[#c8a24e] transition-colors hover:text-[#d8b464] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Add expense</span>
          </button>
        </div>
      </div>

      {showVoicePanel && (
        <VoiceInputPanel
          onTransactionReady={handleVoiceTransaction}
          onClose={() => setShowVoicePanel(false)}
        />
      )}

      {/* Open Hairline Ledger Area */}
      <section data-tutorial="expense-table" className="border-t border-white/[0.08] pt-4">
        {/* Filter Bar */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pb-4">
            <div className="relative flex-1 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter merchant..."
                className="h-9 sm:h-8 w-full sm:w-52 rounded-lg border border-white/[0.09] bg-[#121210] pl-8 pr-3 text-base sm:text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                aria-label="Filter by category"
                className="h-9 sm:h-8 rounded-lg border border-white/[0.09] bg-[#121210] px-3 text-base sm:text-xs text-zinc-300 focus:border-[#c8a24e] focus:outline-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {(query || selectedCatId) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCatId('');
                }}
                className="inline-flex items-center gap-1 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <span>Clear</span>
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-2.5">
            <p className="text-xs text-zinc-500">
              {transactions.length === 0 ? 'No expenses yet' : 'No matching expenses'}
            </p>
            {transactions.length === 0 && (
              <button
                type="button"
                onClick={handleAddClick}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#c8a24e] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                <span>Add expense</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Expandable Dropdown Ledger Items */}
            <div className="space-y-2.5 md:hidden">
              {filteredTransactions.map((tx) => (
                <MobileLedgerItem
                  key={tx.id}
                  tx={tx}
                  isExpanded={expandedMobileTxId === tx.id}
                  onToggleExpand={() =>
                    setExpandedMobileTxId((prev) => (prev === tx.id ? null : tx.id))
                  }
                  categories={categories}
                  getCategoryName={getCategoryName}
                  getCategoryColor={getCategoryColor}
                  formatDate={formatDate}
                  isSuspicious={suspiciousIds.has(tx.id)}
                  reviewingTxId={reviewingTxId}
                  onAIReview={handleAIReview}
                  dispatch={dispatch}
                />
              ))}
            </div>

            {/* Desktop Dense Hairline Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[11px] font-medium text-zinc-500">
                    <th className="py-2 pr-3 font-medium">Merchant</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="py-2 pl-3 pr-14 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-sm">
                  {filteredTransactions.map((tx) => {
                    const isSuspicious = suspiciousIds.has(tx.id);
                    return (
                      <tr
                        key={tx.id}
                        className={`group transition-colors hover:bg-white/[0.025] ${
                          isSuspicious ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        <td className="py-2.5 pr-3 font-medium text-zinc-100">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span>{tx.description}</span>
                            {tx.source === 'receipt_scan' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] px-2 py-0.2 text-[10px] font-normal text-zinc-400">
                                <Receipt className="h-2.5 w-2.5" strokeWidth={1.5} />
                                Receipt
                              </span>
                            )}
                            {tx.source === 'voice' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[#E7B956]/30 px-2 py-0.2 text-[10px] font-normal text-[#E7B956]">
                                <Mic className="h-2.5 w-2.5" strokeWidth={1.5} />
                                Voice
                              </span>
                            )}
                            {(tx.recurring || tx.isSubscription) && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] px-2 py-0.2 text-[10px] font-normal text-zinc-400">
                                <Repeat className="h-2.5 w-2.5" strokeWidth={1.5} />
                                Recurring
                              </span>
                            )}
                            {isSuspicious && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 px-2 py-0.2 text-[10px] font-medium text-amber-400">
                                <AlertTriangle className="h-2.5 w-2.5" strokeWidth={1.5} />
                                Review
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-zinc-400">
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: getCategoryColor(tx.categoryId) }}
                            />
                            <span>{getCategoryName(tx.categoryId)}</span>
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500 tabular-nums">
                          {formatDate(tx.date)}
                        </td>

                        <td className="whitespace-nowrap py-2.5 pl-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium text-zinc-100 tabular-nums">
                              {formatCurrency(Math.abs(Number(tx.amount) || 0))}
                            </span>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              {isSuspicious && (
                                <button
                                  type="button"
                                  onClick={() => handleAIReview(tx)}
                                  disabled={reviewingTxId === tx.id}
                                  title="AI anomaly check"
                                  className="rounded p-1 text-amber-400 hover:bg-amber-400/10 disabled:opacity-40 cursor-pointer"
                                >
                                  {reviewingTxId === tx.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleEditClick(tx)}
                                title="Edit expense"
                                aria-label={`Edit ${tx.description}`}
                                className="rounded p-1 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200 cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                              </button>
                            </div>
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
      </section>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTx}
      />

      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
