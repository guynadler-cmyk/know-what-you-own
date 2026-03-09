import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

export const SAMPLE_FINANCIAL_METRICS: FinancialMetrics = {
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

export const SAMPLE_BALANCE_SHEET_METRICS: BalanceSheetMetrics = {
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
