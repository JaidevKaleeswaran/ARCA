import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useBudget } from '../../contexts/BudgetContext';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function SalaryModal({ isOpen, onClose }) {
  const { primarySalary, cycleFrequency, dispatch } = useBudget();

  const [formData, setFormData] = useState({
    name: 'Primary Salary',
    amount: '',
    frequency: 'monthly',
  });

  useEffect(() => {
    if (isOpen) {
      if (primarySalary) {
        setFormData({
          name: primarySalary.name || 'Primary Salary',
          amount: primarySalary.amount || '',
          frequency: primarySalary.frequency || 'monthly',
        });
      } else {
        setFormData({
          name: 'Primary Salary',
          amount: '',
          frequency: cycleFrequency || 'monthly',
        });
      }
    }
  }, [isOpen, primarySalary, cycleFrequency]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    const payload = {
      id: primarySalary ? primarySalary.id : 'salary_source',
      name: formData.name || 'Primary Salary',
      amount: Number(formData.amount),
      frequency: formData.frequency,
      isSalary: true,
    };

    dispatch({ type: 'SET_SALARY', payload });
    toast.success(`Salary set to ${formatCurrency(payload.amount)} / ${payload.frequency}`);
    onClose();
  };

  const getCycleEstimate = () => {
    const amt = Number(formData.amount) || 0;
    if (!amt) return 0;
    if (formData.frequency === cycleFrequency) return amt;

    let annual = 0;
    if (formData.frequency === 'annual') annual = amt;
    else if (formData.frequency === 'monthly') annual = amt * 12;
    else if (formData.frequency === 'bi-weekly') annual = amt * 26;
    else if (formData.frequency === 'weekly') annual = amt * 52;

    if (cycleFrequency === 'monthly') return annual / 12;
    if (cycleFrequency === 'bi-weekly') return annual / 26;
    if (cycleFrequency === 'weekly') return annual / 52;
    return amt;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Base Salary">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Source name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Primary Salary"
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
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
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm font-medium text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
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
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="weekly">Weekly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>

        {Number(formData.amount) > 0 && (
          <div className="flex items-center justify-between border-y border-white/[0.08] py-2.5 text-xs">
            <span className="text-zinc-500 capitalize">Per {cycleFrequency} cycle</span>
            <span className="font-semibold text-[#E7B956] tabular-nums">
              {formatCurrency(getCycleEstimate())}
            </span>
          </div>
        )}

        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 sm:h-9 rounded-full border border-white/[0.1] px-4 text-xs font-medium text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 sm:h-9 flex-1 rounded-full bg-[#E7B956] text-xs font-semibold text-[#090908] hover:bg-[#d8aa45] cursor-pointer"
          >
            Save salary
          </button>
        </div>
      </form>
    </Modal>
  );
}
