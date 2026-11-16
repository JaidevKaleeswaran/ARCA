import { useState, useCallback } from 'react';
import FinancialHealthCards from './FinancialHealthCards';
import MainBalanceChart from './MainBalanceChart';
import CategoryCharts from './CategoryCharts';
import NotificationHub from './NotificationHub';
import StocksWidget from '../widgets/StocksWidget';
import StockHoldingWidget from '../widgets/StockHoldingWidget';
import InvestStockModal from '../markets/InvestStockModal';
import MaskedHeading from '../ui/MaskedHeading';
import Reveal from '../ui/Reveal';
import { useBudget } from '../../contexts/BudgetContext';

export default function SummaryTab({ onNavigateToMarkets }) {
  const { investments = [] } = useBudget();
  const [selectedStockToInvest, setSelectedStockToInvest] = useState(null);

  const handleCloseInvestModal = useCallback(() => {
    setSelectedStockToInvest(null);
  }, []);
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="mb-2">
        <MaskedHeading
          text="Your Financial Picture"
          tag="h1"
          reveal="rise"
          trigger="view"
          fillColor="var(--color-text)"
          align="left"
          className="text-3xl sm:text-4xl font-extrabold tracking-tight"
        />
        <Reveal delay={0.15}>
          <p className="text-sm text-text-muted mt-2">
            Real-time overview of your income, spending, investments, and net worth.
          </p>
        </Reveal>
      </div>

      {/* Top Financial Health Scorecard (Income, Cash Flow, Stock Portfolio, Net Worth, Subscriptions) */}
      <Reveal delay={0.05}>
        <div data-tutorial="summary-health-cards">
          <FinancialHealthCards />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Main Balance Pie Chart */}
        <Reveal delay={0.15} as="div">
          <div data-tutorial="summary-balance-chart">
            <MainBalanceChart />
          </div>
        </Reveal>

        {/* Right column: Multiple smaller pie charts */}
        <Reveal delay={0.2} as="div">
          <div data-tutorial="summary-category-charts">
            <CategoryCharts />
          </div>
        </Reveal>
      </div>

      {/* ── Invest in Stock Modal directly accessible from Stock Widgets ── */}
      <InvestStockModal
        stock={selectedStockToInvest}
        isOpen={Boolean(selectedStockToInvest)}
        onClose={handleCloseInvestModal}
      />

      {/* Bottom section: Stocks Widget & Notification Hub */}
      <Reveal delay={0.28}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <StocksWidget onNavigateToMarkets={onNavigateToMarkets} />

            {/* Dedicated Individual Stock Widgets created for each holding */}
            {investments.length > 0 && (
              <div className="space-y-4 pt-1">
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
          <div className="lg:col-span-2" data-tutorial="summary-notifications">
            <NotificationHub />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
