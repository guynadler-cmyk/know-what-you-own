import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

export const SAMPLE_FINANCIAL_METRICS_AAPL: FinancialMetrics = {
  ticker: "AAPL",
  revenueGrowth: "growing",
  earningsGrowth: "growing",
  currentRevenue: "$416.16B",
  previousRevenue: "$391.04B",
  revenueChangePercent: 6.43,
  currentEarnings: "$112.01B",
  previousEarnings: "$93.74B",
  earningsChangePercent: 19.5,
  profitMarginPercent: 26.92,
  operatingMarginPercent: 31.97,
  interestCoverageRatio: 99,
  roicPercent: 169.03,
  bookValueGrowthPercent: 13.32,
  fiscalYear: "2025",
  previousFiscalYear: "2024",
};

export const SAMPLE_BALANCE_SHEET_METRICS_AAPL: BalanceSheetMetrics = {
  ticker: "AAPL",
  fiscalYear: "2025",
  previousFiscalYear: "2024",
  debtToEquityRatio: 1.37,
  checks: {
    liquidity: {
      status: "weak",
      title: "Can it cover its short-term needs?",
      summary: "It may struggle to meet short-term needs with current resources.",
      details:
        "The company has <strong>$147.96B</strong> in current assets and <strong>$165.63B</strong> in current liabilities.<br>Liabilities exceed assets — this could create pressure when bills come due.",
      numbers: "Current Assets: $147.96B | Current Liabilities: $165.63B",
    },
    debtBurden: {
      status: "caution",
      title: "Does it rely heavily on debt?",
      summary: "Debt is significantly higher than cash. This can limit flexibility in tougher times.",
      details:
        "The company owes <strong>$100.77B</strong> and holds <strong>$35.93B</strong> in cash.<br>That means debt is 2.8x larger than cash — a potential risk.<br>We flag this when debt is more than twice the cash on hand.",
      numbers: "Total Debt: $100.77B | Cash: $35.93B",
    },
    equityGrowth: {
      status: "strong",
      title: "Is owner value growing?",
      summary: "The company's net worth is growing — a positive sign.",
      details:
        "Shareholder equity grew from <strong>$56.95B</strong> to <strong>$73.73B</strong> (up 29.5%).<br>This shows the company is building owner value over time.",
      numbers: "Current Equity: $73.73B | Previous Equity: $56.95B",
    },
  },
};

export const SAMPLE_FINANCIAL_METRICS_GM: FinancialMetrics = {
  ticker: "GM",
  revenueGrowth: "declining",
  earningsGrowth: "declining",
  currentRevenue: "$185.02B",
  previousRevenue: "$187.44B",
  revenueChangePercent: -1.29,
  currentEarnings: "$2.70B",
  previousEarnings: "$6.01B",
  earningsChangePercent: -55.11,
  profitMarginPercent: 1.46,
  operatingMarginPercent: 1.57,
  interestCoverageRatio: 4,
  roicPercent: 2.86,
  bookValueGrowthPercent: -3.4,
  fiscalYear: "2025",
  previousFiscalYear: "2024",
};

export const SAMPLE_BALANCE_SHEET_METRICS_GM: BalanceSheetMetrics = {
  ticker: "GM",
  fiscalYear: "2025",
  previousFiscalYear: "2024",
  debtToEquityRatio: 2.13,
  checks: {
    liquidity: {
      status: "strong",
      title: "Can it cover its short-term needs?",
      summary: "The company has more short-term assets than obligations. Bills are covered.",
      details:
        "The company has <strong>$108.77B</strong> in current assets and <strong>$93.34B</strong> in current liabilities.<br>Assets exceed liabilities — a healthy position for meeting near-term obligations.",
      numbers: "Current Assets: $108.77B | Current Liabilities: $93.34B",
    },
    debtBurden: {
      status: "caution",
      title: "Does it rely heavily on debt?",
      summary: "Debt is significantly higher than cash. This can limit flexibility in tougher times.",
      details:
        "The company owes <strong>$130.28B</strong> and holds <strong>$20.95B</strong> in cash.<br>That means debt is 6.2x larger than cash — a potential risk.<br>We flag this when debt is more than twice the cash on hand.",
      numbers: "Total Debt: $130.28B | Cash: $20.95B",
    },
    equityGrowth: {
      status: "caution",
      title: "Is owner value growing?",
      summary: "Owner value is declining. Look deeper into what's causing it.",
      details:
        "Shareholder equity declined from <strong>$63.07B</strong> to <strong>$61.12B</strong> (down 3.1%).<br>This decline warrants further investigation into the underlying causes.",
      numbers: "Current Equity: $61.12B | Previous Equity: $63.07B",
    },
  },
};

export const SAMPLE_FINANCIAL_METRICS_MU: FinancialMetrics = {
  ticker: "MU",
  revenueGrowth: "growing",
  earningsGrowth: "growing",
  currentRevenue: "$37.38B",
  previousRevenue: "$25.11B",
  revenueChangePercent: 48.85,
  currentEarnings: "$8.54B",
  previousEarnings: "$778.00M",
  earningsChangePercent: 997.56,
  profitMarginPercent: 22.84,
  operatingMarginPercent: 26.41,
  interestCoverageRatio: 20.69,
  fiscalYear: "2025",
  previousFiscalYear: "2024",
};

export const SAMPLE_BALANCE_SHEET_METRICS_MU: BalanceSheetMetrics = {
  ticker: "MU",
  fiscalYear: "2025",
  previousFiscalYear: "2024",
  debtToEquityRatio: 0.22,
  checks: {
    liquidity: {
      status: "strong",
      title: "Can it cover its short-term needs?",
      summary: "The company has more short-term assets than obligations. Bills are covered.",
      details:
        "The company has <strong>$28.84B</strong> in current assets and <strong>$11.45B</strong> in current liabilities.<br>Assets exceed liabilities — a healthy position for meeting near-term obligations.",
      numbers: "Current Assets: $28.84B | Current Liabilities: $11.45B",
    },
    debtBurden: {
      status: "strong",
      title: "Does it rely heavily on debt?",
      summary: "Debt is in a manageable range relative to cash.",
      details:
        "The company owes <strong>$12.17B</strong> and holds <strong>$9.64B</strong> in cash.<br>Debt levels appear manageable given the cash position.",
      numbers: "Total Debt: $12.17B | Cash: $9.64B",
    },
    equityGrowth: {
      status: "strong",
      title: "Is owner value growing?",
      summary: "The company's net worth is growing — a positive sign.",
      details:
        "Shareholder equity grew from <strong>$45.13B</strong> to <strong>$54.16B</strong> (up 20.0%).<br>This shows the company is building owner value over time.",
      numbers: "Current Equity: $54.16B | Previous Equity: $45.13B",
    },
  },
};

export const SAMPLE_FINANCIAL_METRICS = SAMPLE_FINANCIAL_METRICS_AAPL;
export const SAMPLE_BALANCE_SHEET_METRICS = SAMPLE_BALANCE_SHEET_METRICS_AAPL;
