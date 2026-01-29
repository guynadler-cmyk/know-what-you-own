import axios from 'axios';
import type { FinancialMetrics, BalanceSheetMetrics, ValuationMetrics, ValuationQuadrant, TimingAnalysis, TimingSignalStatus } from '@shared/schema';

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

interface AlphaVantageMonthlyPrices {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Time Zone': string;
  };
  'Monthly Adjusted Time Series': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. adjusted close': string;
      '6. volume': string;
      '7. dividend amount': string;
    };
  };
}

interface AlphaVantageGlobalQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

interface AlphaVantageSMAResponse {
  'Meta Data': {
    '1: Symbol': string;
    '2: Indicator': string;
    '3: Last Refreshed': string;
    '4: Interval': string;
    '5: Time Period': number;
    '6: Series Type': string;
    '7: Time Zone': string;
  };
  'Technical Analysis: SMA': {
    [date: string]: {
      SMA: string;
    };
  };
}

interface AlphaVantageDailyPrices {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

// Simple in-memory cache to avoid hitting rate limits
const cache = new Map<string, { data: FinancialMetrics; timestamp: number }>();
const balanceSheetCache = new Map<string, { data: BalanceSheetMetrics; timestamp: number }>();
const dailyPriceCache = new Map<string, { closes: number[]; lows: number[]; timestamp: number }>();
const priceCache = new Map<string, { cagr: number; yearsOfData: number; timestamp: number }>();
const quoteCache = new Map<string, { currentPrice: number; weekHigh52: number; timestamp: number }>();
const smaCache = new Map<string, { sma200: number; priceVsSma: 'above' | 'below'; trajectory: 'recovering' | 'drifting' | 'basing' | 'stable'; timestamp: number }>();
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

