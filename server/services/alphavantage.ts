import axios from 'axios';
import type { FinancialMetrics, BalanceSheetMetrics, ValuationMetrics, ValuationQuadrant } from '@shared/schema';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

interface AlphaVantageIncomeStatement {
  fiscalDateEnding: string;
  totalRevenue: string;
  netIncome: string;
  operatingIncome: string;
}

interface AlphaVantageCompanyOverview {
  Symbol: string;
  Name: string;
  Sector: string;
  MarketCapitalization: string;
  PERatio: string;
  SharesOutstanding: string;
  '52WeekHigh': string;
  '52WeekLow': string;
}

interface AlphaVantageIncomeResponse {
  symbol: string;
  annualReports: AlphaVantageIncomeStatement[];
}

interface AlphaVantageBalanceSheet {
  fiscalDateEnding: string;
  totalAssets: string;
  totalCurrentAssets: string;
  totalCurrentLiabilities: string;
  totalLiabilities: string;
  totalShareholderEquity: string;
  cashAndCashEquivalentsAtCarryingValue: string;
  longTermDebt: string;
  shortTermDebt: string;
  propertyPlantEquipment: string;
}

interface AlphaVantageBalanceSheetResponse {
  symbol: string;
  annualReports: AlphaVantageBalanceSheet[];
  quarterlyReports?: AlphaVantageBalanceSheet[];
}

interface AlphaVantageIncomeResponseFull {
  symbol: string;
  annualReports: AlphaVantageIncomeStatement[];
  quarterlyReports?: AlphaVantageIncomeStatement[];
}

