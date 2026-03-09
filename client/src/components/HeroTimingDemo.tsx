import { useState } from "react";
import { Link } from "wouter";
import { TimingStage } from "@/components/TimingStage";
import { ArrowRight } from "lucide-react";
import {
  SAMPLE_TIMING_DATA_AAPL,
  SAMPLE_TIMING_DATA_GM,
  SAMPLE_TIMING_DATA_MU,
} from "@/data/sampleTimingData";
import type { TimingAnalysis } from "@shared/schema";

const DEMO_TICKERS = ["AAPL", "GM", "MU"] as const;
type DemoTicker = (typeof DEMO_TICKERS)[number];

interface TimingCompanyData {
  data: TimingAnalysis;
  companyName: string;
  homepage: string;
}

const TIMING_DATA: Record<DemoTicker, TimingCompanyData> = {
  AAPL: {
    data: SAMPLE_TIMING_DATA_AAPL,
    companyName: "Apple Inc",
    homepage: "https://www.apple.com",
  },
  GM: {
    data: SAMPLE_TIMING_DATA_GM,
    companyName: "General Motors",
    homepage: "https://www.gm.com",
  },
  MU: {
    data: SAMPLE_TIMING_DATA_MU,
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
      data-testid={`hero-timing-ticker-btn-${ticker}`}
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

export function HeroTimingDemo() {
  const [selected, setSelected] = useState<DemoTicker>("AAPL");
  const { data, companyName, homepage } = TIMING_DATA[selected];

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-timing-demo">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3" data-testid="hero-timing-ticker-toggle">
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

      <TimingStage
        ticker=""
        companyName={companyName}
        homepage={homepage}
        placeholderData={data}
      />

      <div className="flex flex-col items-center gap-2 mt-6" data-testid="hero-timing-sample-label">
        <Link href={`/stocks/${selected}`}>
          <span
            className="inline-flex items-center gap-1.5 text-base text-primary font-medium hover:underline"
            data-testid={`hero-timing-link-${selected}`}
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
