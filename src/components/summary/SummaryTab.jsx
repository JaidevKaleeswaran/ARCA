import React from 'react';
import FinancialHealthCards from './FinancialHealthCards';
import MainBalanceChart from './MainBalanceChart';
import CategoryCharts from './CategoryCharts';
import NotificationHub from './NotificationHub';
import StocksWidget from '../widgets/StocksWidget';
import MaskedHeading from '../ui/MaskedHeading';
import Reveal from '../ui/Reveal';

export default function SummaryTab({ onNavigateToMarkets }) {
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

      {/* Bottom section: Stocks Widget & Notification Hub */}
      <Reveal delay={0.28}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <StocksWidget onNavigateToMarkets={onNavigateToMarkets} />
          </div>
          <div className="lg:col-span-2" data-tutorial="summary-notifications">
            <NotificationHub />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
