import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useBudget } from '../../contexts/BudgetContext';
import { Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_SWATCHES = [
  { hex: '#e7b956', label: 'Gold' },
  { hex: '#e4e4e7', label: 'Chalk' },
  { hex: '#34d399', label: 'Emerald' },
  { hex: '#38bdf8', label: 'Sky' },
  { hex: '#fb923c', label: 'Amber' },
  { hex: '#fb7185', label: 'Rose' },
  { hex: '#c084fc', label: 'Violet' },
];

export default function CategoryModal({ isOpen, onClose, category = null }) {
  const { categories, dispatch } = useBudget();
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    color: '#e7b956',
    endOfCycleAction: 'none',
  });

  // Only treat as editing when category actually has a persisted id
  const isEditing = Boolean(category && category.id);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          limit: category.limit ?? '',
          color: category.color || '#e7b956',
          endOfCycleAction: category.endOfCycleAction || 'none',
        });
      } else {
        setFormData({ name: '', limit: '', color: '#e7b956', endOfCycleAction: 'none' });
      }
    }
  }, [isOpen, category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      toast.error('Category name is required');
      return;
    }

    const payload = {
      name: cleanName,
      limit: Number(formData.limit),
      color: formData.color || '#e7b956',
      endOfCycleAction: formData.endOfCycleAction,
    };

    const normName = cleanName.toLowerCase();

    if (isEditing) {
      const duplicateExists = categories.some(
        (c) => c.id !== category.id && c.name.trim().toLowerCase() === normName
      );
      if (duplicateExists) {
        toast.error(`A category named "${cleanName}" already exists.`);
        return;
      }
      dispatch({ type: 'UPDATE_CATEGORY', payload: { ...payload, id: category.id } });
      toast.success('Category updated');
    } else {
      const duplicateExists = categories.some(
        (c) => c.name.trim().toLowerCase() === normName
      );
      if (duplicateExists) {
        toast.error(`A category named "${cleanName}" already exists.`);
        return;
      }
      dispatch({ type: 'ADD_CATEGORY', payload: { ...payload, id: Date.now().toString() } });
      toast.success('Category added');
    }

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      dispatch({ type: 'DELETE_CATEGORY', payload: category.id });
      toast.success('Category deleted');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add Category'}
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
            placeholder="e.g. Groceries"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">Budget Limit</label>
          <input
            type="number"
            name="limit"
            value={formData.limit}
            onChange={handleChange}
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#E7B956] focus:outline-none"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-zinc-400">Color</label>
            <span className="font-mono text-[11px] uppercase text-zinc-500">
              {formData.color}
            </span>
          </div>

          {/* Curated Swatches + Native Color Picker */}
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_SWATCHES.map((swatch) => {
              const selected = formData.color?.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  title={swatch.label}
                  aria-label={`Select ${swatch.label} color`}
                  onClick={() => setFormData((prev) => ({ ...prev, color: swatch.hex }))}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-transform cursor-pointer ${
                    selected
                      ? 'scale-110 border-white ring-2 ring-white/25'
                      : 'border-white/15 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {selected && (
                    <Check className="h-3.5 w-3.5 text-[#090908]" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}

            <label
              title="Custom color"
              className="relative flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#090908] px-2.5 text-[11px] text-zinc-400 hover:border-white/25 hover:text-zinc-200"
            >
              <span
                className="h-3 w-3 rounded-full border border-white/20"
                style={{ backgroundColor: formData.color }}
              />
              <span>Custom</span>
              <input
                type="color"
                name="color"
                aria-label="Custom category color"
                value={formData.color}
                onChange={handleChange}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-400">End of cycle</label>
          <select
            name="endOfCycleAction"
            value={formData.endOfCycleAction}
            onChange={handleChange}
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#090908] px-3 text-base sm:text-sm text-zinc-100 focus:border-[#E7B956] focus:outline-none"
          >
            <option value="none">Reset</option>
            <option value="rollover">Rollover unspent</option>
            <option value="sweep">Sweep to savings</option>
          </select>
        </div>

        <div className="pt-3 flex items-center gap-2.5">
          <button
            type="submit"
            className="h-10 sm:h-9 flex-1 rounded-full bg-[#E7B956] text-xs font-semibold text-[#090908] transition-colors hover:bg-[#d8aa45] cursor-pointer"
          >
            {isEditing ? 'Save changes' : 'Add category'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/10 px-4 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
