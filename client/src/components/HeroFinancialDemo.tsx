import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuadrantExplorer, generateQuadrantData } from "@/components/QuadrantExplorer";
import { FinancialScorecard } from "@/components/FinancialScorecard";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ArrowRight } from "lucide-react";
import {
  SAMPLE_FINANCIAL_METRICS_AAPL,
  SAMPLE_BALANCE_SHEET_METRICS_AAPL,
  SAMPLE_FINANCIAL_METRICS_GM,
  SAMPLE_BALANCE_SHEET_METRICS_GM,
  SAMPLE_FINANCIAL_METRICS_MU,
  SAMPLE_BALANCE_SHEET_METRICS_MU,
} from "@/data/sampleFinancialData";
import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

const DEMO_TICKERS = ["AAPL", "GM", "MU"] as const;
type DemoTicker = (typeof DEMO_TICKERS)[number];

interface CompanyData {
  metrics: FinancialMetrics;
  balance: BalanceSheetMetrics;
  companyName: string;
  homepage: string;
}

const FINANCIAL_DATA: Record<DemoTicker, CompanyData> = {
  AAPL: {
    metrics: SAMPLE_FINANCIAL_METRICS_AAPL,
    balance: SAMPLE_BALANCE_SHEET_METRICS_AAPL,
    companyName: "Apple Inc",
    homepage: "https://www.apple.com",
  },
  GM: {
    metrics: SAMPLE_FINANCIAL_METRICS_GM,
    balance: SAMPLE_BALANCE_SHEET_METRICS_GM,
    companyName: "General Motors",
    homepage: "https://www.gm.com",
  },
  MU: {
    metrics: SAMPLE_FINANCIAL_METRICS_MU,
    balance: SAMPLE_BALANCE_SHEET_METRICS_MU,
    companyName: "Micron Technology",
    homepage: "https://www.micron.com",
  },
};

function TickerButton({
  ticker,
  selected,
  onClick,
}: {
  ticker: DemoTicker;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={`hero-financial-ticker-btn-${ticker}`}
      className={`px-6 py-2 rounded-full text-base font-semibold transition-colors border ${
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
          : "bg-background text-foreground border-border hover:border-primary/50"
      }`}
    >
      {ticker}
    </button>
  );
}

export function HeroFinancialDemo() {
  const [selected, setSelected] = useState<DemoTicker>("AAPL");
  const { metrics, balance, companyName, homepage } = FINANCIAL_DATA[selected];

  const quadrantData = useMemo(
    () => generateQuadrantData(metrics, balance),
    [metrics, balance]
  );

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-financial-demo">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3" data-testid="hero-financial-ticker-toggle">
          {DEMO_TICKERS.map((ticker) => (
            <TickerButton
              key={ticker}
              ticker={ticker}
              selected={selected === ticker}
              onClick={() => setSelected(ticker)}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <CompanyLogo
              homepage={homepage}
              companyName={companyName}
              ticker={selected}
              size="md"
            />
            <div className="text-left">
              <h2 className="text-2xl font-bold">{companyName}</h2>
              <p className="text-sm text-muted-foreground">{selected}</p>
            </div>
          </div>
          <CardTitle className="text-2xl">Understand Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <QuadrantExplorer
            financialMetrics={metrics}
            balanceSheetMetrics={balance}
          />
          <FinancialScorecard quadrantData={quadrantData} />
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 mt-6" data-testid="hero-financial-sample-label">
        <Link href={`/stocks/${selected}`}>
          <span
            className="inline-flex items-center gap-1.5 text-base text-primary font-medium hover:underline"
            data-testid={`hero-financial-link-${selected}`}
          >
            See {selected}'s full analysis
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
        <p className="text-base text-muted-foreground font-medium">
          This is a sample analysis.{" "}
          <Link href="/app">
            <span className="text-primary hover:underline cursor-pointer font-medium">
              Run your own for real-time data →
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
