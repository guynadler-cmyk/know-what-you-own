import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CompanySummary } from "@shared/schema";

interface SampleAnalysisCardProps {
  ticker: string;
}

type SignalColor = "green" | "yellow" | "red" | "blue" | "purple";
interface Signal {
  label: string;
  value: string;
  color: SignalColor;
}

function deriveSignals(data: CompanySummary): {
  statusLabel: string;
  statusColor: string;
  signals: Signal[];
  healthScore: number;
} {
  const themes = data.investmentThemes ?? [];
  const moats = data.moats ?? [];
  const market = data.marketOpportunity ?? [];
  const value = data.valueCreation ?? [];

  const highCount = (arr: { emphasis: string }[]) => arr.filter(x => x.emphasis === "high").length;
  const hasHigh = (arr: { emphasis: string }[]) => highCount(arr) > 0;

  const healthScore = [themes, moats, market, value].filter(hasHigh).length;
  const totalHighs = highCount(themes) + highCount(value);

  // Growth Quality from themes + value creation
  let growthLabel: string;
  let growthColor: SignalColor;
  if (totalHighs >= 4) { growthLabel = "Scalable Growth"; growthColor = "green"; }
  else if (totalHighs >= 2) { growthLabel = "Solid Growth"; growthColor = "green"; }
  else if (totalHighs >= 1) { growthLabel = "Moderate Growth"; growthColor = "yellow"; }
  else { growthLabel = "Limited Signals"; growthColor = "yellow"; }

  // Price Trend from temporal analysis
  let trendLabel: string;
  let trendColor: SignalColor;
  if (data.temporalAnalysis) {
    const newS = data.temporalAnalysis.newAndSustained.length;
    const disc = data.temporalAnalysis.discontinued.length;
    const newP = data.temporalAnalysis.newProducts.length;
    if (newS + newP > disc + 1) { trendLabel = "Strengthening"; trendColor = "green"; }
    else if (disc > newS + newP) { trendLabel = "Mixed Signals"; trendColor = "yellow"; }
    else { trendLabel = "Stable"; trendColor = "blue"; }
  } else {
    trendLabel = "Stable"; trendColor = "blue";
  }

  // RSI Stretch from moats
  const highMoats = highCount(moats);
  let moatLabel: string;
  let moatColor: SignalColor;
  if (highMoats >= 2) { moatLabel = "Deep Moat"; moatColor = "green"; }
  else if (highMoats === 1) { moatLabel = "Competitive Edge"; moatColor = "blue"; }
  else if (moats.some(m => m.emphasis === "medium")) { moatLabel = "Developing"; moatColor = "yellow"; }
  else { moatLabel = "Exposed"; moatColor = "red"; }

  // Status badge
  let statusLabel: string;
  let statusColor: string;
  if (healthScore === 4) { statusLabel = "Signals Aligned"; statusColor = "aligned"; }
  else if (healthScore === 3) { statusLabel = "Looking Solid"; statusColor = "aligned"; }
  else if (healthScore === 2) { statusLabel = "Monitor Closely"; statusColor = "caution"; }
  else { statusLabel = "Patience Warranted"; statusColor = "watch"; }

  return {
    statusLabel,
    statusColor,
    healthScore,
    signals: [
      { label: "Growth Quality", value: growthLabel, color: growthColor },
      { label: "Price Trend", value: trendLabel, color: trendColor },
      { label: "Moat Strength", value: moatLabel, color: moatColor },
    ],
  };
}

const signalColorStyles: Record<SignalColor, string> = {
  green:  "bg-[rgba(34,197,94,0.08)]  text-[#16a34a]",
  yellow: "bg-[rgba(201,168,76,0.08)] text-[#ca8a04]",
  blue:   "bg-[rgba(59,130,246,0.08)] text-[#2563eb]",
  purple: "bg-[rgba(139,92,246,0.08)] text-[#7c3aed]",
  red:    "bg-[rgba(239,68,68,0.08)]  text-[#dc2626]",
};

