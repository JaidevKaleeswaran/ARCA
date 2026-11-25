import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useBudget } from '../../contexts/BudgetContext';
import { Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const COLOR_SWATCHES = [
  { hex: '#b8934a', label: 'Ochre' },
  { hex: '#8e9299', label: 'Stone' },
  { hex: '#4d7c63', label: 'Sage' },
  { hex: '#4f6d8a', label: 'Slate' },
  { hex: '#a85d48', label: 'Terracotta' },
  { hex: '#7a5c75', label: 'Mauve' },
  { hex: '#8c7d6b', label: 'Taupe' },
];

export default function CategoryModal({ isOpen, onClose, category = null }) {
  const { categories, dispatch } = useBudget();
  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    color: '#b8934a',
    endOfCycleAction: 'none',
  });

  const isEditing = Boolean(category && category.id);

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          limit: category.limit ?? '',
          color: category.color || '#b8934a',
          endOfCycleAction: category.endOfCycleAction || 'none',
        });
      } else {
        setFormData({ name: '', limit: '', color: '#b8934a', endOfCycleAction: 'none' });
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
      color: formData.color || '#b8934a',
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
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#0b0b0a] px-3 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
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
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#0b0b0a] px-3 text-base sm:text-sm text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
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
                      ? 'scale-110 border-zinc-200 ring-1 ring-zinc-300/30'
                      : 'border-white/10 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {selected && (
                    <Check className="h-3.5 w-3.5 text-[#0b0b0a]" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}

            <label
              title="Custom color"
              className="relative inline-flex cursor-pointer items-center gap-1.5 pl-1 text-xs text-zinc-400 hover:text-zinc-200"
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
            className="h-10 sm:h-9 w-full rounded-lg border border-white/[0.1] bg-[#0b0b0a] px-3 text-base sm:text-sm text-zinc-100 focus:border-[#c8a24e] focus:outline-none"
          >
            <option value="none">Reset</option>
            <option value="rollover">Rollover unspent</option>
            <option value="sweep">Sweep to savings</option>
          </select>
        </div>

        <div className="pt-3 flex items-center justify-between gap-3">
          <button
            type="submit"
            className="h-9 flex-1 rounded-lg bg-[#272724] px-4 text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#30302c] cursor-pointer"
          >
            {isEditing ? 'Save changes' : 'Add category'}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete category"
              aria-label="Delete category"
              className="p-1.5 text-rose-400 transition-colors hover:text-rose-300 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
