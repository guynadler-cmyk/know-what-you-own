import { cn } from "@/lib/utils";
import type { ValuationSignalStrength, ValuationQuadrantData } from "./ValuationExplorer";

function getStrengthConfig(strength: ValuationSignalStrength) {
  switch (strength) {
    case "sensible":
      return { dotColor: "bg-green-500", symbol: "✓", label: "Sensible", text: "text-green-700 dark:text-green-400" };
    case "caution":
      return { dotColor: "bg-yellow-500", symbol: "!", label: "Caution", text: "text-yellow-700 dark:text-yellow-400" };
    case "risky":
      return { dotColor: "bg-red-500", symbol: "✗", label: "Risky", text: "text-red-700 dark:text-red-400" };
  }
}

function getVerdict(sensibleCount: number) {
  if (sensibleCount === 4) {
    return {
      summary: "All valuation signals look sensible. This doesn't guarantee returns, but you're not obviously overpaying. Stay patient and stick to your plan.",
      tone: "positive" as const,
    };
  } else if (sensibleCount >= 2) {
    return {
      summary: "Mixed signals. The valuation looks reasonable in some areas, but a few signals are worth a closer look. Ask yourself if the story is still worth the price.",
      tone: "mixed" as const,
    };
  } else {
    return {
      summary: "Multiple valuation signals suggest caution. Even great businesses can become bad investments if you overpay. Consider waiting for a better entry point.",
      tone: "negative" as const,
    };
  }
}

interface ValuationScorecardProps {
  quadrantData: ValuationQuadrantData[];
}

export function ValuationScorecard({ quadrantData }: ValuationScorecardProps) {
  const sensibleCount = quadrantData.filter(q => q.strength === "sensible").length;
  const verdict = getVerdict(sensibleCount);

  const verdictDotColor =
    verdict.tone === "positive" ? "bg-green-500" :
    verdict.tone === "mixed" ? "bg-yellow-500" :
    "bg-red-500";

  return (
    <div className="mt-10 space-y-4" data-testid="valuation-scorecard">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Valuation Scorecard
        </h3>
        <span className="text-xs text-muted-foreground">— {sensibleCount} of 4 signals sensible</span>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        {quadrantData.map((quadrant, idx) => {
          const config = getStrengthConfig(quadrant.strength);
          return (
            <div
              key={quadrant.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 bg-card",
                idx < quadrantData.length - 1 && "border-b border-border/60"
              )}
              data-testid={`valuation-signal-card-${quadrant.id}`}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold",
                config.dotColor
              )}>
                {config.symbol}
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{quadrant.title}</span>
              <span className={cn("text-xs font-semibold", config.text)}>
                {config.label}
              </span>
            </div>
          );
        })}

        <div
          className="flex items-start gap-3 px-4 py-3 border-t border-border/60"
          style={{ background: "color-mix(in srgb, var(--lp-teal-deep) 6%, transparent)" }}
          data-testid="valuation-verdict-block"
        >
          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1", verdictDotColor)} />
          <p className="text-sm text-foreground leading-relaxed">
            {verdict.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
