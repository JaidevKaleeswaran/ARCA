import React, { useState, useEffect } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import { Edit2, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import IncomeSourceModal from './IncomeSourceModal';
import SalaryModal from './SalaryModal';

/**
 * Open, non-blocky Income & Cycle configuration directly on the black canvas.
 */
export default function IncomeSettings() {
  const { incomeSources, primarySalary, cycleStartDate, cycleFrequency, totalIncome, dispatch } =
    useBudget();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  const [cycleConfig, setCycleConfig] = useState({
    frequency: cycleFrequency || 'monthly',
    startDate: cycleStartDate
      ? cycleStartDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setCycleConfig({
      frequency: cycleFrequency,
      startDate: cycleStartDate
        ? cycleStartDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
  }, [cycleFrequency, cycleStartDate]);

  const handleCycleChange = (name, value) => {
    const next = { ...cycleConfig, [name]: value };
    setCycleConfig(next);
    dispatch({
      type: 'SET_CYCLE_CONFIG',
      payload: {
        cycleFrequency: next.frequency,
        cycleStartDate: next.startDate,
      },
    });
  };

  const handleAddClick = () => {
    setSelectedSource(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (source) => {
    setSelectedSource(source);
    setIsModalOpen(true);
  };

  const additionalSources = incomeSources.filter(
    (s) => !s.isSalary && s.id !== 'salary_source' && s.name?.toLowerCase() !== 'primary salary'
  );

  return (
    <section data-tutorial="income-card">
      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Income &amp; Cycle
        </h2>
        <button
          type="button"
          data-tutorial="income-source-add"
          onClick={handleAddClick}
          className="inline-flex items-center gap-1 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-[#c8a24e] cursor-pointer"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
          <span>Add source</span>
        </button>
      </div>

      <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
        <div
          data-tutorial="salary-set"
          className="group flex items-center justify-between gap-3 py-3"
        >
          {primarySalary ? (
            <>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-100">
                    {primarySalary.name}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    · Base
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                  {formatCurrency(primarySalary.amount)} / {primarySalary.frequency}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(true)}
                title="Edit Base Salary"
                className="p-1.5 text-zinc-500 transition-colors hover:text-zinc-200 cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-xs text-zinc-500">Base salary</span>
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(true)}
                className="py-1 text-xs font-semibold text-[#c8a24e] transition-colors hover:text-[#d8b464] cursor-pointer"
              >
                Set Base Salary
              </button>
            </div>
          )}
        </div>

        {additionalSources.map((source) => (
          <div
            key={source.id}
            className="group flex items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-zinc-200">{source.name}</span>
                {source.isBorrowed && (
                  <span className="rounded-full border border-rose-500/30 px-2 py-0.2 text-[10px] text-rose-400">
                    Debt
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 tabular-nums">
                {formatCurrency(source.amount)} / {source.frequency}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleEditClick(source)}
              aria-label={`Edit ${source.name}`}
              className="rounded p-1.5 text-zinc-500 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white/[0.06] hover:text-zinc-100 transition-all cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}

        <div className="flex items-baseline justify-between py-3">
          <span className="text-xs text-zinc-500">Total income</span>
          <span className="text-sm font-semibold text-[#E7B956] tabular-nums">
            {formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3.5">
          <div data-tutorial="cycle-frequency" className="space-y-1.5">
            <label className="block text-[11px] text-zinc-500">Schedule</label>
            <select
              name="frequency"
              value={cycleConfig.frequency}
              onChange={(e) => handleCycleChange('frequency', e.target.value)}
              className="h-9 sm:h-8 w-full rounded-lg border border-white/[0.1] bg-[#111110] px-2.5 text-base sm:text-xs text-zinc-200 focus:border-[#E7B956] focus:outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] text-zinc-500">Start</label>
            <input
              type="date"
              name="startDate"
              value={cycleConfig.startDate}
              onChange={(e) => handleCycleChange('startDate', e.target.value)}
              className="h-9 sm:h-8 w-full rounded-lg border border-white/[0.1] bg-[#111110] px-2.5 text-base sm:text-xs text-zinc-200 tabular-nums focus:border-[#E7B956] focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <IncomeSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source={selectedSource}
      />

      <SalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
      />
    </section>
  );
}
