import { useState, useCallback } from 'react';
import IncomeSettings from './IncomeSettings';
import CategoryGrid from './CategoryGrid';
import LeftToBudgetBanner from './LeftToBudgetBanner';
import StocksWidget from '../widgets/StocksWidget';
import StockHoldingWidget from '../widgets/StockHoldingWidget';
import InvestStockModal from '../markets/InvestStockModal';
import Reveal from '../ui/Reveal';
import { useBudget } from '../../contexts/BudgetContext';
import { TrendingUp } from 'lucide-react';

export default function HomeTab({ onNavigateToMarkets }) {
  const { investments = [] } = useBudget();
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);

  const handleCloseInvestModal = useCallback(() => {
    setSelectedStockToInvest(null);
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Invest in Stock Modal directly accessible from Stock Widgets ── */}
      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={handleCloseInvestModal}
      />

      {/* Banner fades in first */}
      <Reveal delay={0} y={20}>
        <LeftToBudgetBanner />
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-0">
        {/* Left column: Income settings and Stocks Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Reveal delay={0.1} y={28}>
            <IncomeSettings />
          </Reveal>

          <Reveal delay={0.15} y={28}>
            <StocksWidget onNavigateToMarkets={onNavigateToMarkets} />
          </Reveal>

          {/* Individual Stock Holding Widgets created dynamically when user invests */}
          {investments.length > 0 && (
            <div className="space-y-4 pt-1" data-testid="stock-holding-widgets">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-accent" />
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Stock Widgets ({investments.length})
                  </h3>
                </div>
                <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full border border-accent/20">
                  Live Tracked
                </span>
              </div>

              {investments.map((inv, idx) => (
                <Reveal key={inv.id || inv.symbol} delay={0.15 + (idx + 1) * 0.05} y={24}>
                  <StockHoldingWidget
                    holding={inv}
                    onNavigateToMarkets={onNavigateToMarkets}
                    onInvestMore={(stock) => setSelectedStockToInvest(stock)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Category grid stagger last */}
        <Reveal delay={0.2} y={28} as="div" className="lg:col-span-2">
          <CategoryGrid />
        </Reveal>
      </div>
    </div>
  );
}
