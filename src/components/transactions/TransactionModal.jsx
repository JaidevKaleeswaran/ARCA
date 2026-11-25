import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useBudget } from '../../contexts/BudgetContext';
import toast from 'react-hot-toast';

export default function TransactionModal({ isOpen, onClose, transaction = null }) {
  const { categories, dispatch } = useBudget();
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isSubscription: false,
  });

  const isEditing = Boolean(transaction && transaction.id);

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setFormData({
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          description: transaction.description,
          date: transaction.date,
          isSubscription: !!(transaction.isSubscription || transaction.recurring),
        });
      } else {
        setFormData({
          amount: '',
          categoryId: categories.length > 0 ? categories[0].id : '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          isSubscription: false,
        });
      }
    }
  }, [isOpen, transaction, categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
    } else if (!targetCategoryId) {
      toast.error('Please select a category');
      return;
    }

    const payload = {
      amount: Number(formData.amount),
      categoryId: targetCategoryId,
      description: formData.description,
      date: formData.date,
      isSubscription: formData.isSubscription,
      recurring: formData.isSubscription,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...payload, id: transaction.id } });
      toast.success('Expense updated');
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload: { ...payload, id: Date.now().toString() } });
      toast.success('Expense added');
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Delete this expense?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: transaction.id });
      toast.success('Expense deleted');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Expense' : 'Add Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 tabular-nums focus:border-[#E7B956] focus:outline-none [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Merchant / Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
            placeholder="e.g. Trader Joe’s"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 focus:border-[#E7B956] focus:outline-none"
            required={categories.length > 0}
          >
            {categories.length === 0 && <option value="">General (Auto-created)</option>}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-y border-white/[0.08] py-3">
          <span className="text-xs font-medium text-zinc-300">Recurring subscription</span>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              name="isSubscription"
              checked={formData.isSubscription}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-200 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#E7B956] peer-checked:after:bg-[#090908]" />
          </label>
        </div>

        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="submit"
            className="h-10 sm:h-9 flex-1 rounded-full bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] cursor-pointer"
          >
            {isEditing ? 'Save changes' : 'Add expense'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="h-10 sm:h-9 rounded-full border border-rose-500/25 bg-rose-500/10 px-4 text-xs font-medium text-rose-400 hover:bg-rose-500/20 cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
