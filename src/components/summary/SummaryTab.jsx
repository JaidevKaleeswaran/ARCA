import { useState, useCallback } from 'react';
import FinancialHealthCards from './FinancialHealthCards';
import MainBalanceChart from './MainBalanceChart';
import CategoryCharts from './CategoryCharts';
import NotificationHub from './NotificationHub';
import StocksWidget from '../widgets/StocksWidget';
import StockHoldingWidget from '../widgets/StockHoldingWidget';
import InvestStockModal from '../markets/InvestStockModal';
import { useBudget } from '../../contexts/BudgetContext';

export default function SummaryTab({ onNavigateToMarkets }) {
  const { investments = [] } = useBudget();
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);

  const handleCloseInvestModal = useCallback(() => {
    setSelectedStockToInvest(null);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100">Summary</h1>

      <div data-tutorial="summary-health-cards">
        <FinancialHealthCards />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div data-tutorial="summary-balance-chart" className="lg:col-span-5">
          <MainBalanceChart />
        </div>
        <div data-tutorial="summary-category-charts" className="lg:col-span-7">
          <CategoryCharts />
        </div>
      </div>

      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={handleCloseInvestModal}
      />

      <div className="grid grid-cols-1 items-start gap-8 border-t border-white/[0.08] pt-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <StocksWidget onNavigateToMarkets={onNavigateToMarkets} />
          {investments.length > 0 && (
            <div className="space-y-3">
              {investments.map((inv) => (
                <StockHoldingWidget
                  key={inv.id || inv.symbol}
                  holding={inv}
                  onNavigateToMarkets={onNavigateToMarkets}
                  onInvestMore={(stock) => setSelectedStockToInvest(stock)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7" data-tutorial="summary-notifications">
          <NotificationHub />
        </div>
      </div>
    </div>
  );
}
