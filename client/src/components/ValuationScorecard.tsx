import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { ValuationSignalStrength, ValuationQuadrantData } from "./ValuationExplorer";

function getStrengthStyles(strength: ValuationSignalStrength) {
  switch (strength) {
    case "sensible":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle,
        border: "border-green-500/20",
        label: "Sensible",
      };
    case "caution":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
        border: "border-yellow-500/20",
        label: "Caution",
      };
    case "risky":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
        border: "border-red-500/20",
        label: "Risky",
      };
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

function ProgressBar({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex gap-1.5 w-full max-w-xs">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "h-2 flex-1 rounded-full transition-colors",
            idx < count
              ? "bg-green-500"
              : "bg-neutral-200 dark:bg-neutral-700"
          )}
          data-testid={`valuation-progress-segment-${idx}`}
        />
      ))}
    </div>
  );
}

interface SignalCardProps {
  id: string;
  title: string;
  verdict: string;
  strength: ValuationSignalStrength;
}

function SignalCard({ id, title, verdict, strength }: SignalCardProps) {
  const styles = getStrengthStyles(strength);
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        styles.bg,
        styles.border
      )}
      data-testid={`valuation-signal-card-${id}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className={cn("flex items-center gap-2", styles.text)}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{styles.label}</span>
        </div>
      </div>
    </div>
  );
}

interface ValuationScorecardProps {
  quadrantData: ValuationQuadrantData[];
}

export function ValuationScorecard({ quadrantData }: ValuationScorecardProps) {
  const sensibleCount = quadrantData.filter(q => q.strength === "sensible").length;
  const verdict = getVerdict(sensibleCount);

  return (
    <div className="mt-10 space-y-6" data-testid="valuation-scorecard">
      <Card className="bg-neutral-50 dark:bg-neutral-900/50 border-border/60">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" data-testid="valuation-score-title">
                  Valuation Score: {sensibleCount} of 4 signals sensible
                </h3>
              </div>
            </div>
            <ProgressBar count={sensibleCount} total={4} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quadrantData.map((quadrant) => (
              <SignalCard
                key={quadrant.id}
                id={quadrant.id}
                title={quadrant.title}
                verdict={quadrant.verdict}
                strength={quadrant.strength}
              />
            ))}
          </div>

          <div
            className={cn(
              "p-5 rounded-xl",
              verdict.tone === "positive" && "bg-green-500/5 border border-green-500/20",
              verdict.tone === "mixed" && "bg-yellow-500/5 border border-yellow-500/20",
              verdict.tone === "negative" && "bg-red-500/5 border border-red-500/20"
            )}
            data-testid="valuation-verdict-block"
          >
            <p className="text-foreground leading-relaxed font-medium">
              {verdict.summary}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
