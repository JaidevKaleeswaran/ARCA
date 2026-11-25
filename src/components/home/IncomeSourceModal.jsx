import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useBudget } from '../../contexts/BudgetContext';
import toast from 'react-hot-toast';

export default function IncomeSourceModal({ isOpen, onClose, source = null }) {
  const { dispatch } = useBudget();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    isBorrowed: false,
  });

  const isEditing = Boolean(source && source.id);

  useEffect(() => {
    if (isOpen) {
      if (source) {
        setFormData({
          name: source.name,
          amount: source.amount,
          frequency: source.frequency,
          isBorrowed: source.isBorrowed || false,
        });
      } else {
        setFormData({ name: '', amount: '', frequency: 'monthly', isBorrowed: false });
      }
    }
  }, [isOpen, source]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      amount: Number(formData.amount),
      frequency: formData.frequency,
      isBorrowed: formData.isBorrowed,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_INCOME_SOURCE', payload: { ...payload, id: source.id } });
      toast.success('Income source updated');
    } else {
      dispatch({ type: 'ADD_INCOME_SOURCE', payload: { ...payload, id: Date.now().toString() } });
      toast.success('Income source added');
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Delete this income source?')) {
      dispatch({ type: 'DELETE_INCOME_SOURCE', payload: source.id });
      toast.success('Income source deleted');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Income Source' : 'Add Income Source'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
            placeholder="e.g. Freelance"
            required
          />
        </div>

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
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-400">Frequency</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 focus:border-[#E7B956] focus:outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>

        <label
          htmlFor="isBorrowedModal"
          className="flex items-center gap-2.5 pt-1 text-xs text-zinc-400 select-none cursor-pointer"
        >
          <input
            type="checkbox"
            id="isBorrowedModal"
            name="isBorrowed"
            checked={formData.isBorrowed}
            onChange={handleChange}
            className="h-4 w-4 rounded border-white/20 bg-[#090908] accent-[#E7B956]"
          />
          <span>Borrowed funds (debt)</span>
        </label>

        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="submit"
            className="h-10 sm:h-9 flex-1 rounded-full bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] cursor-pointer"
          >
            {isEditing ? 'Save changes' : 'Add source'}
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