  async getStockPriceCAGR(ticker: string): Promise<{ cagr: number; yearsOfData: number }> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = priceCache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { cagr: cached.cagr, yearsOfData: cached.yearsOfData };
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      const response = await axios.get<AlphaVantageMonthlyPrices>(BASE_URL, {
        params: {
          function: 'TIME_SERIES_MONTHLY_ADJUSTED',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
      });

      const data = response.data;

      // Check for rate limiting
      if ('Note' in data || 'Information' in data) {
        console.log(`[Price CAGR] ${upperTicker}: Rate limited`);
        throw new Error('Alpha Vantage API rate limit reached.');
      }

      if ('Error Message' in data) {
        throw new Error(`Ticker ${upperTicker} not found`);
      }

      const timeSeries = data['Monthly Adjusted Time Series'];
      if (!timeSeries || Object.keys(timeSeries).length === 0) {
        console.log(`[Price CAGR] ${upperTicker}: No price data available`);
        return { cagr: 0, yearsOfData: 0 };
      }

      // Sort dates in descending order (most recent first)
      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      // Get most recent adjusted close price
      const currentPrice = parseFloat(timeSeries[dates[0]]['5. adjusted close']);
      
      // Try to get price from 5 years ago, fall back to 3 years, then 1 year
      const now = new Date(dates[0]);
      let targetYears = 5;
      let pastPrice = 0;
      let actualYears = 0;

      for (const years of [5, 3, 1]) {
        const targetDate = new Date(now);
        targetDate.setFullYear(targetDate.getFullYear() - years);
        
        // Find the closest date to our target
        let closestDate = dates[dates.length - 1]; // Default to oldest
        for (const date of dates) {
          const dateObj = new Date(date);
          if (dateObj <= targetDate) {
            closestDate = date;
            break;
          }
        }

        const closestDateObj = new Date(closestDate);
        const diffYears = (now.getTime() - closestDateObj.getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        if (diffYears >= 0.5) { // At least 6 months of data
          pastPrice = parseFloat(timeSeries[closestDate]['5. adjusted close']);
          actualYears = diffYears;
          break;
        }
      }

      if (pastPrice <= 0 || actualYears < 0.5) {
        console.log(`[Price CAGR] ${upperTicker}: Insufficient historical data`);
        return { cagr: 0, yearsOfData: 0 };
      }

      // Calculate CAGR: (EndValue / StartValue)^(1/Years) - 1
      const cagr = (Math.pow(currentPrice / pastPrice, 1 / actualYears) - 1) * 100;
      
      console.log(`[Price CAGR] ${upperTicker}: ${cagr.toFixed(1)}% over ${actualYears.toFixed(1)} years (${pastPrice.toFixed(2)} -> ${currentPrice.toFixed(2)})`);

      // Cache the result
      priceCache.set(upperTicker, { cagr, yearsOfData: actualYears, timestamp: Date.now() });

      return { cagr, yearsOfData: actualYears };
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw error;
      }
      console.log(`[Price CAGR] ${upperTicker}: Error - ${error.message}`);
      return { cagr: 0, yearsOfData: 0 }; // Graceful fallback
    }
  }

  async getCurrentQuote(ticker: string): Promise<{ currentPrice: number; weekHigh52: number }> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = quoteCache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { currentPrice: cached.currentPrice, weekHigh52: cached.weekHigh52 };
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      const response = await axios.get<AlphaVantageGlobalQuote>(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const data = response.data;

      // Check for rate limiting
      if ('Note' in data || 'Information' in data) {
        console.log(`[Quote] ${upperTicker}: Rate limited`);
        throw new Error('Alpha Vantage API rate limit reached.');
      }

      if ('Error Message' in data) {
        throw new Error(`Ticker ${upperTicker} not found`);
      }

      const quote = data['Global Quote'];
      if (!quote || !quote['05. price']) {
        console.log(`[Quote] ${upperTicker}: No quote data available`);
        return { currentPrice: 0, weekHigh52: 0 };
      }

      const currentPrice = parseFloat(quote['05. price']);
      
      // Get 52-week high from OVERVIEW endpoint (we'll need to fetch it separately or use cached overview)
      // For now, we'll get it from overview in the parallel fetch
      console.log(`[Quote] ${upperTicker}: Current price $${currentPrice.toFixed(2)}`);

      // Cache the result (weekHigh52 will be updated from overview)
      quoteCache.set(upperTicker, { currentPrice, weekHigh52: 0, timestamp: Date.now() });

      return { currentPrice, weekHigh52: 0 };
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw error;
      }
      console.log(`[Quote] ${upperTicker}: Error - ${error.message}`);
      return { currentPrice: 0, weekHigh52: 0 };
    }
  }

  async getSMAData(ticker: string): Promise<{ sma200: number; priceVsSma: 'above' | 'below'; trajectory: 'recovering' | 'drifting' | 'basing' | 'stable'; currentPrice: number }> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = smaCache.get(upperTicker);
    const cachedQuote = quoteCache.get(upperTicker);
    if (cached && cachedQuote && Date.now() - cached.timestamp < CACHE_TTL) {
      return { sma200: cached.sma200, priceVsSma: cached.priceVsSma, trajectory: cached.trajectory, currentPrice: cachedQuote.currentPrice };
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      // Stagger SMA call
      const smaRes = await axios.get<AlphaVantageSMAResponse>(BASE_URL, {
        params: {
          function: 'SMA',
          symbol: upperTicker,
          interval: 'daily',
          time_period: 200,
          series_type: 'close',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch daily prices for trajectory validation
      const dailyRes = await axios.get<AlphaVantageDailyPrices>(BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: upperTicker,
          outputsize: 'compact', // Gets ~100 days, enough for our analysis
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
      });

      const smaData = smaRes.data;
      const dailyData = dailyRes.data;

      // Check for rate limiting
      if ('Note' in smaData || 'Information' in smaData || 'Note' in dailyData || 'Information' in dailyData) {
        console.log(`[SMA] ${upperTicker}: Rate limited - SMA response:`, JSON.stringify(smaData).substring(0, 300));
        console.log(`[SMA] ${upperTicker}: Rate limited - Daily response:`, JSON.stringify(dailyData).substring(0, 300));
        throw new Error('Alpha Vantage API rate limit reached.');
      }

      const technicalData = smaData['Technical Analysis: SMA'];
      const timeSeries = dailyData['Time Series (Daily)'];

      if (!technicalData || Object.keys(technicalData).length === 0 || !timeSeries || Object.keys(timeSeries).length === 0) {
        console.log(`[SMA] ${upperTicker}: No SMA or daily price data available`);
        return { sma200: 0, priceVsSma: 'below', trajectory: 'stable', currentPrice: 0 };
      }

      // Get the most recent SMA values for trajectory analysis
      const smaDates = Object.keys(technicalData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const currentSma = parseFloat(technicalData[smaDates[0]].SMA);
      const sma1WeekAgo = smaDates.length > 5 ? parseFloat(technicalData[smaDates[5]].SMA) : currentSma;
      const sma3WeeksAgo = smaDates.length > 15 ? parseFloat(technicalData[smaDates[15]].SMA) : currentSma;

      // Get daily closing prices sorted by date (most recent first)
      const priceDates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const currentPrice = parseFloat(timeSeries[priceDates[0]]['4. close']);
      
      // Extract last 30 trading days of closes and lows for basing detection
      const recentCloses: number[] = [];
      const recentLows: number[] = [];
      for (let i = 0; i < Math.min(30, priceDates.length); i++) {
        recentCloses.push(parseFloat(timeSeries[priceDates[i]]['4. close']));
        recentLows.push(parseFloat(timeSeries[priceDates[i]]['3. low']));
      }
      
      // Cache daily prices for potential reuse
      dailyPriceCache.set(upperTicker, { closes: recentCloses, lows: recentLows, timestamp: Date.now() });
      
      // Cache the current price in quoteCache so other methods can use it
      const cachedQuoteData = quoteCache.get(upperTicker);
      quoteCache.set(upperTicker, { 
        currentPrice, 
        weekHigh52: cachedQuoteData?.weekHigh52 || 0, 
        timestamp: Date.now() 
      });
      
      // Determine if price is above or below SMA
      const priceVsSma: 'above' | 'below' = currentPrice >= currentSma ? 'above' : 'below';
      
      // Calculate price distance from SMA as a percentage
      const distanceFromSma = ((currentPrice - currentSma) / currentSma) * 100;
      
      // Calculate SMA rate of change
      const smaChangeFrom1Week = ((currentSma - sma1WeekAgo) / sma1WeekAgo) * 100;
      const smaChangeFrom3Weeks = ((currentSma - sma3WeeksAgo) / sma3WeeksAgo) * 100;
      
      // Determine trajectory using actual price data
      let trajectory: 'recovering' | 'drifting' | 'basing' | 'stable' = 'stable';
      
      if (priceVsSma === 'below') {
        const smaDeclineRate1Week = smaChangeFrom1Week;
        const smaDeclineRate3Week = smaChangeFrom3Weeks / 3;
        
        // Check 1: Is price very close to SMA? → Recovering
        if (distanceFromSma > -5) {
          trajectory = 'recovering';
        }
        // Check 2: Is the stock consolidating (basing)?
        // Now we have actual price data to validate consolidation
        else if (distanceFromSma >= -15 && distanceFromSma < -5 && recentCloses.length >= 20) {
          // Analyze recent price action to detect basing
          // Basing = price has stopped making lower lows over the last 3-4 weeks
          
          // Split into periods: last 2 weeks vs previous 2 weeks
          const recent2Weeks = recentLows.slice(0, 10);
          const previous2Weeks = recentLows.slice(10, 20);
          
          const recentMin = Math.min(...recent2Weeks);
          const previousMin = Math.min(...previous2Weeks);
          
          // Check if recent lows are higher than or equal to previous lows (stopped declining)
          const stoppedMakingLowerLows = recentMin >= previousMin * 0.98; // Allow 2% tolerance
          
          // Check price range is narrowing or stable (not expanding)
          const recentRange = Math.max(...recent2Weeks) - recentMin;
          const previousRange = Math.max(...previous2Weeks) - previousMin;
          const rangeStableOrNarrowing = recentRange <= previousRange * 1.1;
          
          // Check SMA is also stabilizing
          const smaStabilizing = Math.abs(smaDeclineRate1Week) < 0.5;
          
          // Basing requires: stopped lower lows + stable range + SMA stabilizing
          if (stoppedMakingLowerLows && rangeStableOrNarrowing && smaStabilizing) {
            trajectory = 'basing';
            console.log(`[SMA] ${upperTicker}: Basing detected - recent min: $${recentMin.toFixed(2)}, prev min: $${previousMin.toFixed(2)}, SMA chg: ${smaDeclineRate1Week.toFixed(2)}%`);
          } else if (smaDeclineRate3Week < distanceFromSma / 3) {
            trajectory = 'recovering';
          } else {
            trajectory = 'drifting';
          }
        }
        // Check 3: Is price catching up over a longer period?
        else if (smaChangeFrom3Weeks < distanceFromSma) {
          trajectory = 'recovering';
        }
        // Default: still drifting
        else {
          trajectory = 'drifting';
        }
      } else {
        // Above SMA — check for weakening momentum using actual price data
        if (recentCloses.length >= 10) {
          const recent1Week = recentCloses.slice(0, 5);
          const previous1Week = recentCloses.slice(5, 10);
          const recentAvg = recent1Week.reduce((a, b) => a + b, 0) / recent1Week.length;
          const previousAvg = previous1Week.reduce((a, b) => a + b, 0) / previous1Week.length;
          
          // If recent average is lower than previous and barely above SMA, momentum weakening
          if (recentAvg < previousAvg && distanceFromSma < 5) {
            trajectory = 'drifting';
          } else {
            trajectory = 'stable';
          }
        } else {
          trajectory = 'stable';
        }
      }

      console.log(`[SMA] ${upperTicker}: Price $${currentPrice.toFixed(2)}, SMA200 $${currentSma.toFixed(2)}, ${priceVsSma} SMA, ${trajectory} (${distanceFromSma.toFixed(1)}%)`);

      // Cache the result
      smaCache.set(upperTicker, { sma200: currentSma, priceVsSma, trajectory, timestamp: Date.now() });

      return { sma200: currentSma, priceVsSma, trajectory, currentPrice };
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw error;
      }
      console.log(`[SMA] ${upperTicker}: Error - ${error.message}`);
      return { sma200: 0, priceVsSma: 'below', trajectory: 'stable', currentPrice: 0 };
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
      // Helper to add delay between API calls to stay under 5 requests/second limit
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Stagger API calls to avoid exceeding Alpha Vantage's 5 requests/second burst limit
      // We serialize more aggressively: max 2 calls per 500ms window
      
      // Call 1: Overview
      const overviewRes = await axios.get(BASE_URL, {
        params: { function: 'OVERVIEW', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
        timeout: 10000,
      });
      
      await delay(300);
      
      // Call 2: Income Statement
      const incomeRes = await axios.get<AlphaVantageIncomeResponse>(BASE_URL, {
        params: { function: 'INCOME_STATEMENT', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
        timeout: 10000,
      });
      
      await delay(300);
      
      // Call 3: Balance Sheet
      const balanceRes = await axios.get<AlphaVantageBalanceSheetResponse>(BASE_URL, {
        params: { function: 'BALANCE_SHEET', symbol: upperTicker, apikey: ALPHA_VANTAGE_API_KEY },
        timeout: 10000,
      });
      
      await delay(300);
      
      // Call 4: Price CAGR (makes 1 internal call to TIME_SERIES_MONTHLY_ADJUSTED)
      const priceData = await this.getStockPriceCAGR(upperTicker).catch(() => ({ cagr: 0, yearsOfData: 0 }));
      
      await delay(300);
      
      // Call 5-6: SMA data (makes 2 internal calls: SMA + GLOBAL_QUOTE, already staggered internally)
      const smaData = await this.getSMAData(upperTicker).catch(() => ({ sma200: 0, priceVsSma: 'below' as const, trajectory: 'stable' as const, currentPrice: 0 }));

      const overview = overviewRes.data as AlphaVantageCompanyOverview;
      const incomeData = incomeRes.data as AlphaVantageIncomeResponseFull;
      const balanceData = balanceRes.data as AlphaVantageBalanceSheetResponse;
      const { cagr: stockCAGR, yearsOfData: cagrYears } = priceData;
      const { sma200, priceVsSma, trajectory, currentPrice: smaCurrentPrice } = smaData;

      // Helper to check for rate limiting in any response
      const isRateLimited = (data: any): boolean => {
        return data && ('Note' in data || 'Information' in data);
      };

      // Check for rate limiting on any of the three responses
      if (isRateLimited(overview) || isRateLimited(incomeData) || isRateLimited(balanceData)) {
        console.log(`[Valuation] ${upperTicker}: Rate limited by Alpha Vantage`);
        throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
      }

      // Check for API errors or empty overview
      if ('Error Message' in overview) {
        throw new Error(`Ticker ${upperTicker} not found in Alpha Vantage`);
      }
      
      // Check if overview is empty or missing critical data
      if (!overview || Object.keys(overview).length === 0 || !overview.Symbol) {
        console.log(`[Valuation] ${upperTicker}: Empty or invalid overview response`);
        throw new Error(`Unable to retrieve company data for ${upperTicker}. The API may be temporarily unavailable.`);
      }

      // Check for errors in income/balance responses
      if ('Error Message' in incomeData) {
        throw new Error(`Unable to retrieve income data for ${upperTicker}.`);
      }
      if ('Error Message' in balanceData) {
        throw new Error(`Unable to retrieve balance sheet data for ${upperTicker}.`);
      }

      // Use annual reports if available, otherwise fall back to quarterly
      const incomeReports = (incomeData.annualReports && incomeData.annualReports.length > 0) 
        ? incomeData.annualReports 
        : (incomeData.quarterlyReports || []);
      
      const balanceReports = (balanceData.annualReports && balanceData.annualReports.length > 0)
        ? balanceData.annualReports
        : (balanceData.quarterlyReports || []);

      if (incomeReports.length < 1) {
        console.log(`[Valuation] ${upperTicker}: No income reports found. Response:`, JSON.stringify(incomeData).substring(0, 200));
        throw new Error(`No income statement data available for ${upperTicker}. Try again shortly.`);
      }
      if (balanceReports.length < 1) {
        console.log(`[Valuation] ${upperTicker}: No balance reports found. Response:`, JSON.stringify(balanceData).substring(0, 200));
        throw new Error(`No balance sheet data available for ${upperTicker}. Try again shortly.`);
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

      // Calculate Earnings Growth Rate (CAGR) from net income over available years
      // We use net income as the basis for earnings growth
      // NaN indicates growth couldn't be computed (missing data or negative earnings)
      let earningsGrowthRate = NaN;
      let earningsGrowthYears = 0;
      let earningsGrowthComputable = false;
      
      if (incomeReports.length >= 2) {
        // Try to calculate 3-year CAGR first, fallback to whatever we have
        const yearsToUse = Math.min(incomeReports.length, 4); // 4 reports = 3 year CAGR
        const recentEarnings = safeParseFloat(incomeReports[0].netIncome);
        const oldEarnings = safeParseFloat(incomeReports[yearsToUse - 1].netIncome);
        earningsGrowthYears = yearsToUse - 1;
        
        // Only calculate CAGR if both values are positive (can't compound negative to positive meaningfully)
        if (recentEarnings > 0 && oldEarnings > 0 && earningsGrowthYears > 0) {
          earningsGrowthRate = (Math.pow(recentEarnings / oldEarnings, 1 / earningsGrowthYears) - 1) * 100;
          earningsGrowthComputable = true;
          console.log(`[Valuation] ${upperTicker}: Earnings growth ${earningsGrowthRate.toFixed(1)}% CAGR over ${earningsGrowthYears} years (${oldEarnings.toFixed(0)} → ${recentEarnings.toFixed(0)})`);
        } else if (recentEarnings > 0 && oldEarnings <= 0) {
          // Company went from loss to profit - strong turnaround, show as positive
          earningsGrowthRate = 25; // Indicate strong turnaround (capped to avoid misleading large numbers)
          earningsGrowthComputable = true;
          console.log(`[Valuation] ${upperTicker}: Turnaround company - went from loss to profit, showing 25% growth`);
        } else {
          // Currently unprofitable or data issues - can't compute meaningful growth
          console.log(`[Valuation] ${upperTicker}: Cannot compute earnings growth - recent: ${recentEarnings.toFixed(0)}, old: ${oldEarnings.toFixed(0)}`);
        }
      }

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

      // Calculate real distance from 52-week high using overview data and current price from SMA data
      const weekHigh52 = safeParseFloat(overview['52WeekHigh']);
      const currentPrice = smaCurrentPrice; // Use the current price returned from getSMAData
      
      // Calculate distance from 52-week high: ((high - current) / high) * 100
      // Positive values mean price is below the high (a discount)
      const distanceFromHigh = (weekHigh52 > 0 && currentPrice > 0) 
        ? ((weekHigh52 - currentPrice) / weekHigh52) * 100 
        : 0;
      
      console.log(`[Valuation] ${upperTicker}: 52wk high $${weekHigh52.toFixed(2)}, current $${currentPrice.toFixed(2)}, distance ${distanceFromHigh.toFixed(1)}%`);

      // Generate quadrant data based on calculations
      const quadrants: ValuationQuadrant[] = this.generateValuationQuadrants({
        earningsYield,
        returnOnCapital,
        peRatio,
        marketCap,
        shareChange,
        distanceFromHigh,
        sector,
        stockCAGR,
        cagrYears,
        sma200,
        priceVsSma,
        trajectory,
        currentPrice,
        earningsGrowthRate: earningsGrowthComputable ? earningsGrowthRate : NaN,
        earningsGrowthYears: earningsGrowthComputable ? earningsGrowthYears : 0,
        earningsGrowthComputable,
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
    stockCAGR: number;
    cagrYears: number;
    sma200: number;
    priceVsSma: 'above' | 'below';
    trajectory: 'recovering' | 'drifting' | 'basing' | 'stable';
    currentPrice: number;
    earningsGrowthRate: number;
    earningsGrowthYears: number;
    earningsGrowthComputable: boolean;
  }): ValuationQuadrant[] {
    const { earningsYield, returnOnCapital, peRatio, marketCap, shareChange, distanceFromHigh, stockCAGR, cagrYears, sma200, priceVsSma, trajectory, currentPrice, earningsGrowthRate, earningsGrowthYears, earningsGrowthComputable } = data;

    // Determine signal colors based on thresholds
    const eyColor: 'green' | 'red' | 'yellow' = earningsYield > 8 ? 'green' : earningsYield > 5 ? 'yellow' : 'red';
    const rocColor: 'green' | 'red' | 'yellow' = returnOnCapital > 15 ? 'green' : returnOnCapital > 8 ? 'yellow' : 'red';
    const peColor: 'green' | 'red' | 'yellow' = peRatio > 0 && peRatio < 15 ? 'green' : peRatio > 25 ? 'red' : 'yellow';
    const shareColor: 'green' | 'red' | 'neutral' = shareChange < 0 ? 'green' : shareChange > 0 ? 'red' : 'neutral';

    // Distance from high color logic (user requested):
    // > 25% from high → Green (could be a discount if trend supports)
    // 10-25% from high → Yellow (neutral zone)
    // < 10% from high → Red (euphoric entry or strong upward trend — needs conviction)
    const distanceColor: 'green' | 'red' | 'yellow' = distanceFromHigh > 25 ? 'green' : distanceFromHigh > 10 ? 'yellow' : 'red';

    // SMA trend color logic:
    // Below SMA + recovering → Green (sensible entry)
    // Below SMA + drifting → Red (risky, price still falling)
    // Above SMA → Yellow/neutral (price trending above long-term average)
    let smaColor: 'green' | 'red' | 'yellow' = 'yellow';
    let smaLabel = '';
    let smaValue = '';
    
    if (priceVsSma === 'below') {
      if (trajectory === 'recovering') {
        smaColor = 'green';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Recovering';
      } else if (trajectory === 'basing') {
        smaColor = 'yellow';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Basing';
      } else {
        smaColor = 'red';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Drifting Lower';
      }
    } else {
      if (trajectory === 'drifting') {
        smaColor = 'yellow';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Weakening';
      } else {
        smaColor = 'yellow';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Above Trend';
      }
    }

    // Determine overall price discipline verdict based on 5 distinct cases
    let priceDisciplineVerdict = '';
    let priceDisciplineInsight = '';
    let priceDisciplineHighlight = '';
    let priceDisciplineStrength: 'sensible' | 'caution' | 'risky' = 'caution';
    let priceDisciplineTier1 = '';
    let priceDisciplineTier2 = '';

    // Case 5: Near or above highs (< 10% from 52-week high) — check first as it overrides other conditions
    if (distanceFromHigh < 10) {
      priceDisciplineVerdict = 'Euphoric Entry';
      priceDisciplineTier1 = 'Caution: Price is at or near recent highs. Buy only with strong conviction.';
      priceDisciplineTier2 = 'The stock is trading very close to its 52-week high. While this could indicate strong momentum, it also means you\'re paying full price with little margin of safety. Unless you have high conviction in the business story and future growth, consider waiting for a pullback before buying.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'strong conviction';
      priceDisciplineStrength = 'risky';
    }
    // Case 1: Above SMA + Recovering
    else if (priceVsSma === 'above' && trajectory === 'recovering') {
      priceDisciplineVerdict = 'Sensible Entry';
      priceDisciplineTier1 = 'Sensible: Price is off highs and trending up.';
      priceDisciplineTier2 = 'The stock has pulled back from its highs but is now showing upward momentum. This combination of a reasonable price and positive trend direction suggests a sensible entry point — the market is confirming renewed interest.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'sensible entry point';
      priceDisciplineStrength = 'sensible';
    }
    // Case 2: Above SMA + Drifting
    else if (priceVsSma === 'above' && trajectory === 'drifting') {
      priceDisciplineVerdict = 'Watchlist Entry';
      priceDisciplineTier1 = 'Watch: Price is weakening. Better opportunities may emerge.';
      priceDisciplineTier2 = 'The stock is still trading above its long-term trend, but momentum is fading. This could be an early warning sign of a larger pullback. Consider adding to your watchlist and waiting for either a clearer recovery signal or a better entry price.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'adding to your watchlist';
      priceDisciplineStrength = 'caution';
    }
    // Case 3: Below SMA + Recovering
    else if (priceVsSma === 'below' && trajectory === 'recovering') {
      priceDisciplineVerdict = 'Recovery Entry';
      priceDisciplineTier1 = 'Sensible: Trending up from a weak zone.';
      priceDisciplineTier2 = 'The stock is trading below its long-term average but showing signs of recovery. This is often where value emerges — the price is discounted while the trend is turning positive. If the fundamentals support the story, this could be an attractive entry.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'value emerges';
      priceDisciplineStrength = 'sensible';
    }
    // Case 4: Below SMA + Basing (new consolidation case)
    else if (priceVsSma === 'below' && trajectory === 'basing') {
      priceDisciplineVerdict = 'Monitor Closely';
      priceDisciplineTier1 = 'Watch: Price has stopped falling and is moving sideways.';
      priceDisciplineTier2 = 'The stock has stopped making new lows and appears to be consolidating. While it\'s too early to call this a recovery, it could be the start of a trend change. Keep this one on your radar and watch for price to break above its recent range before committing.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'start of a trend change';
      priceDisciplineStrength = 'caution';
    }
    // Case 5: Below SMA + Drifting
    else if (priceVsSma === 'below' && trajectory === 'drifting') {
      priceDisciplineVerdict = 'Risky Entry';
      priceDisciplineTier1 = 'Risky: Price is falling with no recovery yet.';
      priceDisciplineTier2 = 'The stock is trading below its long-term average and continues to drift lower. While the price may look cheap, a falling knife can keep falling. Wait for signs of stabilization before committing capital — catching a bottom is harder than it looks.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'signs of stabilization';
      priceDisciplineStrength = 'risky';
    }
    // Fallback (should rarely hit — covers edge cases like stable trajectory)
    else {
      priceDisciplineVerdict = 'Neutral Entry';
      priceDisciplineTier1 = 'Neutral: Price signals are mixed — no clear advantage.';
      priceDisciplineTier2 = 'The price is at a moderate distance from its highs with no strong directional signal. Entry timing is neither ideal nor risky. Focus on the fundamentals and business story rather than price timing.';
      priceDisciplineInsight = priceDisciplineTier2;
      priceDisciplineHighlight = 'fundamentals and business story';
      priceDisciplineStrength = 'caution';
    }

    return [
      {
        id: 'price-discipline',
        title: 'Price Discipline',
        verdict: priceDisciplineVerdict,
        signals: [
          { 
            label: 'Distance from 52-Week High', 
            value: distanceFromHigh > 0 ? `${distanceFromHigh.toFixed(0)}% below` : 'At High', 
            color: distanceColor, 
            tooltip: 'How far the current price is from the stock\'s 52-week peak. Larger discounts may offer better entry points.' 
          },
          { 
            label: smaLabel, 
            value: smaValue, 
            color: smaColor, 
            tooltip: 'The 200-day moving average helps track long-term trends. Buying below this line can offer value — but only if price is recovering, not falling away.' 
          },
        ],
        insight: priceDisciplineInsight,
        insightHighlight: priceDisciplineHighlight,
        strength: priceDisciplineStrength,
        tier1Summary: priceDisciplineTier1,
        tier2Explanation: priceDisciplineTier2,
      },
      {
        id: 'price-tag',
        title: 'Price Tag',
        verdict: this.getPriceTagVerdict(peRatio, earningsGrowthRate, earningsGrowthComputable),
        signals: [
          { 
            label: 'P/E Ratio', 
            value: peRatio > 0 ? `${peRatio.toFixed(1)}x` : 'N/A', 
            color: peColor, 
            tooltip: 'Tells you how many years of earnings it would take to "pay back" the stock price. The higher it is, the more expensive the stock may look.' 
          },
          { 
            label: 'Earnings Growth', 
            value: earningsGrowthComputable ? `${earningsGrowthRate > 0 ? '+' : ''}${earningsGrowthRate.toFixed(1)}%` : 'N/A', 
            color: earningsGrowthComputable ? (earningsGrowthRate > 15 ? 'green' : earningsGrowthRate > 5 ? 'yellow' : 'red') : 'neutral', 
            tooltip: earningsGrowthComputable 
              ? `Shows how fast the company's earnings are growing (${earningsGrowthYears}-year${earningsGrowthYears === 1 ? '' : 's'} trend). Fast growth can justify a high price.`
              : 'Not enough earnings history to calculate growth rate.' 
          },
        ],
        insight: this.getPriceTagInsight(peRatio, earningsGrowthRate, earningsGrowthComputable),
        insightHighlight: this.getPriceTagHighlight(peRatio, earningsGrowthRate, earningsGrowthComputable),
        strength: this.getPriceTagStrength(peRatio, earningsGrowthRate, earningsGrowthComputable),
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
        verdict: stockCAGR > 15 ? 'Fast Track' : stockCAGR > 7 ? 'Steady Path' : 'Long Road',
        signals: [
          { 
            label: 'Time to Double', 
            value: stockCAGR > 0 ? `~${Math.round(72 / stockCAGR)} years` : 'N/A', 
            color: stockCAGR > 15 ? 'green' : stockCAGR > 7 ? 'yellow' : 'red', 
            tooltip: `Based on the stock's historical return of ${stockCAGR.toFixed(1)}% per year over ${cagrYears.toFixed(1)} years. Past performance doesn't guarantee future results.` 
          },
          { 
            label: 'Growth Quality', 
            value: returnOnCapital > 15 ? 'High' : returnOnCapital > 8 ? 'Medium' : 'Low', 
            color: rocColor, 
            tooltip: 'How efficiently the company can reinvest profits to drive growth.' 
          },
        ],
        insight: stockCAGR > 15 
          ? `Based on historical returns (${stockCAGR.toFixed(1)}% annually), the stock has doubled roughly every ${Math.round(72 / stockCAGR)} years. Past performance is not a guarantee, but this shows strong momentum.`
          : stockCAGR > 0 
          ? `The stock has grown ${stockCAGR.toFixed(1)}% annually over ${Math.round(cagrYears)} years. The path to doubling is longer. You're betting on future improvements more than current earnings power.`
          : 'Not enough historical data to estimate doubling time. Proceed with caution.',
        insightHighlight: stockCAGR > 15 ? 'strong momentum' : 'betting on future improvements',
        strength: stockCAGR > 15 ? 'sensible' : stockCAGR > 7 ? 'caution' : 'risky',
      },
    ];
  }

  private getPriceTagVerdict(peRatio: number, earningsGrowthRate: number, earningsGrowthComputable: boolean): string {
    // Handle missing/invalid P/E (negative earnings companies)
    if (peRatio <= 0) {
      return 'Hard to Value';
    }
    
    // Handle missing growth data - can only evaluate based on P/E
    if (!earningsGrowthComputable) {
      return peRatio <= 15 ? 'Looks Cheap' : peRatio > 25 ? 'Looks Expensive' : 'Fairly Priced';
    }
    
    const isHighPE = peRatio > 25;
    const isLowPE = peRatio <= 15;
    const isHighGrowth = earningsGrowthRate > 15;
    const isLowGrowth = earningsGrowthRate <= 5;

    if (isLowPE && isHighGrowth) return 'Hidden Gem';
    if (isLowPE && isLowGrowth) return 'Value Trap Risk';
    if (isHighPE && isHighGrowth) return 'Growth Premium';
    if (isHighPE && isLowGrowth) return 'Overpriced';
    return 'Fairly Priced';
  }

  private getPriceTagInsight(peRatio: number, earningsGrowthRate: number, earningsGrowthComputable: boolean): string {
    // Handle missing/invalid P/E (negative earnings companies)
    if (peRatio <= 0) {
      return 'The company doesn\'t have positive earnings right now, so traditional price measures don\'t apply. Focus on the business story and future potential instead.';
    }
    
    // Handle missing growth data
    if (!earningsGrowthComputable) {
      if (peRatio <= 15) {
        return 'The stock looks cheap based on P/E, but we don\'t have enough data to measure earnings growth. Dig into the story to understand why.';
      }
      if (peRatio > 25) {
        return 'The stock looks expensive based on P/E, and we don\'t have clear earnings growth data. Proceed carefully.';
      }
      return 'The P/E looks reasonable, but we don\'t have enough data to assess earnings growth trends.';
    }
    
    const isHighPE = peRatio > 25;
    const isLowPE = peRatio <= 15;
    const isHighGrowth = earningsGrowthRate > 15;
    const isLowGrowth = earningsGrowthRate <= 5;

    if (isLowPE && isHighGrowth) {
      return 'The stock looks reasonably priced and the business is growing fast. This combination is rare — dig deeper to confirm it\'s real.';
    }
    if (isLowPE && isLowGrowth) {
      return 'The stock looks cheap, but earnings aren\'t growing much. Sometimes low prices reflect real problems — make sure you understand why.';
    }
    if (isHighPE && isHighGrowth) {
      return 'You\'re paying a premium, but earnings growth is strong. The market expects big things — the question is whether the company can deliver.';
    }
    if (isHighPE && isLowGrowth) {
      return 'The stock looks expensive and earnings growth is slow. Be careful — you may be paying more than the business is worth.';
    }
    return 'The price seems reasonable relative to earnings growth. Not a screaming deal, but not overpriced either.';
  }

  private getPriceTagHighlight(peRatio: number, earningsGrowthRate: number, earningsGrowthComputable: boolean): string {
    if (peRatio <= 0) return 'business story';
    if (!earningsGrowthComputable) return 'dig into the story';
    
    const isHighPE = peRatio > 25;
    const isLowPE = peRatio <= 15;
    const isHighGrowth = earningsGrowthRate > 15;
    const isLowGrowth = earningsGrowthRate <= 5;

    if (isLowPE && isHighGrowth) return 'rare';
    if (isLowPE && isLowGrowth) return 'understand why';
    if (isHighPE && isHighGrowth) return 'paying a premium';
    if (isHighPE && isLowGrowth) return 'expensive';
    return 'reasonable';
  }

  private getPriceTagStrength(peRatio: number, earningsGrowthRate: number, earningsGrowthComputable: boolean): 'sensible' | 'caution' | 'risky' {
    // Handle missing/invalid P/E (negative earnings companies) - neutral caution
    if (peRatio <= 0) return 'caution';
    
    // Handle missing growth data - evaluate based on P/E only
    if (!earningsGrowthComputable) {
      return peRatio <= 15 ? 'caution' : peRatio > 25 ? 'risky' : 'caution';
    }
    
    const isHighPE = peRatio > 25;
    const isLowPE = peRatio <= 15;
    const isHighGrowth = earningsGrowthRate > 15;
    const isLowGrowth = earningsGrowthRate <= 5;

    if (isLowPE && isHighGrowth) return 'sensible';
    if (isLowPE && isLowGrowth) return 'caution';
    if (isHighPE && isHighGrowth) return 'caution';
    if (isHighPE && isLowGrowth) return 'risky';
    return 'caution';
  }

  async getTimingAnalysis(ticker: string): Promise<TimingAnalysis> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = timingCache.get(upperTicker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Fetch daily prices with full output for more data points
      const dailyRes = await axios.get<AlphaVantageDailyPrices>(BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: upperTicker,
          outputsize: 'full',
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 15000,
      });

      await delay(300);

      // Fetch company overview for name
      const overviewRes = await axios.get(BASE_URL, {
        params: {
          function: 'OVERVIEW',
          symbol: upperTicker,
          apikey: ALPHA_VANTAGE_API_KEY,
        },
        timeout: 10000,
      });

      const dailyData = dailyRes.data;
      const overview = overviewRes.data as AlphaVantageCompanyOverview;

      // Check for rate limiting
      if ('Note' in dailyData || 'Information' in dailyData) {
        throw new Error('Alpha Vantage API rate limit reached. Please try again in a minute.');
      }

      if ('Error Message' in dailyData) {
        throw new Error(`Ticker ${upperTicker} not found`);
      }

      const timeSeries = dailyData['Time Series (Daily)'];
      if (!timeSeries || Object.keys(timeSeries).length < 50) {
        throw new Error(`Insufficient price data for ${upperTicker}`);
      }

      // Sort dates descending (most recent first) and get last 200 days
      const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const priceData = dates.slice(0, 200).map(date => ({
        date,
        close: parseFloat(timeSeries[date]['4. close']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
      }));

      // Calculate EMAs for trend analysis
      const closes = priceData.map(d => d.close).reverse(); // Oldest first for EMA calculation
      const ema20 = this.calculateEMA(closes, 20);
      const ema50 = this.calculateEMA(closes, 50);
      const ema200 = this.calculateEMA(closes, 200);

      // Calculate MACD components for momentum
      const ema12 = this.calculateEMA(closes, 12);
      const ema26 = this.calculateEMA(closes, 26);
      const macdLine = ema12.map((v, i) => v - ema26[i]);
      const signalLine = this.calculateEMA(macdLine, 9);
      const macdHistogram = macdLine.map((v, i) => v - signalLine[i]);

      // Calculate RSI for stretch
      const rsi = this.calculateRSI(closes, 14);

      // Get latest values
      const currentPrice = closes[closes.length - 1];
      const currentEma20 = ema20[ema20.length - 1];
      const currentEma50 = ema50[ema50.length - 1];
      const currentEma200 = ema200[ema200.length - 1];
      const currentMacdHist = macdHistogram[macdHistogram.length - 1];
      const prevMacdHist = macdHistogram[macdHistogram.length - 2];
      const currentRsi = rsi[rsi.length - 1];

      // TREND ANALYSIS
      const trendSignal = this.analyzeTrend(currentPrice, currentEma20, currentEma50, currentEma200, closes);
      
      // MOMENTUM ANALYSIS
      const momentumSignal = this.analyzeMomentum(currentMacdHist, prevMacdHist, macdHistogram, ema12, ema26);
      
      // STRETCH ANALYSIS
      const stretchSignal = this.analyzeStretch(currentRsi, currentPrice, currentEma20, rsi);

      // Calculate overall alignment score (average of normalized scores)
      const alignmentScore = (trendSignal.score + momentumSignal.score + stretchSignal.score) / 3;

      // Generate verdict message based on alignment
      const verdictMessage = this.generateVerdictMessage(alignmentScore, trendSignal.status, momentumSignal.status, stretchSignal.status);

      // Prepare chart data (take last 60 points for visualization)
      const chartLength = Math.min(60, closes.length);
      const chartStartIndex = closes.length - chartLength;

      // Smooth prices for trend chart (simple moving average smoothing)
      const smoothedPrices = this.smoothPrices(closes.slice(chartStartIndex), 5);
      const baselinePrices = ema50.slice(chartStartIndex);

      // Normalize MACD histogram for momentum chart
      const macdChartData = macdHistogram.slice(chartStartIndex);
      const maxMacd = Math.max(...macdChartData.map(Math.abs));
      const normalizedMacd = macdChartData.map(v => maxMacd > 0 ? v / maxMacd : 0);
      const intensityData = macdChartData.map(v => maxMacd > 0 ? Math.abs(v) / maxMacd : 0);

      // Calculate price distance from equilibrium (EMA20) for stretch chart
      // Use fixed scale: 10% deviation = full range
      const pricesForStretch = closes.slice(chartStartIndex);
      const ema20ForStretch = ema20.slice(chartStartIndex);
      const distanceFromEquilibrium = pricesForStretch.map((p, i) => {
        const eq = ema20ForStretch[i];
        return eq > 0 ? ((p - eq) / eq) * 100 : 0; // Percent distance
      });
      const maxScale = 10; // 10% = full range, consistent across all tickers
      const normalizedDistance = distanceFromEquilibrium.map(d => Math.max(-1, Math.min(1, d / maxScale)));
      const tensionData = normalizedDistance.map(v => Math.abs(v));

      const analysis: TimingAnalysis = {
        ticker: upperTicker,
        companyName: overview.Name || upperTicker,
        lastUpdated: new Date().toISOString(),
        verdict: {
          message: verdictMessage,
          subtitle: 'These readings describe current market conditions — not the future.',
          alignmentScore,
        },
        trend: {
          signal: trendSignal,
          chartData: {
            prices: smoothedPrices,
            baseline: baselinePrices,
          },
          deepDive: {
            title: 'Market Structure',
            explanation: this.getTrendExplanation(trendSignal.status),
          },
        },
        momentum: {
          signal: momentumSignal,
          chartData: (() => {
            // Normalize by divergence: (short-long)/long as percentage
            // Fixed 3% divergence scale: same visual gap = same actual divergence
            const shortSlice = ema12.slice(chartStartIndex);
            const longSlice = ema26.slice(chartStartIndex);
            const divergenceScale = 3; // 3% divergence = 0.5 offset from midline
            // Both curves around 0.5 midline, separation = divergence
            const shortNorm = shortSlice.map((s, i) => {
              const l = longSlice[i];
              const divergence = l > 0 ? ((s - l) / l) * 100 : 0;
              return Math.max(0, Math.min(1, 0.5 + divergence / (divergenceScale * 2)));
            });
            const longNorm = longSlice.map((_, i) => {
              return 0.5; // Long EMA is always at midline
            });
            return {
              shortEma: shortNorm,
              longEma: longNorm,
            };
          })(),
          deepDive: {
            title: 'Pressure Flow',
            explanation: this.getMomentumExplanation(momentumSignal.status),
          },
        },
        stretch: {
          signal: stretchSignal,
          chartData: {
            values: normalizedDistance,
            tension: tensionData,
          },
          deepDive: {
            title: 'Price Tension',
            explanation: this.getStretchExplanation(stretchSignal.status),
          },
        },
      };

      // Cache the result
      timingCache.set(upperTicker, { data: analysis, timestamp: Date.now() });

      return analysis;
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw error;
      }
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Market data request timed out. Please try again.');
      }
      throw new Error(`Unable to analyze timing conditions: ${error.message}`);
    }
  }

  private calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [];
    
    if (data.length === 0) return ema;
    
    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < Math.min(period, data.length); i++) {
      sum += data[i];
    }
    ema.push(sum / Math.min(period, data.length));
    
    // Calculate EMA for remaining values
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    
    return ema;
  }

  private calculateRSI(data: number[], period: number): number[] {
    const rsi: number[] = [];
    if (data.length < period + 1) return data.map(() => 50);

    let gains = 0;
    let losses = 0;

    // Calculate first average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Fill initial values
    for (let i = 0; i <= period; i++) {
      rsi.push(50);
    }

    // Calculate RSI for remaining values
    for (let i = period + 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  private smoothPrices(prices: number[], window: number): number[] {
    const smoothed: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(prices.length, i + Math.floor(window / 2) + 1);
      const sum = prices.slice(start, end).reduce((a, b) => a + b, 0);
      smoothed.push(sum / (end - start));
    }
    return smoothed;
  }

  private analyzeTrend(price: number, ema20: number, ema50: number, ema200: number, closes: number[]): { status: TimingSignalStatus; label: string; interpretation: string; score: number; position: { x: number; y: number }; signals: { label: string; value: string }[] } {
    // Check EMA alignment and price position
    const aboveEma20 = price > ema20;
    const aboveEma50 = price > ema50;
    const aboveEma200 = price > ema200;
    const ema20AboveEma50 = ema20 > ema50;
    const ema50AboveEma200 = ema50 > ema200;

    // Count bullish signals
    const bullishCount = [aboveEma20, aboveEma50, aboveEma200, ema20AboveEma50, ema50AboveEma200].filter(Boolean).length;

    // Check for higher highs and higher lows in recent price action
    const recentHighs = closes.slice(-20);
    const midHighs = closes.slice(-40, -20);
    const olderHighs = closes.slice(-60, -40);
    const recentHigh = Math.max(...recentHighs);
    const midHigh = midHighs.length > 0 ? Math.max(...midHighs) : recentHigh;
    const olderHigh = olderHighs.length > 0 ? Math.max(...olderHighs) : midHigh;
    
    const recentLow = Math.min(...recentHighs);
    const midLow = midHighs.length > 0 ? Math.min(...midHighs) : recentLow;
    const olderLow = olderHighs.length > 0 ? Math.min(...olderHighs) : midLow;
    
    // Calculate highs and lows progression for quadrant position
    const highsImproving = recentHigh > midHigh && midHigh > olderHigh * 0.98;
    const highsWeakening = recentHigh < midHigh * 0.98;
    const lowsImproving = recentLow > midLow && midLow > olderLow * 0.98;
    const lowsWeakening = recentLow < midLow * 0.98;
    
    // Calculate quadrant position (0-100)
    // X-axis: Highs progression (left=weakening, right=improving)
    // Y-axis: Lows progression (bottom=weakening, top=improving)
    const highsScore = highsImproving ? 75 : (highsWeakening ? 25 : 50);
    const lowsScore = lowsImproving ? 75 : (lowsWeakening ? 25 : 50);
    
    // Add some variance based on actual ratios
    const highsRatio = midHigh > 0 ? (recentHigh / midHigh - 1) * 100 : 0;
    const lowsRatio = midLow > 0 ? (recentLow / midLow - 1) * 100 : 0;
    const xPosition = Math.max(10, Math.min(90, 50 + highsRatio * 5));
    const yPosition = Math.max(10, Math.min(90, 50 + lowsRatio * 5));
    
    const makingHigherHighs = recentHigh > midHigh * 0.98;

    let status: TimingSignalStatus;
    let label: string;
    let interpretation: string;
    let score: number;

    if (bullishCount >= 4 && makingHigherHighs) {
      status = 'green';
      label = 'Strengthening';
      interpretation = 'Structure shows rising momentum with aligned trends.';
      score = 0.8;
    } else if (bullishCount >= 3) {
      status = 'green';
      label = 'Constructive';
      interpretation = 'Structure is generally positive, showing upward bias.';
      score = 0.5;
    } else if (bullishCount >= 2) {
      status = 'yellow';
      label = 'Mixed';
      interpretation = 'Structure is transitioning — direction not yet clear.';
      score = 0;
    } else if (bullishCount === 1) {
      status = 'yellow';
      label = 'Weakening';
      interpretation = 'Structure is under pressure, with few supportive elements.';
      score = -0.3;
    } else {
      status = 'red';
      label = 'Declining';
      interpretation = 'Structure shows downward pressure across timeframes.';
      score = -0.7;
    }

    const highsStatus = highsImproving ? 'Improving' : (highsWeakening ? 'Weakening' : 'Mixed');
    const lowsStatus = lowsImproving ? 'Improving' : (lowsWeakening ? 'Weakening' : 'Mixed');

    return { 
      status, 
      label, 
      interpretation, 
      score,
      position: { x: xPosition, y: yPosition },
      signals: [
        { label: 'Recent highs', value: highsStatus },
        { label: 'Recent lows', value: lowsStatus }
      ]
    };
  }

  private analyzeMomentum(currentHist: number, prevHist: number, histogram: number[], ema12: number[], ema26: number[]): { status: TimingSignalStatus; label: string; interpretation: string; score: number; position: { x: number; y: number }; signals: { label: string; value: string }[] } {
    const isPositive = currentHist > 0;
    const isRising = currentHist > prevHist;
    
    // Check recent histogram trend (last 5 bars)
    const recentHist = histogram.slice(-5);
    const histTrend = recentHist[recentHist.length - 1] - recentHist[0];
    const avgHist = recentHist.reduce((a, b) => a + b, 0) / recentHist.length;

    // Calculate short-term and long-term slopes for quadrant position
    const shortRecent = ema12.slice(-5);
    const longRecent = ema26.slice(-5);
    const shortSlope = shortRecent.length > 1 ? (shortRecent[shortRecent.length - 1] - shortRecent[0]) / shortRecent[0] * 100 : 0;
    const longSlope = longRecent.length > 1 ? (longRecent[longRecent.length - 1] - longRecent[0]) / longRecent[0] * 100 : 0;

    // X-axis: Short-term pressure direction (left=downward, right=upward)
    // Y-axis: Long-term baseline direction (bottom=weakening, top=strengthening)
    const xPosition = Math.max(10, Math.min(90, 50 + shortSlope * 10));
    const yPosition = Math.max(10, Math.min(90, 50 + longSlope * 10));

    // Determine signal labels
    const shortTermStatus = shortSlope > 0.5 ? 'Improving' : (shortSlope < -0.5 ? 'Weakening' : 'Flat');
    const longTermStatus = longSlope > 0.3 ? 'Improving' : (longSlope < -0.3 ? 'Weakening' : 'Flat');
    const gapWidening = Math.abs(currentHist) > Math.abs(prevHist);
    const gapStatus = gapWidening ? 'Widening' : 'Narrowing';

    let status: TimingSignalStatus;
    let label: string;
    let interpretation: string;
    let score: number;

    if (isPositive && isRising && histTrend > 0) {
      status = 'green';
      label = 'Aligned';
      interpretation = 'Short and long-term pressures are aligned and supportive.';
      score = 0.7;
    } else if (isPositive && !isRising) {
      status = 'yellow';
      label = 'Pullback';
      interpretation = 'Short-term pressure against a positive baseline — often absorbed.';
      score = 0.3;
    } else if (!isPositive && isRising) {
      status = 'yellow';
      label = 'Early Recovery';
      interpretation = 'Short-term improving while long-term still weak — early but unconfirmed.';
      score = 0.1;
    } else if (!isPositive && avgHist < 0 && histTrend < 0) {
      status = 'red';
      label = 'Pressure Building';
      interpretation = 'Both time frames under pressure — conditions are intensifying.';
      score = -0.7;
    } else {
      status = 'yellow';
      label = 'Transitioning';
      interpretation = 'Pressure is shifting — waiting for clarity.';
      score = -0.2;
    }

    return { 
      status, 
      label, 
      interpretation, 
      score,
      position: { x: xPosition, y: yPosition },
      signals: [
        { label: 'Short-term pressure', value: shortTermStatus },
        { label: 'Long-term baseline', value: longTermStatus },
        { label: 'Pressure gap', value: gapStatus }
      ]
    };
  }

  private analyzeStretch(rsi: number, price: number, ema20: number, rsiHistory: number[]): { status: TimingSignalStatus; label: string; interpretation: string; score: number; position: { x: number; y: number }; signals: { label: string; value: string }[] } {
    const priceDistFromEma = ((price - ema20) / ema20) * 100;
    
    // Calculate direction: is RSI/stretch moving toward or away from equilibrium?
    const recentRsi = rsiHistory.slice(-5);
    const prevRsi = recentRsi.length > 1 ? recentRsi[0] : rsi;
    const rsiChange = rsi - prevRsi;
    const isReturningToBalance = (rsi > 50 && rsiChange < 0) || (rsi < 50 && rsiChange > 0);
    const isMovingAway = (rsi > 50 && rsiChange > 0) || (rsi < 50 && rsiChange < 0);

    // Distance from balance (normalized 0-100 scale, where 0=near balance)
    const distanceNormalized = Math.abs(priceDistFromEma);
    
    // Determine signal labels
    const distanceLevel = distanceNormalized > 6 ? 'High' : (distanceNormalized > 3 ? 'Moderate' : 'Low');
    const directionLabel = isReturningToBalance ? 'Returning' : (isMovingAway ? 'Moving away' : 'Stable');

    let status: TimingSignalStatus;
    let label: string;
    let interpretation: string;
    let score: number;
    let xPosition: number;
    let yPosition: number;

    // Determine the signal status and label first, then set position to match the quadrant
    if (rsi > 70 || priceDistFromEma > 8) {
      // Tension Rising (red) - bottomRight: far distance, moving away
      status = 'red';
      label = 'Tension Rising';
      interpretation = 'Price appears stretched above equilibrium — tension is elevated.';
      score = -0.6;
      xPosition = 70 + Math.min(20, distanceNormalized * 2);
      yPosition = 25;
    } else if (rsi < 30 || priceDistFromEma < -8) {
      // Tension Rising (red) - bottomRight: far distance, moving away
      status = 'red';
      label = 'Tension Rising';
      interpretation = 'Price appears stretched below equilibrium — potential snap-back.';
      score = -0.4;
      xPosition = 70 + Math.min(20, distanceNormalized * 2);
      yPosition = 25;
    } else if ((rsi > 60 || priceDistFromEma > 4) && !isReturningToBalance) {
      // Drifting (neutral) - bottomLeft: near balance, moving away
      status = 'yellow';
      label = 'Drifting';
      interpretation = 'Price is moving away from equilibrium — some tension present.';
      score = 0.1;
      xPosition = 25 + Math.min(20, distanceNormalized * 3);
      yPosition = 30;
    } else if ((rsi < 40 || priceDistFromEma < -4) && !isReturningToBalance) {
      // Drifting (neutral) - bottomLeft: near balance, moving away
      status = 'yellow';
      label = 'Drifting';
      interpretation = 'Price is below equilibrium and moving further.';
      score = 0.1;
      xPosition = 25 + Math.min(20, distanceNormalized * 3);
      yPosition = 30;
    } else if (isReturningToBalance && distanceNormalized > 3) {
      // Tension Easing (blue) - topRight: far distance, returning
      status = 'yellow';
      label = 'Tension Easing';
      interpretation = 'Price is stretched but returning toward balance — tension is cooling.';
      score = 0.3;
      xPosition = 60 + Math.min(25, distanceNormalized * 3);
      yPosition = 70;
    } else {
      // Calm (green) - topLeft: near balance, stable/returning
      status = 'green';
      label = 'Calm';
      interpretation = 'Price is near equilibrium — balanced conditions.';
      score = 0.5;
      xPosition = 20 + Math.min(25, distanceNormalized * 5);
      yPosition = 75;
    }

    return { 
      status, 
      label, 
      interpretation, 
      score,
      position: { x: xPosition, y: yPosition },
      signals: [
        { label: 'Distance from balance', value: distanceLevel },
        { label: 'Direction', value: directionLabel }
      ]
    };
  }

  private generateVerdictMessage(alignmentScore: number, trendStatus: TimingSignalStatus, momentumStatus: TimingSignalStatus, stretchStatus: TimingSignalStatus): string {
    const greenCount = [trendStatus, momentumStatus, stretchStatus].filter(s => s === 'green').length;
    const redCount = [trendStatus, momentumStatus, stretchStatus].filter(s => s === 'red').length;

    if (alignmentScore > 0.5 && greenCount >= 2) {
      return 'Conditions look supportive';
    } else if (alignmentScore > 0.2 && greenCount >= 1) {
      return 'Conditions are improving, but not fully aligned';
    } else if (alignmentScore > -0.2) {
      return 'Conditions are mixed — patience may be rewarded';
    } else if (redCount >= 2) {
      return "We'd wait for stronger alignment";
    } else {
      return 'Conditions suggest waiting for more clarity';
    }
  }

  private getTrendExplanation(status: TimingSignalStatus): string {
    switch (status) {
      case 'green':
        return 'The overall structure shows prices making progress. Shorter-term trends are aligned with longer-term direction, suggesting underlying strength. This doesn\'t predict the future, but it describes a generally healthy pattern.';
      case 'yellow':
        return 'The structure is in transition. Some timeframes show strength while others lag. This mixed picture often resolves in one direction or another — waiting for clarity can help.';
      case 'red':
        return 'The structure shows prices moving lower across most timeframes. While this doesn\'t mean prices will continue falling, it suggests caution until conditions stabilize.';
    }
  }

  private getMomentumExplanation(status: TimingSignalStatus): string {
    switch (status) {
      case 'green':
        return 'Underlying pressure is positive and building. This suggests more participants are leaning in the same direction, which can support continued movement. However, strong momentum can reverse quickly.';
      case 'yellow':
        return 'Pressure is shifting or stabilizing. The balance between participants is changing, which often precedes a new directional move. Clarity may come soon.';
      case 'red':
        return 'Underlying pressure remains negative. More participants appear to be moving in the opposite direction. This doesn\'t predict further decline, but suggests waiting for pressure to ease.';
    }
  }

  private getStretchExplanation(status: TimingSignalStatus): string {
    switch (status) {
      case 'green':
        return 'Price is near its natural equilibrium — neither stretched too high nor too low. This balanced state often provides more stable conditions for patient decisions.';
      case 'yellow':
        return 'Price has moved somewhat away from equilibrium. Some tension exists, which could resolve through price returning toward balance or the equilibrium adjusting.';
      case 'red':
        return 'Price appears significantly stretched from equilibrium. High tension states often resolve through sharp moves. Patience may help avoid acting at extreme levels.';
    }
  }
}

const valuationCache = new Map<string, { data: ValuationMetrics; timestamp: number }>();
const timingCache = new Map<string, { data: TimingAnalysis; timestamp: number }>();

export const alphaVantageService = new AlphaVantageService();