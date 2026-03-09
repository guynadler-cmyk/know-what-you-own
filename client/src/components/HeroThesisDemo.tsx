import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { InvestmentThesisCard } from "@/components/InvestmentThesisCard";
import { ArrowRight } from "lucide-react";

const DEMO_TICKERS = ["AAPL", "NVDA", "MSFT"] as const;
type DemoTicker = (typeof DEMO_TICKERS)[number];

function useTickerAnalysis(ticker: DemoTicker) {
  return useQuery<any>({
    queryKey: [`/api/analyze/${ticker}`],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}

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
      data-testid={`hero-ticker-btn-${ticker}`}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors border ${
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-border hover:border-primary/50"
      }`}
    >
      {ticker}
    </button>
  );
}

function ThesisSkeleton() {
  return (
    <div className="border-2 border-primary/20 rounded-2xl bg-primary/5 animate-pulse">
      <div className="bg-primary/30 px-8 py-4 rounded-t-2xl">
        <div className="h-7 w-48 bg-primary/20 rounded mx-auto" />
      </div>
      <div className="p-8 sm:p-12 space-y-8">
        <div className="flex justify-end gap-4">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-7 w-24 bg-muted rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroThesisDemo() {
  const [selected, setSelected] = useState<DemoTicker>("AAPL");

  const aaplQuery = useTickerAnalysis("AAPL");
  const nvdaQuery = useTickerAnalysis("NVDA");
  const msftQuery = useTickerAnalysis("MSFT");

  const queryMap: Record<DemoTicker, typeof aaplQuery> = {
    AAPL: aaplQuery,
    NVDA: nvdaQuery,
    MSFT: msftQuery,
  };

  const activeQuery = queryMap[selected];
  const data = activeQuery.data;
  const isLoading = !data;

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-thesis-demo">
      {/* Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Live from our analysis engine
      </p>

      {/* Ticker Toggle */}
      <div className="flex items-center justify-center gap-2 mb-6" data-testid="hero-ticker-toggle">
        {DEMO_TICKERS.map((ticker) => (
          <TickerButton
            key={ticker}
            ticker={ticker}
            selected={selected === ticker}
            onClick={() => setSelected(ticker)}
          />
        ))}
      </div>

      {/* Card */}
      {isLoading ? (
        <ThesisSkeleton />
      ) : (
        <InvestmentThesisCard
          investmentThesis={data.investmentThesis || ""}
          investmentThemes={data.investmentThemes || []}
          moats={data.moats || []}
          marketOpportunity={data.marketOpportunity || []}
          valueCreation={data.valueCreation || []}
        />
      )}

      {/* Deep link */}
      <div className="flex justify-center mt-5">
        <Link href={`/stocks/${selected}`}>
          <span
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
            data-testid={`hero-link-full-analysis-${selected}`}
          >
            See {selected}'s full analysis
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