const statusBadgeStyles: Record<string, string> = {
  aligned: "bg-[rgba(40,200,64,0.18)] text-[#7ef08a] border border-[rgba(40,200,64,0.25)]",
  caution: "bg-[rgba(201,168,76,0.2)] text-[#f5d77e] border border-[rgba(201,168,76,0.3)]",
  watch:   "bg-[rgba(99,102,241,0.2)] text-[#c4b5fd] border border-[rgba(99,102,241,0.3)]",
};

function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: "rgba(42,140,133,0.12)", boxShadow: "0 2px 20px rgba(13,74,71,0.07)" }}
    >
      <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ background: "var(--lp-teal-deep)" }}>
        <div className="w-6 h-6 rounded-md bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <div className="h-2.5 bg-white/10 rounded w-3/4" />
          <div className="h-2 bg-white/10 rounded w-1/3" />
        </div>
      </div>
      <div className="bg-white p-3.5 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 rounded-md bg-[#faf8f4] border border-[rgba(42,140,133,0.12)] animate-pulse" />
        ))}
        <div className="h-px bg-[rgba(42,140,133,0.12)] mt-2" />
        <div className="flex justify-between pt-1">
          <div className="h-2 bg-[#faf8f4] rounded w-24 animate-pulse" />
          <div className="h-2 bg-[#faf8f4] rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function SampleAnalysisCard({ ticker }: SampleAnalysisCardProps) {
  const { data, isLoading, isError } = useQuery<CompanySummary>({
    queryKey: ['/api/analyze', ticker],
    queryFn: async () => {
      const res = await fetch(`/api/analyze/${ticker}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  if (isLoading) return <SkeletonCard />;
  if (isError || !data) return null;

  const { statusLabel, statusColor, healthScore, signals } = deriveSignals(data);
  const initial = (data.companyName || ticker).charAt(0).toUpperCase();

  return (
    <Link href={`/stocks/${ticker}`}>
      <div
        className="rounded-xl overflow-hidden border cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
        style={{
          borderColor: "rgba(42,140,133,0.12)",
          boxShadow: "0 2px 20px rgba(13,74,71,0.07)",
          background: "white",
        }}
        data-testid={`sample-card-${ticker.toLowerCase()}`}
      >
        {/* dark teal header */}
        <div
          className="px-3.5 py-2.5 flex items-center justify-between"
          style={{ background: "var(--lp-teal-deep)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-[22px] h-[22px] rounded-md flex items-center justify-center flex-shrink-0 font-mono text-[9px] font-bold text-white"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
              data-testid={`card-logo-${ticker.toLowerCase()}`}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white leading-tight truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {data.companyName}
              </p>
              <p className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {ticker}
              </p>
            </div>
          </div>
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${statusBadgeStyles[statusColor]}`}>
            {statusLabel}
          </span>
        </div>

        {/* body */}
        <div className="p-3.5">
          <div className="flex flex-col gap-1.5 mb-3">
            {signals.map((sig) => (
              <div
                key={sig.label}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md border"
                style={{ background: "var(--lp-cream)", borderColor: "rgba(42,140,133,0.12)" }}
              >
                <span className="text-[10px]" style={{ color: "var(--lp-ink-mid)" }}>{sig.label}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${signalColorStyles[sig.color]}`}>
                  {sig.value}
                </span>
              </div>
            ))}
          </div>

          {/* footer */}
          <div
            className="flex items-center justify-between pt-2.5 border-t"
            style={{ borderColor: "rgba(42,140,133,0.12)" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-4 h-0.5 rounded-sm"
                    style={{
                      background: i < healthScore
                        ? (i === healthScore - 1 && healthScore < 4 ? "#c9a84c" : "var(--lp-teal-brand)")
                        : "rgba(42,140,133,0.12)"
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px]" style={{ color: "var(--lp-ink-ghost)" }}>
                {healthScore}/4 signals
              </span>
            </div>
            <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: "var(--lp-teal-brand)" }}>
              View analysis →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
