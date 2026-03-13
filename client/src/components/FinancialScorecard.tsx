import { cn } from "@/lib/utils";
import type { SignalStrength, QuadrantData } from "@/lib/quadrantData";

function getStrengthConfig(strength: SignalStrength) {
  switch (strength) {
    case "strong":
      return { dotColor: "bg-green-500", symbol: "✓", text: "text-green-700 dark:text-green-400" };
    case "mixed":
      return { dotColor: "bg-yellow-500", symbol: "!", text: "text-yellow-700 dark:text-yellow-400" };
    case "weak":
      return { dotColor: "bg-red-500", symbol: "✗", text: "text-red-700 dark:text-red-400" };
  }
}

function getVerdict(strongCount: number) {
  if (strongCount === 4) {
    return {
      summary: "Financially strong. Likely a solid foundation for a long-term investment.",
      tone: "positive" as const,
    };
  } else if (strongCount >= 2) {
    return {
      summary: "Mixed signals. Worth considering with caution or deeper conviction.",
      tone: "mixed" as const,
    };
  } else {
    return {
      summary: "Financial picture is weak. Unless you have strong conviction, this may not be the right fit.",
      tone: "negative" as const,
    };
  }
}

interface FinancialScorecardProps {
  quadrantData: QuadrantData[];
}

export function FinancialScorecard({ quadrantData }: FinancialScorecardProps) {
  const strongCount = quadrantData.filter(q => q.strength === "strong").length;
  const verdict = getVerdict(strongCount);

  const verdictDotColor =
    verdict.tone === "positive" ? "bg-green-500" :
    verdict.tone === "mixed" ? "bg-yellow-500" :
    "bg-red-500";

  return (
    <div className="mt-10 space-y-4" data-testid="financial-scorecard">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Financial Scorecard
        </h3>
        <span className="text-xs text-muted-foreground">— {strongCount} of 4 signals strong</span>
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
              data-testid={`signal-card-${quadrant.id}`}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold",
                config.dotColor
              )}>
                {config.symbol}
              </div>
              <span className="text-sm font-medium text-foreground flex-1">{quadrant.title}</span>
              <span className={cn("text-xs font-semibold", config.text)}>
                {quadrant.verdict}
              </span>
            </div>
          );
        })}

        <div
          className="flex items-start gap-3 px-4 py-3 border-t border-border/60"
          style={{ background: "color-mix(in srgb, var(--lp-teal-deep) 6%, transparent)" }}
          data-testid="verdict-block"
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