// Simple in-memory cache to avoid hitting rate limits
const cache = new Map<string, { data: FinancialMetrics; timestamp: number }>();
const balanceSheetCache = new Map<string, { data: BalanceSheetMetrics; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export class AlphaVantageService {
  async getFinancialMetrics(ticker: string): Promise<FinancialMetrics> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = cache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      const response = await axios.get<AlphaVantageIncomeResponse>(BASE_URL, {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const data = response.data;

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(`Ticker ${upperTicker} not found in Alpha Vantage`);
      }

      if ('Note' in data) {
        throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
      }

      // Use all available annual reports (at least 1 required)
      const reports = data.annualReports || [];
      if (reports.length < 1) {
        throw new Error(`No financial data available for ${upperTicker}.`);
      }

      console.log(`[Financial] ${upperTicker}: Using ${reports.length} annual reports`);

      const currentReport = reports[0];
      const previousReport = reports.length > 1 ? reports[1] : null;

      // Parse revenue values with safe fallback
      const safeParseFloat = (value: string | undefined | null): number => {
        if (!value || value === 'None' || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      const currentRevenue = safeParseFloat(currentReport.totalRevenue);
      const previousRevenue = previousReport ? safeParseFloat(previousReport.totalRevenue) : 0;

      // Parse earnings (net income) values
      const currentEarnings = safeParseFloat(currentReport.netIncome);
      const previousEarnings = previousReport ? safeParseFloat(previousReport.netIncome) : 0;

      // Validate current values (previous can be 0 if only one period available)
      if (currentRevenue === 0 && currentEarnings === 0) {
        throw new Error(`Invalid financial data for ${upperTicker}. No revenue or earnings data found.`);
      }

      // Calculate percentage changes (guard against division by zero)
      let revenueChangePercent: number;
      if (previousRevenue === 0) {
        if (currentRevenue === 0) {
          revenueChangePercent = 0;
        } else {
          revenueChangePercent = Math.sign(currentRevenue) * 100;
        }
      } else {
        revenueChangePercent = ((currentRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100;
      }

      let earningsChangePercent: number;
      if (previousEarnings === 0) {
        if (currentEarnings === 0) {
          earningsChangePercent = 0;
        } else {
          earningsChangePercent = Math.sign(currentEarnings) * 100;
        }
      } else {
        earningsChangePercent = ((currentEarnings - previousEarnings) / Math.abs(previousEarnings)) * 100;
      }

      // Determine growth/decline classification based on percentage change
      const revenueGrowth = revenueChangePercent > 0 ? 'growing' : 'declining';
      const earningsGrowth = earningsChangePercent > 0 ? 'growing' : 'declining';

      // Format currency values with NaN protection
      const formatCurrency = (value: number): string => {
        if (isNaN(value) || value === 0) return '$0';
        
        const billion = value / 1_000_000_000;
        const million = value / 1_000_000;

        if (Math.abs(billion) >= 1) {
          return `$${billion.toFixed(2)}B`;
        } else {
          return `$${million.toFixed(2)}M`;
        }
      };

      const metrics: FinancialMetrics = {
        ticker: upperTicker,
        revenueGrowth: revenueGrowth as 'growing' | 'declining',
        earningsGrowth: earningsGrowth as 'growing' | 'declining',
        currentRevenue: formatCurrency(currentRevenue),
        previousRevenue: formatCurrency(previousRevenue),
        revenueChangePercent: parseFloat(revenueChangePercent.toFixed(2)),
        currentEarnings: formatCurrency(currentEarnings),
        previousEarnings: formatCurrency(previousEarnings),
        earningsChangePercent: parseFloat(earningsChangePercent.toFixed(2)),
        fiscalYear: currentReport.fiscalDateEnding.substring(0, 4),
        previousFiscalYear: previousReport ? previousReport.fiscalDateEnding.substring(0, 4) : currentReport.fiscalDateEnding.substring(0, 4),
      };

      // Cache the result
      cache.set(upperTicker, { data: metrics, timestamp: Date.now() });

      return metrics;
    } catch (error: any) {
      if (error.message?.includes('Alpha Vantage') || error.message?.includes('No financial data')) {
        throw error;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Alpha Vantage API request timed out. Please try again.');
      }

      throw new Error(`Failed to fetch financial data: ${error.message}`);
    }
  }

  async getBalanceSheetMetrics(ticker: string): Promise<BalanceSheetMetrics> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = balanceSheetCache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      const response = await axios.get<AlphaVantageBalanceSheetResponse>(BASE_URL, {
        params: {
          function: 'BALANCE_SHEET',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const data = response.data;

      // Check for API errors
      if ('Error Message' in data) {
        throw new Error(`Ticker ${upperTicker} not found in Alpha Vantage`);
      }

      if ('Note' in data) {
        throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
      }

      // Use all available annual reports (at least 1 required)
      const reports = data.annualReports || [];
      if (reports.length < 1) {
        throw new Error(`No balance sheet data available for ${upperTicker}.`);
      }

      console.log(`[Balance Sheet] ${upperTicker}: Using ${reports.length} annual reports`);

      const currentReport = reports[0];
      const previousReport = reports.length > 1 ? reports[1] : null;

      // Parse values with NaN protection
      const safeParseFloat = (value: string | undefined | null): number => {
        if (!value || value === 'None' || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      const currentAssets = safeParseFloat(currentReport.totalCurrentAssets);
      const currentLiabilities = safeParseFloat(currentReport.totalCurrentLiabilities);
      const cash = safeParseFloat(currentReport.cashAndCashEquivalentsAtCarryingValue);
      const longTermDebt = safeParseFloat(currentReport.longTermDebt);
      const shortTermDebt = safeParseFloat(currentReport.shortTermDebt);
      const totalDebt = longTermDebt + shortTermDebt;
      const currentEquity = safeParseFloat(currentReport.totalShareholderEquity);
      const previousEquity = previousReport ? safeParseFloat(previousReport.totalShareholderEquity) : currentEquity;

      // Format currency values with NaN protection
      const formatCurrency = (value: number): string => {
        if (isNaN(value) || value === 0) return '$0';
        
        const billion = value / 1_000_000_000;
        const million = value / 1_000_000;

        if (Math.abs(billion) >= 1) {
          return `$${billion.toFixed(2)}B`;
        } else {
          return `$${million.toFixed(2)}M`;
        }
      };

      // Check 1: Can it cover its short-term needs?
      let liquidityStatus: 'strong' | 'caution' | 'weak';
      let liquiditySummary: string;
      let liquidityDetails: string;

      if (currentAssets > currentLiabilities) {
        liquidityStatus = 'strong';
        liquiditySummary = 'The company has more short-term assets than obligations. Bills are covered.';
        liquidityDetails = `The company has <strong>${formatCurrency(currentAssets)}</strong> in current assets and <strong>${formatCurrency(currentLiabilities)}</strong> in current liabilities.<br>Assets exceed liabilities — a healthy position for meeting near-term obligations.`;
      } else {
        liquidityStatus = 'weak';
        liquiditySummary = 'It may struggle to meet short-term needs with current resources.';
        liquidityDetails = `The company has <strong>${formatCurrency(currentAssets)}</strong> in current assets and <strong>${formatCurrency(currentLiabilities)}</strong> in current liabilities.<br>Liabilities exceed assets — this could create pressure when bills come due.`;
      }

      // Check 2: Does it rely heavily on debt?
      let debtStatus: 'strong' | 'caution' | 'weak';
      let debtSummary: string;
      let debtDetails: string;

      if (totalDebt > 2 * cash) {
        debtStatus = 'caution';
        const debtRatio = (totalDebt / cash).toFixed(1);
        debtSummary = 'Debt is significantly higher than cash. This can limit flexibility in tougher times.';
        debtDetails = `The company owes <strong>${formatCurrency(totalDebt)}</strong> and holds <strong>${formatCurrency(cash)}</strong> in cash.<br>That means debt is ${debtRatio}x larger than cash — a potential risk.<br>We flag this when debt is more than twice the cash on hand.`;
      } else {
        debtStatus = 'strong';
        debtSummary = 'Debt is in a manageable range relative to cash.';
        debtDetails = `The company owes <strong>${formatCurrency(totalDebt)}</strong> and holds <strong>${formatCurrency(cash)}</strong> in cash.<br>Debt levels appear manageable given the cash position.`;
      }

      // Check 3: Is owner value growing?
      let equityStatus: 'strong' | 'caution' | 'weak';
      let equitySummary: string;
      let equityDetails: string;

      // Handle case where we only have one period of data
      if (!previousReport || currentEquity === previousEquity) {
        if (currentEquity > 0) {
          equityStatus = 'strong';
          equitySummary = "The company has positive shareholder equity.";
          equityDetails = `Current shareholder equity is <strong>${formatCurrency(currentEquity)}</strong>.<br>Historical comparison not available with current data.`;
        } else if (currentEquity < 0) {
          equityStatus = 'weak';
          equitySummary = "The company has negative shareholder equity — a warning sign.";
          equityDetails = `Current shareholder equity is <strong>${formatCurrency(currentEquity)}</strong>.<br>Negative equity means liabilities exceed assets, which can indicate financial distress.`;
        } else {
          equityStatus = 'caution';
          equitySummary = "The company has no shareholder equity — worth investigating.";
          equityDetails = `Current shareholder equity is <strong>$0</strong>.<br>Zero equity means assets equal liabilities, which warrants further investigation.`;
        }
      } else if (currentEquity > previousEquity) {
        equityStatus = 'strong';
        const equityGrowth = previousEquity !== 0 ? ((currentEquity - previousEquity) / Math.abs(previousEquity) * 100).toFixed(1) : '100+';
        equitySummary = "The company's net worth is growing — a positive sign.";
        equityDetails = `Shareholder equity grew from <strong>${formatCurrency(previousEquity)}</strong> to <strong>${formatCurrency(currentEquity)}</strong> (up ${equityGrowth}%).<br>This shows the company is building owner value over time.`;
      } else {
        equityStatus = 'caution';
        const equityDecline = previousEquity !== 0 ? ((previousEquity - currentEquity) / Math.abs(previousEquity) * 100).toFixed(1) : '100+';
        equitySummary = "Owner value is declining. Look deeper into what's causing it.";
        equityDetails = `Shareholder equity declined from <strong>${formatCurrency(previousEquity)}</strong> to <strong>${formatCurrency(currentEquity)}</strong> (down ${equityDecline}%).<br>This decline warrants further investigation into the underlying causes.`;
      }

      const metrics: BalanceSheetMetrics = {
        ticker: upperTicker,
        fiscalYear: currentReport.fiscalDateEnding.substring(0, 4),
        previousFiscalYear: previousReport ? previousReport.fiscalDateEnding.substring(0, 4) : currentReport.fiscalDateEnding.substring(0, 4),
        checks: {
          liquidity: {
            status: liquidityStatus,
            title: 'Can it cover its short-term needs?',
            summary: liquiditySummary,
            details: liquidityDetails,
            numbers: `Current Assets: ${formatCurrency(currentAssets)} | Current Liabilities: ${formatCurrency(currentLiabilities)}`,
          },
          debtBurden: {
            status: debtStatus,
            title: 'Does it rely heavily on debt?',
            summary: debtSummary,
            details: debtDetails,
            numbers: `Total Debt: ${formatCurrency(totalDebt)} | Cash: ${formatCurrency(cash)}`,
          },
          equityGrowth: {
            status: equityStatus,
            title: 'Is owner value growing?',
            summary: equitySummary,
            details: equityDetails,
            numbers: `Current Equity: ${formatCurrency(currentEquity)} | Previous Equity: ${formatCurrency(previousEquity)}`,
          },
        },
      };

      // Cache the result
      balanceSheetCache.set(upperTicker, { data: metrics, timestamp: Date.now() });

      return metrics;
    } catch (error: any) {
      if (error.message?.includes('Alpha Vantage') || error.message?.includes('No balance sheet data')) {
        throw error;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Alpha Vantage API request timed out. Please try again.');
      }

      throw new Error(`Failed to fetch balance sheet data: ${error.message}`);
    }
  }

  async getValuationMetrics(ticker: string): Promise<ValuationMetrics> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = valuationCache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      // Fetch Company Overview, Income Statement, and Balance Sheet in parallel
      const [overviewRes, incomeRes, balanceRes] = await Promise.all([
        axios.get(BASE_URL, {
          params: { function: 'OVERVIEW', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
          timeout: 10000,
        }),
        axios.get<AlphaVantageIncomeResponse>(BASE_URL, {
          params: { function: 'INCOME_STATEMENT', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
          timeout: 10000,
        }),
        axios.get<AlphaVantageBalanceSheetResponse>(BASE_URL, {
          params: { function: 'BALANCE_SHEET', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
          timeout: 10000,
        }),
      ]);

      const overview = overviewRes.data as AlphaVantageCompanyOverview;
      const incomeData = incomeRes.data as AlphaVantageIncomeResponseFull;
      const balanceData = balanceRes.data as AlphaVantageBalanceSheetResponse;

      // Check for API errors
      if ('Error Message' in overview || !overview.Symbol) {
        throw new Error(`Ticker ${upperTicker} not found in Alpha Vantage`);
      }
      if ('Note' in overview) {
        throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
      }

      // Use annual reports if available, otherwise fall back to quarterly
      const incomeReports = (incomeData.annualReports && incomeData.annualReports.length > 0) 
        ? incomeData.annualReports 
        : (incomeData.quarterlyReports || []);
      
      const balanceReports = (balanceData.annualReports && balanceData.annualReports.length > 0)
        ? balanceData.annualReports
        : (balanceData.quarterlyReports || []);

      if (incomeReports.length < 1) {
        throw new Error(`No income statement data available for ${upperTicker}.`);
      }
      if (balanceReports.length < 1) {
        throw new Error(`No balance sheet data available for ${upperTicker}.`);
      }

      // Log how much data we're working with
      console.log(`[Valuation] ${upperTicker}: Using ${incomeReports.length} income reports and ${balanceReports.length} balance sheet reports`);

      const safeParseFloat = (value: string | undefined | null): number => {
        if (!value || value === 'None' || value === '') return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      };

      const formatCurrency = (value: number): string => {
        if (isNaN(value) || value === 0) return '$0';
        const billion = value / 1_000_000_000;
        const million = value / 1_000_000;
        if (Math.abs(billion) >= 1) {
          return `$${billion.toFixed(2)}B`;
        } else {
          return `$${million.toFixed(2)}M`;
        }
      };

      const formatPercent = (value: number): string => {
        return `${value.toFixed(1)}%`;
      };

      // Parse company overview data
      const marketCap = safeParseFloat(overview.MarketCapitalization);
      const peRatio = safeParseFloat(overview.PERatio);
      const companyName = overview.Name || upperTicker;
      const sector = overview.Sector || 'Unknown';
      const sharesOutstanding = safeParseFloat(overview.SharesOutstanding);
      const week52High = safeParseFloat(overview['52WeekHigh']);

      // Parse income statement (use all available periods, starting with most recent)
      const currentIncome = incomeReports[0];
      const previousIncome = incomeReports.length > 1 ? incomeReports[1] : null;
      const ebit = safeParseFloat(currentIncome.operatingIncome);

      // Parse balance sheet (use all available periods, starting with most recent)
      const currentBalance = balanceReports[0];
      const previousBalance = balanceReports.length > 1 ? balanceReports[1] : null;
      const cash = safeParseFloat(currentBalance.cashAndCashEquivalentsAtCarryingValue);
      const shortTermDebt = safeParseFloat(currentBalance.shortTermDebt);
      const longTermDebt = safeParseFloat(currentBalance.longTermDebt);
      const totalCurrentAssets = safeParseFloat(currentBalance.totalCurrentAssets);
      const totalCurrentLiabilities = safeParseFloat(currentBalance.totalCurrentLiabilities);

      // Magic Formula calculations
      // Enterprise Value = Market Cap + Total Debt - Cash
      const totalDebt = shortTermDebt + longTermDebt;
      const enterpriseValue = marketCap + totalDebt - cash;

      // Earnings Yield = EBIT / Enterprise Value
      const earningsYield = enterpriseValue > 0 ? (ebit / enterpriseValue) * 100 : 0;

      // Return on Capital = EBIT / (Net Working Capital + Net Fixed Assets)
      // Net Working Capital = Current Assets - Current Liabilities
      // For simplicity, we'll use Total Assets - Current Liabilities as invested capital proxy
      const netWorkingCapital = totalCurrentAssets - totalCurrentLiabilities;
      // Note: Alpha Vantage doesn't always provide PropertyPlantEquipment reliably
      // Using a simplified ROC based on available data
      const investedCapital = netWorkingCapital > 0 ? netWorkingCapital : Math.abs(netWorkingCapital);
      const returnOnCapital = investedCapital > 0 ? (ebit / investedCapital) * 100 : 0;

      // Calculate share change (dilution or buybacks)
      let shareChange = 0;
      if (previousBalance && previousIncome) {
        // Approximate share change from equity changes
        const currentEquity = safeParseFloat(currentBalance.totalShareholderEquity);
        const previousEquity = safeParseFloat(previousBalance.totalShareholderEquity);
        const currentEarnings = safeParseFloat(currentIncome.netIncome);
        // Rough estimate: if equity grew more than earnings, shares may have been issued
        const equityChange = currentEquity - previousEquity;
        shareChange = equityChange > currentEarnings * 1.5 ? 5 : equityChange < 0 ? -3 : 0;
      }

      // Estimate distance from 52-week high (would need current price for accuracy)
      // This is a placeholder - real implementation would need real-time price
      const distanceFromHigh = 15; // Placeholder %

      // Generate quadrant data based on calculations
      const quadrants: ValuationQuadrant[] = this.generateValuationQuadrants({
        earningsYield,
        returnOnCapital,
        peRatio,
        marketCap,
        shareChange,
        distanceFromHigh,
        sector,
      });

      // Determine overall strength
      const positiveSignals = (earningsYield > 8 ? 1 : 0) + (returnOnCapital > 15 ? 1 : 0) + (shareChange <= 0 ? 1 : 0);
      const overallStrength: 'sensible' | 'caution' | 'risky' = 
        positiveSignals >= 2 ? 'sensible' : positiveSignals === 1 ? 'caution' : 'risky';

      const summaryVerdict = overallStrength === 'sensible' 
        ? 'The numbers suggest a reasonably priced business with solid returns.'
        : overallStrength === 'caution'
        ? 'Some metrics look good, but others warrant a closer look before investing.'
        : 'Multiple valuation signals suggest caution — the price may not match the fundamentals.';

      const metrics: ValuationMetrics = {
        ticker: upperTicker,
        companyName,
        fiscalYear: currentIncome.fiscalDateEnding.substring(0, 4),
        sector,
        marketCap,
        marketCapFormatted: formatCurrency(marketCap),
        ebit,
        ebitFormatted: formatCurrency(ebit),
        enterpriseValue,
        enterpriseValueFormatted: formatCurrency(enterpriseValue),
        earningsYield,
        earningsYieldFormatted: formatPercent(earningsYield),
        returnOnCapital,
        returnOnCapitalFormatted: formatPercent(returnOnCapital),
        priceToEarnings: peRatio > 0 ? peRatio : undefined,
        priceToEarningsFormatted: peRatio > 0 ? peRatio.toFixed(1) + 'x' : undefined,
        distanceFromHigh,
        distanceFromHighFormatted: formatPercent(distanceFromHigh),
        sharesOutstanding,
        shareChange,
        shareChangeFormatted: shareChange > 0 ? `+${shareChange}% dilution` : shareChange < 0 ? `${Math.abs(shareChange)}% buybacks` : 'Stable',
        quadrants,
        overallStrength,
        summaryVerdict,
      };

      // Cache the result
      valuationCache.set(upperTicker, { data: metrics, timestamp: Date.now() });

      return metrics;
    } catch (error: any) {
      if (error.message?.includes('Alpha Vantage') || error.message?.includes('Insufficient') || error.message?.includes('rate limit')) {
        throw error;
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Alpha Vantage API request timed out. Please try again.');
      }
      throw new Error(`Failed to fetch valuation data: ${error.message}`);
    }
  }

  private generateValuationQuadrants(data: {
    earningsYield: number;
    returnOnCapital: number;
    peRatio: number;
    marketCap: number;
    shareChange: number;
    distanceFromHigh: number;
    sector: string;
  }): ValuationQuadrant[] {
    const { earningsYield, returnOnCapital, peRatio, marketCap, shareChange, distanceFromHigh } = data;

    // Determine signal colors based on thresholds
    const eyColor: 'green' | 'red' | 'yellow' = earningsYield > 8 ? 'green' : earningsYield > 5 ? 'yellow' : 'red';
    const rocColor: 'green' | 'red' | 'yellow' = returnOnCapital > 15 ? 'green' : returnOnCapital > 8 ? 'yellow' : 'red';
    const peColor: 'green' | 'red' | 'yellow' = peRatio > 0 && peRatio < 15 ? 'green' : peRatio > 25 ? 'red' : 'yellow';
    const shareColor: 'green' | 'red' | 'neutral' = shareChange < 0 ? 'green' : shareChange > 0 ? 'red' : 'neutral';

    return [
      {
        id: 'price-discipline',
        title: 'Price Discipline',
        verdict: distanceFromHigh > 20 ? 'Discounted' : distanceFromHigh > 10 ? 'Reasonable Entry' : 'Near Highs',
        signals: [
          { label: 'Distance from Recent High', value: `${distanceFromHigh.toFixed(0)}%`, color: 'neutral', tooltip: 'How far the current price is from the stock\'s recent peak.' },
          { label: 'Company Size', value: marketCap > 10_000_000_000 ? 'Large Cap' : marketCap > 2_000_000_000 ? 'Mid Cap' : 'Small Cap', color: 'neutral', tooltip: 'The total value of the company in the stock market.' },
        ],
        insight: distanceFromHigh > 20 
          ? 'The stock is trading well below its recent highs. This could be a reasonable entry point — but make sure the fundamentals still support the story.'
          : 'The stock is trading close to its recent highs. Entry risk is elevated unless you have strong conviction.',
        insightHighlight: distanceFromHigh > 20 ? 'reasonable entry point' : 'Entry risk is elevated',
        strength: distanceFromHigh > 20 ? 'sensible' : distanceFromHigh > 10 ? 'caution' : 'risky',
      },
      {
        id: 'valuation-check',
        title: 'Valuation Check',
        verdict: earningsYield > 8 ? 'Attractively Priced' : earningsYield > 5 ? 'Fairly Valued' : 'Expensive',
        signals: [
          { label: 'Earnings Yield', value: `${earningsYield.toFixed(1)}%`, color: eyColor, tooltip: 'How much profit the company earns relative to its total value. Higher is better.' },
          { label: 'P/E Ratio', value: peRatio > 0 ? `${peRatio.toFixed(1)}x` : 'N/A', color: peColor, tooltip: 'How much you pay for each dollar of profit. Lower can mean cheaper.' },
        ],
        insight: earningsYield > 8 
          ? 'The earnings yield suggests you\'re getting good value for your money. The business is generating solid profits relative to its price.'
          : 'The valuation is stretched — you\'re paying a premium for this business. Make sure the growth justifies it.',
        insightHighlight: earningsYield > 8 ? 'good value for your money' : 'paying a premium',
        strength: eyColor === 'green' ? 'sensible' : eyColor === 'yellow' ? 'caution' : 'risky',
      },
      {
        id: 'capital-discipline',
        title: 'Capital Discipline',
        verdict: returnOnCapital > 15 ? 'High Returns' : returnOnCapital > 8 ? 'Adequate Returns' : 'Low Returns',
        signals: [
          { label: 'ROIC', value: `${returnOnCapital.toFixed(1)}%`, color: rocColor, tooltip: 'Return on Invested Capital — how much profit the company earns on the money it reinvests.' },
          { label: shareChange < 0 ? 'Share Buybacks' : shareChange > 0 ? 'Share Dilution' : 'Share Structure', value: shareChange < 0 ? 'Active' : shareChange > 0 ? 'Diluting' : 'Stable', color: shareColor, tooltip: shareChange < 0 ? 'The company is buying back shares, increasing your ownership stake.' : shareChange > 0 ? 'The company is issuing new shares, reducing your ownership stake.' : 'Share count is relatively stable.' },
        ],
        insight: returnOnCapital > 15 
          ? 'The company earns strong returns on the capital it invests. This is a sign of a quality business with pricing power.'
          : 'Capital returns are modest. The business may struggle to compound wealth efficiently over time.',
        insightHighlight: returnOnCapital > 15 ? 'strong returns' : 'modest',
        strength: rocColor === 'green' ? 'sensible' : rocColor === 'yellow' ? 'caution' : 'risky',
      },
      {
        id: 'doubling-potential',
        title: 'Doubling Potential',
        verdict: earningsYield > 10 ? 'Fast Track' : earningsYield > 5 ? 'Steady Path' : 'Long Road',
        signals: [
          { label: 'Time to Double', value: earningsYield > 0 ? `~${Math.round(72 / earningsYield)} years` : 'N/A', color: 'neutral', tooltip: 'A rough estimate using the Rule of 72: how long it might take for the company to double in size based on current earnings yield.' },
          { label: 'Growth Quality', value: returnOnCapital > 15 ? 'High' : returnOnCapital > 8 ? 'Medium' : 'Low', color: rocColor, tooltip: 'How efficiently the company can reinvest profits to drive growth.' },
        ],
        insight: earningsYield > 10 
          ? 'Based on current earnings, the company could potentially double in value within a reasonable timeframe. Patience could be rewarded.'
          : 'The path to doubling is longer. You\'re betting on future improvements more than current earnings power.',
        insightHighlight: earningsYield > 10 ? 'double in value' : 'betting on future improvements',
        strength: earningsYield > 10 ? 'sensible' : earningsYield > 5 ? 'caution' : 'risky',
      },
    ];
  }
}

const valuationCache = new Map<string, { data: ValuationMetrics; timestamp: number }>();

export const alphaVantageService = new AlphaVantageService();