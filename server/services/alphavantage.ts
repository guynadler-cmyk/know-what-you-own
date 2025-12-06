import axios from 'axios';
import type { FinancialMetrics, BalanceSheetMetrics } from '@shared/schema';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

interface AlphaVantageIncomeStatement {
  fiscalDateEnding: string;
  totalRevenue: string;
  netIncome: string;
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
}

interface AlphaVantageBalanceSheetResponse {
  symbol: string;
  annualReports: AlphaVantageBalanceSheet[];
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

      if (!data.annualReports || data.annualReports.length < 2) {
        throw new Error(`Insufficient financial data for ${upperTicker}. Need at least 2 years of annual reports.`);
      }

      // Get the two most recent annual reports
      const reports = data.annualReports.slice(0, 2);
      const currentReport = reports[0];
      const previousReport = reports[1];

      // Parse revenue values
      const currentRevenue = parseFloat(currentReport.totalRevenue);
      const previousRevenue = parseFloat(previousReport.totalRevenue);

      // Parse earnings (net income) values
      const currentEarnings = parseFloat(currentReport.netIncome);
      const previousEarnings = parseFloat(previousReport.netIncome);

      // Validate parsed values
      if (isNaN(currentRevenue) || isNaN(previousRevenue)) {
        throw new Error(`Invalid revenue data for ${upperTicker}. Revenue values are not numeric.`);
      }

      if (isNaN(currentEarnings) || isNaN(previousEarnings)) {
        throw new Error(`Invalid earnings data for ${upperTicker}. Earnings values are not numeric.`);
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

      // Format currency values
      const formatCurrency = (value: number): string => {
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
        previousFiscalYear: previousReport.fiscalDateEnding.substring(0, 4),
      };

      // Cache the result
      cache.set(upperTicker, { data: metrics, timestamp: Date.now() });

      return metrics;
    } catch (error: any) {
      if (error.message?.includes('Alpha Vantage') || error.message?.includes('Insufficient financial data')) {
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

      if (!data.annualReports || data.annualReports.length < 2) {
        throw new Error(`Insufficient balance sheet data for ${upperTicker}. Need at least 2 years of annual reports.`);
      }

      // Get the two most recent annual reports
      const reports = data.annualReports.slice(0, 2);
      const currentReport = reports[0];
      const previousReport = reports[1];

      // Parse values
      const currentAssets = parseFloat(currentReport.totalCurrentAssets);
      const currentLiabilities = parseFloat(currentReport.totalCurrentLiabilities);
      const cash = parseFloat(currentReport.cashAndCashEquivalentsAtCarryingValue);
      const longTermDebt = parseFloat(currentReport.longTermDebt || '0');
      const shortTermDebt = parseFloat(currentReport.shortTermDebt || '0');
      const totalDebt = longTermDebt + shortTermDebt;
      const currentEquity = parseFloat(currentReport.totalShareholderEquity);
      const previousEquity = parseFloat(previousReport.totalShareholderEquity);

      // Format currency values
      const formatCurrency = (value: number): string => {
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

      if (currentEquity > previousEquity) {
        equityStatus = 'strong';
        const equityGrowth = ((currentEquity - previousEquity) / previousEquity * 100).toFixed(1);
        equitySummary = "The company's net worth is growing — a positive sign.";
        equityDetails = `Shareholder equity grew from <strong>${formatCurrency(previousEquity)}</strong> to <strong>${formatCurrency(currentEquity)}</strong> (up ${equityGrowth}%).<br>This shows the company is building owner value over time.`;
      } else {
        equityStatus = 'caution';
        const equityDecline = ((previousEquity - currentEquity) / previousEquity * 100).toFixed(1);
        equitySummary = "Owner value is declining. Look deeper into what's causing it.";
        equityDetails = `Shareholder equity declined from <strong>${formatCurrency(previousEquity)}</strong> to <strong>${formatCurrency(currentEquity)}</strong> (down ${equityDecline}%).<br>This decline warrants further investigation into the underlying causes.`;
      }

      const metrics: BalanceSheetMetrics = {
        ticker: upperTicker,
        fiscalYear: currentReport.fiscalDateEnding.substring(0, 4),
        previousFiscalYear: previousReport.fiscalDateEnding.substring(0, 4),
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
      if (error.message?.includes('Alpha Vantage') || error.message?.includes('Insufficient')) {
        throw error;
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Alpha Vantage API request timed out. Please try again.');
      }

      throw new Error(`Failed to fetch balance sheet data: ${error.message}`);
    }
  }
}

export const alphaVantageService = new AlphaVantageService();