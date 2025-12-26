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

// Simple in-memory cache to avoid hitting rate limits
const cache = new Map<string, { data: FinancialMetrics; timestamp: number }>();
const balanceSheetCache = new Map<string, { data: BalanceSheetMetrics; timestamp: number }>();
const priceCache = new Map<string, { cagr: number; yearsOfData: number; timestamp: number }>();
const quoteCache = new Map<string, { currentPrice: number; weekHigh52: number; timestamp: number }>();
const smaCache = new Map<string, { sma200: number; priceVsSma: 'above' | 'below'; trajectory: 'recovering' | 'drifting' | 'stable'; timestamp: number }>();
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

  async getSMAData(ticker: string): Promise<{ sma200: number; priceVsSma: 'above' | 'below'; trajectory: 'recovering' | 'drifting' | 'stable'; currentPrice: number }> {
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
      // Fetch SMA and current price in parallel
      const [smaRes, quoteRes] = await Promise.all([
        axios.get<AlphaVantageSMAResponse>(BASE_URL, {
          params: {
            function: 'SMA',
            symbol: upperTicker,
            interval: 'daily',
            time_period: 200,
            series_type: 'close',
            apikey: ALPHA_VANTAGE_API_KEY,
          },
          timeout: 15000,
        }),
        axios.get<AlphaVantageGlobalQuote>(BASE_URL, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: upperTicker,
            apikey: ALPHA_VANTAGE_API_KEY,
          },
          timeout: 10000,
        }),
      ]);

      const smaData = smaRes.data;
      const quoteData = quoteRes.data;

      // Check for rate limiting
      if ('Note' in smaData || 'Information' in smaData || 'Note' in quoteData || 'Information' in quoteData) {
        console.log(`[SMA] ${upperTicker}: Rate limited`);
        throw new Error('Alpha Vantage API rate limit reached.');
      }

      const technicalData = smaData['Technical Analysis: SMA'];
      const quote = quoteData['Global Quote'];

      if (!technicalData || Object.keys(technicalData).length === 0 || !quote) {
        console.log(`[SMA] ${upperTicker}: No SMA or quote data available`);
        return { sma200: 0, priceVsSma: 'below', trajectory: 'stable', currentPrice: 0 };
      }

      // Get the most recent SMA values to determine trajectory
      const smaDates = Object.keys(technicalData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const currentSma = parseFloat(technicalData[smaDates[0]].SMA);
      const previousSma = smaDates.length > 5 ? parseFloat(technicalData[smaDates[5]].SMA) : currentSma; // SMA from ~1 week ago
      const olderSma = smaDates.length > 20 ? parseFloat(technicalData[smaDates[20]].SMA) : currentSma; // SMA from ~1 month ago

      const currentPrice = parseFloat(quote['05. price']);
      
      // Cache the current price in quoteCache so other methods can use it
      const cachedQuote = quoteCache.get(upperTicker);
      quoteCache.set(upperTicker, { 
        currentPrice, 
        weekHigh52: cachedQuote?.weekHigh52 || 0, 
        timestamp: Date.now() 
      });
      
      // Determine if price is above or below SMA
      const priceVsSma: 'above' | 'below' = currentPrice >= currentSma ? 'above' : 'below';
      
      // Calculate price distance from SMA as a percentage
      const distanceFromSma = ((currentPrice - currentSma) / currentSma) * 100;
      
      // Determine trajectory: is price moving toward or away from SMA?
      // We compare recent price-to-SMA ratio vs older price-to-SMA ratio
      // If we're below SMA and the gap is closing, we're recovering
      // If we're below SMA and the gap is widening, we're drifting
      let trajectory: 'recovering' | 'drifting' | 'stable' = 'stable';
      
      if (priceVsSma === 'below') {
        // Compare current distance vs distance from a few days ago
        // Using SMA trend as proxy: if SMA is falling faster than price, we're recovering
        const smaChange = ((currentSma - olderSma) / olderSma) * 100;
        
        // If distance from SMA is shrinking (getting less negative), we're recovering
        // We'll use the SMA slope and price momentum as indicators
        if (distanceFromSma > -5) {
          trajectory = 'recovering'; // Very close to SMA
        } else if (smaChange < distanceFromSma) {
          trajectory = 'recovering'; // Price is catching up to SMA
        } else {
          trajectory = 'drifting'; // Price is falling away from SMA
        }
      } else {
        // Above SMA
        trajectory = 'stable';
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
      // Fetch Company Overview, Income Statement, Balance Sheet, Historical Prices, and SMA data in parallel
      const [overviewRes, incomeRes, balanceRes, priceData, smaData] = await Promise.all([
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
        this.getStockPriceCAGR(upperTicker).catch(() => ({ cagr: 0, yearsOfData: 0 })),
        this.getSMAData(upperTicker).catch(() => ({ sma200: 0, priceVsSma: 'below' as const, trajectory: 'stable' as const, currentPrice: 0 })),
      ]);

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
    trajectory: 'recovering' | 'drifting' | 'stable';
    currentPrice: number;
  }): ValuationQuadrant[] {
    const { earningsYield, returnOnCapital, peRatio, marketCap, shareChange, distanceFromHigh, stockCAGR, cagrYears, sma200, priceVsSma, trajectory, currentPrice } = data;

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
      } else {
        smaColor = 'red';
        smaLabel = 'Trend vs 200-day';
        smaValue = 'Drifting Lower';
      }
    } else {
      smaColor = 'yellow';
      smaLabel = 'Trend vs 200-day';
      smaValue = 'Above Trend';
    }

    // Determine overall price discipline verdict based on combination of signals
    let priceDisciplineVerdict = '';
    let priceDisciplineInsight = '';
    let priceDisciplineHighlight = '';
    let priceDisciplineStrength: 'sensible' | 'caution' | 'risky' = 'caution';

    if (priceVsSma === 'below' && trajectory === 'recovering') {
      // Best case: below SMA and recovering
      priceDisciplineVerdict = 'Sensible Entry';
      priceDisciplineInsight = 'The stock is trading below recent highs and showing signs of stabilizing. If the fundamentals hold, this could be a reasonable entry point.';
      priceDisciplineHighlight = 'reasonable entry point';
      priceDisciplineStrength = 'sensible';
    } else if (priceVsSma === 'below' && trajectory === 'drifting') {
      // Below SMA but still falling
      priceDisciplineVerdict = 'Risky Entry';
      priceDisciplineInsight = 'The stock is well below its highs, but the price trend is still drifting lower. This could signal ongoing weakness — check the story before buying the dip.';
      priceDisciplineHighlight = 'ongoing weakness';
      priceDisciplineStrength = 'risky';
    } else if (distanceFromHigh < 10) {
      // Near highs
      priceDisciplineVerdict = 'Euphoric Entry';
      priceDisciplineInsight = 'The stock is trading near recent highs. Consider waiting for a pullback unless conviction is high.';
      priceDisciplineHighlight = 'waiting for a pullback';
      priceDisciplineStrength = 'risky';
    } else {
      // Moderate case
      priceDisciplineVerdict = 'Neutral Entry';
      priceDisciplineInsight = 'The stock is at a moderate distance from its highs and trending above its long-term average. Entry timing is neither ideal nor risky.';
      priceDisciplineHighlight = 'moderate distance';
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
}

const valuationCache = new Map<string, { data: ValuationMetrics; timestamp: number }>();

export const alphaVantageService = new AlphaVantageService();