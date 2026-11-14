import { getMacroRates } from '../../services/macroRates.js';

let cachedRates = null;
let lastRatesFetch = 0;
const RATES_CACHE_TTL = 6 * 60 * 60 * 1000; // 6-hour cache

/**
 * MCP Tool: get_interest_rates
 * Returns live authoritative FRED series & US Treasury sovereign debt market yields
 */
export async function getInterestRates({ category = 'all' } = {}) {
  const now = Date.now();
  if (cachedRates && (now - lastRatesFetch < RATES_CACHE_TTL)) {
    return filterRates(cachedRates, category);
  }

  try {
    const macroData = await getMacroRates();
    const raw = macroData.raw || macroData;

    const formatted = {
      asOf: macroData.asOf || new Date().toISOString(),
      fedFundsEffectiveRate: `${raw.dff}%`,
      mortgage30YearFixed: `${raw.mortgage30}%`,
      mortgage15YearFixed: `${raw.mortgage15}%`,
      treasury10YearYield: `${raw.tenYearYield}%`,
      treasury3MonthYield: `${raw.threeMonthYield}%`,
      treasury5YearYield: `${raw.fiveYearYield}%`,
      treasury30YearYield: `${raw.thirtyYearYield}%`,
      bankPrimeLoanRate: `${raw.primeRate}%`,
      topHysaApy: `~${raw.topHysa}%`,
      creditCardAverageApr: `${raw.creditCardApr}%`,
      cpiInflationYoY: `${raw.cpiYoY}%`,
      unemploymentRate: `${raw.unemployment}%`,
      source: 'Federal Reserve Economic Data (FRED) & US Treasury Sovereign Debt Market',
    };

    cachedRates = formatted;
    lastRatesFetch = now;
    return filterRates(formatted, category);
  } catch (err) {
    console.warn('[interestRatesTool] Failed to fetch macro rates:', err.message);
    const fallback = {
      asOf: new Date().toISOString(),
      fedFundsEffectiveRate: '3.88%',
      mortgage30YearFixed: '7.11%',
      mortgage15YearFixed: '6.45%',
      treasury10YearYield: '5.15%',
      topHysaApy: '~4.23%',
      creditCardAverageApr: '21.19%',
      source: 'FRED Baseline Fallback',
    };
    return filterRates(fallback, category);
  }
}

function filterRates(rates, category) {
  if (!category || category === 'all') return rates;
  const cat = category.toLowerCase();

  if (cat.includes('mortgage')) {
    return {
      asOf: rates.asOf,
      mortgage30YearFixed: rates.mortgage30YearFixed,
      mortgage15YearFixed: rates.mortgage15YearFixed,
      treasury10YearYield: rates.treasury10YearYield,
      source: rates.source,
    };
  }

  if (cat.includes('fed') || cat.includes('fund') || cat.includes('central')) {
    return {
      asOf: rates.asOf,
      fedFundsEffectiveRate: rates.fedFundsEffectiveRate,
      topHysaApy: rates.topHysaApy,
      bankPrimeLoanRate: rates.bankPrimeLoanRate,
      source: rates.source,
    };
  }

  if (cat.includes('treasury') || cat.includes('bond') || cat.includes('yield')) {
    return {
      asOf: rates.asOf,
      treasury3MonthYield: rates.treasury3MonthYield,
      treasury5YearYield: rates.treasury5YearYield,
      treasury10YearYield: rates.treasury10YearYield,
      treasury30YearYield: rates.treasury30YearYield,
      source: rates.source,
    };
  }

  if (cat.includes('savings') || cat.includes('cash') || cat.includes('hysa')) {
    return {
      asOf: rates.asOf,
      topHysaApy: rates.topHysaApy,
      fedFundsEffectiveRate: rates.fedFundsEffectiveRate,
      cpiInflationYoY: rates.cpiInflationYoY,
      source: rates.source,
    };
  }

  return rates;
}
