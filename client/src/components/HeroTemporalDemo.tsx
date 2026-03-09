import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TemporalAnalysis } from "@/components/TemporalAnalysis";
import { ArrowRight } from "lucide-react";

const DEMO_TICKERS = ["PLTR", "CRM", "F"] as const;
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
      data-testid={`hero-temporal-ticker-btn-${ticker}`}
      className={`px-4 py-1.5 rounded-md text-sm font-medium font-mono transition-colors border ${
        selected
          ? "text-white border-[var(--lp-teal-deep)]"
          : "bg-background border-[var(--lp-border)] hover:border-[var(--lp-teal-brand)]"
      }`}
      style={selected ? { background: "var(--lp-teal-deep)", color: "white" } : { color: "var(--lp-ink-light)" }}
    >
      {ticker}
    </button>
  );
}

function TemporalSkeleton() {
  return (
    <div className="border rounded-lg bg-card animate-pulse">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="h-7 w-48 bg-muted rounded" />
        </div>
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="space-y-3 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroTemporalDemo() {
  const [selected, setSelected] = useState<DemoTicker>("CRM");

  const pltrQuery = useTickerAnalysis("PLTR");
  const crmQuery = useTickerAnalysis("CRM");
  const fordQuery = useTickerAnalysis("F");

  const queryMap: Record<DemoTicker, typeof pltrQuery> = {
    PLTR: pltrQuery,
    CRM: crmQuery,
    F: fordQuery,
  };

  const activeQuery = queryMap[selected];
  const data = activeQuery.data;
  const isLoading = !data;
  const hasTemporalData = data?.temporalAnalysis != null;

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-temporal-demo">
      <div className="flex flex-col items-center text-center w-full mb-6">
        <div className="flex items-center gap-3" data-testid="hero-temporal-ticker-toggle">
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

      {isLoading ? (
        <TemporalSkeleton />
      ) : hasTemporalData ? (
        <TemporalAnalysis
          analysis={data.temporalAnalysis}
          companyName={data.companyName}
        />
      ) : (
        <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
          Temporal analysis not available for this company yet.
        </div>
      )}

      <div className="flex justify-center mt-6">
        <Link href={`/stocks/${selected}`}>
          <span
            className="inline-flex items-center gap-1.5 text-base text-primary font-medium hover:underline"
            data-testid={`hero-temporal-link-${selected}`}
          >
            See {selected}'s full analysis
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
