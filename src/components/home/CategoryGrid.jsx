import { useState, useEffect } from 'react';
import { useBudget } from '../../contexts/BudgetContext';
import CategoryModal from './CategoryModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { getCyclePaceMetrics } from '../../utils/cycleUtils';
import { Plus, Edit2, Trash2, ChevronDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export const COLOR_SWATCHES = [
  { hex: '#b8934a', label: 'Ochre' },
  { hex: '#8e9299', label: 'Stone' },
  { hex: '#4d7c63', label: 'Sage' },
  { hex: '#4f6d8a', label: 'Slate' },
  { hex: '#a85d48', label: 'Terracotta' },
  { hex: '#7a5c75', label: 'Mauve' },
  { hex: '#8c7d6b', label: 'Taupe' },
];

const QUICK_FILL_TEMPLATES = {
  '50_30_20': {
    label: '50/30/20 Rule',
    description: '50% Needs · 30% Wants · 20% Savings',
    splits: [
      { name: 'Rent / Housing', percent: 0.3, color: '#4f6d8a', endOfCycleAction: 'none' },
      { name: 'Groceries', percent: 0.1, color: '#4d7c63', endOfCycleAction: 'none' },
      { name: 'Bills & Utilities', percent: 0.1, color: '#8c7d6b', endOfCycleAction: 'none' },
      { name: 'Dining Out', percent: 0.1, color: '#a85d48', endOfCycleAction: 'none' },
      { name: 'Entertainment', percent: 0.1, color: '#7a5c75', endOfCycleAction: 'none' },
      { name: 'Shopping', percent: 0.1, color: '#8e9299', endOfCycleAction: 'none' },
      { name: 'Savings', percent: 0.2, color: '#b8934a', endOfCycleAction: 'rollover' },
    ],
  },
  survivor: {
    label: 'Paycheck Survivor',
    description: 'Essentials-first',
    splits: [
      { name: 'Rent / Housing', percent: 0.35, color: '#4f6d8a', endOfCycleAction: 'none' },
      { name: 'Groceries', percent: 0.15, color: '#4d7c63', endOfCycleAction: 'none' },
      { name: 'Bills & Utilities', percent: 0.2, color: '#8c7d6b', endOfCycleAction: 'none' },
      { name: 'Transport / Gas', percent: 0.1, color: '#a85d48', endOfCycleAction: 'none' },
      { name: 'Emergency Fund', percent: 0.1, color: '#b8934a', endOfCycleAction: 'rollover' },
      { name: 'Personal', percent: 0.1, color: '#7a5c75', endOfCycleAction: 'none' },
    ],
  },
  student: {
    label: 'Student',
    description: 'Entry-level split',
    splits: [
      { name: 'Rent / Housing', percent: 0.4, color: '#4f6d8a', endOfCycleAction: 'none' },
      { name: 'Food & Groceries', percent: 0.2, color: '#4d7c63', endOfCycleAction: 'none' },
      { name: 'Transport', percent: 0.1, color: '#8c7d6b', endOfCycleAction: 'none' },
      { name: 'Subscriptions', percent: 0.05, color: '#7a5c75', endOfCycleAction: 'none' },
      { name: 'Entertainment', percent: 0.1, color: '#a85d48', endOfCycleAction: 'none' },
      { name: 'Savings', percent: 0.15, color: '#b8934a', endOfCycleAction: 'rollover' },
    ],
  },
  aggressive: {
    label: 'Aggressive Saver',
    description: '40% savings & investments',
    splits: [
      { name: 'Savings', percent: 0.3, color: '#b8934a', endOfCycleAction: 'rollover' },
      { name: 'Investments', percent: 0.1, color: '#4d7c63', endOfCycleAction: 'rollover' },
      { name: 'Rent / Housing', percent: 0.3, color: '#4f6d8a', endOfCycleAction: 'none' },
      { name: 'Food & Groceries', percent: 0.15, color: '#8c7d6b', endOfCycleAction: 'none' },
      { name: 'Fun & Social', percent: 0.1, color: '#a85d48', endOfCycleAction: 'none' },
      { name: 'Miscellaneous', percent: 0.05, color: '#8e9299', endOfCycleAction: 'none' },
    ],
  },
  family: {
    label: 'Family Budget',
    description: 'Household essentials',
    splits: [
      { name: 'Rent / Mortgage', percent: 0.3, color: '#4f6d8a', endOfCycleAction: 'none' },
      { name: 'Groceries', percent: 0.2, color: '#4d7c63', endOfCycleAction: 'none' },
      { name: 'Childcare / School', percent: 0.15, color: '#7a5c75', endOfCycleAction: 'none' },
      { name: 'Transport', percent: 0.1, color: '#8c7d6b', endOfCycleAction: 'none' },
      { name: 'Bills & Utilities', percent: 0.1, color: '#8e9299', endOfCycleAction: 'none' },
      { name: 'Entertainment', percent: 0.05, color: '#a85d48', endOfCycleAction: 'none' },
      { name: 'Emergency Fund', percent: 0.1, color: '#b8934a', endOfCycleAction: 'rollover' },
    ],
  },
};

function MobileCategoryWidget({
  category,
  spent,
  isExpanded,
  onToggleExpand,
  categories,
  dispatch,
}) {
  const [formData, setFormData] = useState({
    name: category.name || '',
    limit: category.limit ?? '',
    color: category.color || '#b8934a',
    endOfCycleAction: category.endOfCycleAction || 'none',
  });

  useEffect(() => {
    setFormData({
      name: category.name || '',
      limit: category.limit ?? '',
      color: category.color || '#b8934a',
      endOfCycleAction: category.endOfCycleAction || 'none',
    });
  }, [category.id, category.name, category.limit, category.color, category.endOfCycleAction]);

  const limit = Number(category.limit) || 0;
  const remaining = limit - spent;
  const pct = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
  const isOver = remaining < 0;
  const accentHex = category.color || '#8e9299';
  const barHex = isOver ? '#a85450' : accentHex;

  const handleSave = (e) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    if (!cleanName) {
      toast.error('Category name is required');
      return;
    }

    const normName = cleanName.toLowerCase();
    const duplicateExists = categories.some(
      (c) => c.id !== category.id && c.name.trim().toLowerCase() === normName
    );
    if (duplicateExists) {
      toast.error(`A category named "${cleanName}" already exists.`);
      return;
    }

    dispatch({
      type: 'UPDATE_CATEGORY',
      payload: {
        id: category.id,
        name: cleanName,
        limit: Number(formData.limit) || 0,
        color: formData.color || '#b8934a',
        endOfCycleAction: formData.endOfCycleAction,
      },
    });
    toast.success('Category updated');
    onToggleExpand();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${category.name}"?`)) {
      dispatch({ type: 'DELETE_CATEGORY', payload: category.id });
      toast.success('Category deleted');
    }
  };

  return (
    <div data-mobile-category-id={category.id}>
      {/* Top Category Summary Widget */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        className={`relative z-10 w-full rounded-xl border bg-[#121210] px-4 py-4 text-left transition-colors cursor-pointer ${
          isExpanded ? 'border-white/[0.16] shadow-[0_6px_16px_rgba(0,0,0,0.45)]' : 'border-white/[0.07]'
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: accentHex }}
            />
            <h3 className="truncate text-base font-semibold text-zinc-100">
              {category.name}
            </h3>
          </div>

          <span
            className={`inline-flex shrink-0 items-baseline gap-1 text-lg font-bold tracking-tight tabular-nums ${
              isOver ? 'text-rose-400' : 'text-zinc-100'
            }`}
          >
            <span>{formatCurrency(isOver ? Math.abs(remaining) : remaining)}</span>
            <span className="text-sm font-semibold text-zinc-400">{isOver ? 'over' : 'left'}</span>
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barHex }}
          />
        </div>

        <div className="mt-1.5 text-xs font-medium text-zinc-400 tabular-nums">
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </div>
      </button>

      {/* Distinct Indented Dropdown Tray */}
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
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#11110f] px-3 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
                  placeholder="Category name"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, limit: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#11110f] px-3 text-base text-zinc-100 tabular-nums placeholder:text-zinc-600 focus:border-[#c8a24e] focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-zinc-400">
                  Color
                </label>
                <span className="font-mono text-[11px] uppercase text-zinc-500">
                  {formData.color}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((swatch) => {
                  const selected =
                    formData.color?.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.label}
                      aria-label={`Select ${swatch.label} color`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: swatch.hex }))
                      }
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition-transform cursor-pointer ${
                        selected
                          ? 'scale-110 border-zinc-200 ring-1 ring-zinc-300/30'
                          : 'border-white/10'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {selected && (
                        <Check className="h-3 w-3 text-[#0b0b0a]" strokeWidth={2.5} />
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
                    aria-label="Custom category color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-zinc-400">
                End of cycle
              </label>
              <select
                value={formData.endOfCycleAction}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endOfCycleAction: e.target.value,
                  }))
                }
                className="h-9 w-full rounded-lg border border-white/[0.1] bg-[#11110f] px-3 text-base text-zinc-100 focus:border-[#c8a24e] focus:outline-none"
              >
                <option value="none">Reset</option>
                <option value="rollover">Rollover unspent</option>
                <option value="sweep">Sweep to savings</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1.5">
              <button
                type="submit"
                className="h-9 flex-1 rounded-lg bg-[#2c2c27] px-4 text-xs font-semibold text-[#c8a24e] transition-colors hover:bg-[#35352f] cursor-pointer"
              >
                Save changes
              </button>

              <button
                type="button"
                onClick={handleDelete}
                title={`Delete ${category.name}`}
                aria-label={`Delete ${category.name}`}
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

/**
 * Adaptive category velocity list:
 * - Mobile (< md): Summary widget + distinct contrasting dropdown tray
 * - Desktop (>= md): Open hairline category rows
 */
export default function CategoryGrid({ selectedCategoryId = null, onSelectCategory }) {
  const {
    categories,
    categorySpending,
    totalIncome,
    cycleStartDate,
    cycleFrequency,
    dispatch,
  } = useBudget();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);
  const [expandedMobileId, setExpandedMobileId] = useState(null);

  const pace = getCyclePaceMetrics(cycleStartDate, cycleFrequency);

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (e, category) => {
    e.stopPropagation();
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (e, category) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${category.name}"?`)) {
      dispatch({ type: 'DELETE_CATEGORY', payload: category.id });
      if (selectedCategoryId === category.id && onSelectCategory) {
        onSelectCategory(null);
      }
      toast.success('Category deleted');
    }
  };

  const handleQuickFill = (templateKey) => {
    if (totalIncome === 0) {
      toast.error('Set up your income first to use Quick-Fill.');
      setIsQuickFillOpen(false);
      return;
    }

    const template = QUICK_FILL_TEMPLATES[templateKey];
    if (!template) return;

    const updatedCategories = [...categories];

    template.splits.forEach((split) => {
      const splitNameNorm = split.name.trim().toLowerCase();
      const existingIndex = updatedCategories.findIndex((c) => {
        const catNorm = c.name.trim().toLowerCase();
        return (
          catNorm === splitNameNorm ||
          catNorm.includes(splitNameNorm) ||
          splitNameNorm.includes(catNorm)
        );
      });

      const newLimit = Math.round(totalIncome * split.percent);

      if (existingIndex >= 0) {
        updatedCategories[existingIndex] = {
          ...updatedCategories[existingIndex],
          limit: newLimit,
          color: split.color || updatedCategories[existingIndex].color,
          endOfCycleAction:
            split.endOfCycleAction || updatedCategories[existingIndex].endOfCycleAction,
        };
      } else {
        updatedCategories.push({
          id: `qf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: split.name,
          limit: newLimit,
          color: split.color,
          endOfCycleAction: split.endOfCycleAction,
        });
      }
    });

    dispatch({ type: 'REPLACE_CATEGORIES', payload: updatedCategories });
    toast.success(`"${template.label}" applied.`);
    setIsQuickFillOpen(false);
  };

  return (
    <section data-tutorial="category-section">
      {/* Header — clean text actions without pill buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs md:text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Categories
          </h2>
          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-zinc-500 tabular-nums">
            <span className="inline-block h-2.5 w-px bg-[#c8a24e]/70" />
            {pace.pacePct}%
          </span>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button
              type="button"
              data-tutorial="quick-fill"
              onClick={() => setIsQuickFillOpen(!isQuickFillOpen)}
              className="inline-flex items-center gap-1 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200 cursor-pointer"
            >
              <span>Quick-Fill</span>
              <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
            </button>

            {isQuickFillOpen && (
              <div className="absolute right-0 mt-1.5 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-white/[0.1] bg-[#161614] z-30 py-1 overflow-hidden shadow-xl">
                {Object.entries(QUICK_FILL_TEMPLATES).map(([key, tpl]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleQuickFill(key)}
                    className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-white/[0.04] transition-colors border-b border-white/[0.05] last:border-b-0 cursor-pointer"
                  >
                    <div className="font-medium text-zinc-200">{tpl.label}</div>
                    <div className="text-[11px] text-zinc-500">{tpl.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            data-tutorial="category-add"
            onClick={handleAddClick}
            className="inline-flex items-center gap-1 py-1 text-xs font-semibold text-[#c8a24e] transition-colors hover:text-[#d8b464] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {isQuickFillOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setIsQuickFillOpen(false)} />
      )}

      {categories.length === 0 ? (
        <div className="border-t border-white/[0.08] py-10 text-center space-y-2.5">
          <p className="text-xs text-zinc-500">No limits yet</p>
          <button
            type="button"
            onClick={handleAddClick}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#c8a24e] hover:underline cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Create category</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Expandable Category Widgets */}
          <div className="space-y-2.5 md:hidden">
            {categories.map((category) => (
              <MobileCategoryWidget
                key={category.id}
                category={category}
                spent={categorySpending[category.id] || 0}
                isExpanded={expandedMobileId === category.id}
                onToggleExpand={() =>
                  setExpandedMobileId((prev) =>
                    prev === category.id ? null : category.id
                  )
                }
                categories={categories}
                dispatch={dispatch}
              />
            ))}
          </div>

          {/* Desktop Open Hairline Category Rows */}
          <div className="hidden md:block divide-y divide-white/[0.06] border-t border-white/[0.08]">
            {categories.map((category) => {
              const spent = categorySpending[category.id] || 0;
              const limit = Number(category.limit) || 0;
              const remaining = limit - spent;
              const pct = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
              const isOver = remaining < 0;
              const isSelected = selectedCategoryId === category.id;
              const accentHex = category.color || '#8e9299';
              const barHex = isOver ? '#a85450' : accentHex;

              return (
                <div
                  key={category.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onSelectCategory && onSelectCategory(isSelected ? null : category.id)
                  }
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onSelectCategory) {
                      e.preventDefault();
                      onSelectCategory(isSelected ? null : category.id);
                    }
                  }}
                  className={`group w-full py-3.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.04] -mx-2.5 px-2.5 rounded-lg'
                      : 'hover:opacity-95'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: accentHex }}
                      />
                      <h3 className="truncate text-sm font-medium text-zinc-100">
                        {category.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium tabular-nums ${
                          isOver ? 'text-rose-400' : 'text-zinc-200'
                        }`}
                      >
                        {isOver
                          ? `${formatCurrency(Math.abs(remaining))} over`
                          : `${formatCurrency(remaining)} left`}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, category)}
                          title={`Edit ${category.name}`}
                          aria-label={`Edit ${category.name}`}
                          className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(e, category)}
                          title={`Delete ${category.name}`}
                          aria-label={`Delete ${category.name}`}
                          className="p-1 text-rose-400/80 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-2 h-1.5 w-full rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barHex }}
                    />
                    <div
                      className="absolute -top-0.5 h-2.5 w-px bg-[#c8a24e]/60"
                      style={{ left: `${pace.pacePct}%` }}
                      title={`Cycle pace: ${pace.pacePct}%`}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                    <span>
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={editingCategory}
      />
    </section>
  );
}
