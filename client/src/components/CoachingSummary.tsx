import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Brain, TrendingUp, HelpCircle, CircleDot, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { ValuationQuadrantData, ValuationSignalStrength } from "./ValuationExplorer";

interface CoachingSummaryProps {
  quadrantData: ValuationQuadrantData[];
  ticker: string;
  companyName?: string;
}

type SignalCategory = "green" | "yellow" | "red";

function strengthToCategory(strength: ValuationSignalStrength): SignalCategory {
  switch (strength) {
    case "sensible": return "green";
    case "caution": return "yellow";
    case "risky": return "red";
  }
}

function getCategoryLabel(strength: ValuationSignalStrength): string {
  switch (strength) {
    case "sensible": return "Sensible";
    case "caution": return "Caution";
    case "risky": return "Risky";
  }
}

function getTrafficLightIcon(category: SignalCategory) {
  switch (category) {
    case "green": return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "yellow": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case "red": return <XCircle className="w-5 h-5 text-red-500" />;
  }
}

function getPriceDisciplineData(quadrant: ValuationQuadrantData) {
  const distanceSignal = quadrant.signals[0];
  const trendSignal = quadrant.signals[1];
  
  const distanceValue = distanceSignal?.value || "unknown";
  const trendValue = trendSignal?.value || "stable";
  
  return {
    distance: distanceValue,
    trend: trendValue,
    strength: quadrant.strength,
  };
}

function generatePlainEnglishSummary(
  quadrants: ValuationQuadrantData[],
  ticker: string
): string {
  const priceDiscipline = quadrants.find(q => q.id === "price-discipline");
  const valuationCheck = quadrants.find(q => q.id === "valuation-check");
  const capitalDiscipline = quadrants.find(q => q.id === "capital-discipline");
  const doublingPotential = quadrants.find(q => q.id === "doubling-potential");

  const greenCount = quadrants.filter(q => q.strength === "sensible").length;
  const yellowCount = quadrants.filter(q => q.strength === "caution").length;
  const redCount = quadrants.filter(q => q.strength === "risky").length;

  if (redCount >= 3) {
    return `${ticker} is showing multiple warning signs right now. Like a house with foundation issues, the numbers suggest waiting for conditions to improve before considering a purchase.`;
  }
  
  if (redCount >= 2) {
    return `${ticker} has some concerning signals mixed with a few positives. Think of it like a car that runs well but has some mechanical issues — worth watching, but not an obvious buy today.`;
  }
  
  if (greenCount >= 3) {
    return `${ticker} is checking most of the boxes right now. The price looks reasonable, the business is healthy, and the growth story makes sense. This could be worth a closer look.`;
  }
  
  if (yellowCount >= 2 && redCount === 0) {
    return `${ticker} sits in a gray area — not obviously cheap, but not overpriced either. Like a sale that's "good but not great," it might make sense if you already like the business.`;
  }
  
  if (priceDiscipline?.strength === "risky" && valuationCheck?.strength === "risky") {
    return `${ticker} appears expensive by most measures. The market is paying a premium, which means expectations are high. If those expectations aren't met, the stock could fall significantly.`;
  }
  
  if (capitalDiscipline?.strength === "sensible" && doublingPotential?.strength === "sensible") {
    return `${ticker} is running a tight ship — strong returns on capital and realistic growth potential. Whether the current price is right depends on your time horizon.`;
  }

  return `${ticker} shows a mixed picture. Some signals are encouraging, others less so. Like any investment, it's worth understanding both the strengths and the risks before deciding.`;
}

function generateWhereItStands(quadrant: ValuationQuadrantData): {
  distance: string;
  trend: string;
  meaning: string;
} {
  const priceData = getPriceDisciplineData(quadrant);
  
  let meaning = "";
  
  if (priceData.strength === "sensible") {
    meaning = "The stock has pulled back from its highs, which means you're not buying at peak excitement. That's often a good thing.";
  } else if (priceData.strength === "caution") {
    meaning = "The stock is somewhere in the middle — not at a big discount, but not at extreme highs either. Patience might pay off.";
  } else {
    meaning = "The stock is trading close to its recent peak, meaning expectations are high. There's less room for error at these levels.";
  }
  
  return {
    distance: priceData.distance,
    trend: priceData.trend,
    meaning,
  };
}

function generateShouldYouJumpIn(quadrants: ValuationQuadrantData[]): string {
  const greenCount = quadrants.filter(q => q.strength === "sensible").length;
  const redCount = quadrants.filter(q => q.strength === "risky").length;
  
  if (greenCount >= 3) {
    return "The numbers look favorable. If you've done your homework on the business and believe in its future, this could be a reasonable time to consider adding shares. Just remember: no investment is risk-free.";
  }
  
  if (redCount >= 2) {
    return "Right now, the data suggests waiting. The price might be too high, or the business fundamentals might be weakening. Sometimes the best investment decision is patience.";
  }
  
  if (greenCount === 2 && redCount === 0) {
    return "The signals are mostly positive, but there's still some uncertainty. If you're comfortable with a bit of ambiguity and have a long-term view, it could be worth exploring further.";
  }
  
  return "This is a judgment call. The signals are mixed, so it really depends on your conviction about the business. If you're unsure, there's no harm in waiting for more clarity.";
}

function getOverallTone(quadrants: ValuationQuadrantData[]): "cautious" | "neutral" | "encouraging" {
  const greenCount = quadrants.filter(q => q.strength === "sensible").length;
  const redCount = quadrants.filter(q => q.strength === "risky").length;
  
  if (redCount >= 2) return "cautious";
  if (greenCount >= 3) return "encouraging";
  return "neutral";
}

export function CoachingSummary({ quadrantData, ticker, companyName }: CoachingSummaryProps) {
  if (!quadrantData || quadrantData.length === 0) {
    return null;
  }

  const priceDiscipline = quadrantData.find(q => q.id === "price-discipline");
  const whereItStands = priceDiscipline ? generateWhereItStands(priceDiscipline) : null;
  
  const greenCount = quadrantData.filter(q => q.strength === "sensible").length;
  const yellowCount = quadrantData.filter(q => q.strength === "caution").length;
  const redCount = quadrantData.filter(q => q.strength === "risky").length;
  
  const tone = getOverallTone(quadrantData);
  
  const toneStyles = {
    cautious: "border-red-500/20 bg-red-500/5",
    neutral: "border-yellow-500/20 bg-yellow-500/5",
    encouraging: "border-green-500/20 bg-green-500/5",
  };

  const displayName = companyName || ticker;

  return (
    <Card 
      className={cn(
        "p-6 mb-6 border-2",
        toneStyles[tone]
      )}
      data-testid="coaching-summary"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" data-testid="coaching-summary-title">
            <Brain className="w-5 h-5 text-primary" />
            <span>Plain-English Summary</span>
          </h3>
          <p className="text-muted-foreground leading-relaxed" data-testid="coaching-summary-text">
            {generatePlainEnglishSummary(quadrantData, displayName)}
          </p>
        </div>

        {whereItStands && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" data-testid="coaching-where-it-stands-title">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Where It Stands</span>
            </h3>
            <ul className="space-y-2 text-muted-foreground" data-testid="coaching-where-it-stands-list">
              <li className="flex items-start gap-2">
                <span className="text-foreground font-medium shrink-0">Current price:</span>
                <span>{whereItStands.distance} below its recent high</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-medium shrink-0">Trend:</span>
                <span>{whereItStands.trend}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground font-medium shrink-0">What this means:</span>
                <span>{whereItStands.meaning}</span>
              </li>
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" data-testid="coaching-jump-in-title">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span>Should You Jump In?</span>
          </h3>
          <p className="text-muted-foreground leading-relaxed" data-testid="coaching-jump-in-text">
            {generateShouldYouJumpIn(quadrantData)}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" data-testid="coaching-traffic-light-title">
            <CircleDot className="w-5 h-5 text-primary" />
            <span>Traffic Light Score</span>
          </h3>
          <div className="flex flex-wrap items-center gap-4" data-testid="coaching-traffic-light-scores">
            {greenCount > 0 && (
              <div className="flex items-center gap-2">
                {getTrafficLightIcon("green")}
                <span className="text-sm">
                  <span className="font-semibold text-green-600 dark:text-green-400">{greenCount}</span>
                  <span className="text-muted-foreground ml-1">green light{greenCount !== 1 ? 's' : ''}</span>
                </span>
              </div>
            )}
            {yellowCount > 0 && (
              <div className="flex items-center gap-2">
                {getTrafficLightIcon("yellow")}
                <span className="text-sm">
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{yellowCount}</span>
                  <span className="text-muted-foreground ml-1">yellow light{yellowCount !== 1 ? 's' : ''}</span>
                </span>
              </div>
            )}
            {redCount > 0 && (
              <div className="flex items-center gap-2">
                {getTrafficLightIcon("red")}
                <span className="text-sm">
                  <span className="font-semibold text-red-600 dark:text-red-400">{redCount}</span>
                  <span className="text-muted-foreground ml-1">red light{redCount !== 1 ? 's' : ''}</span>
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-3" data-testid="coaching-traffic-light-summary">
            {greenCount >= 3 
              ? "Most signals are pointing in a positive direction. That's encouraging, but always do your own research."
              : redCount >= 2
                ? "Multiple caution signs are flashing. This doesn't mean it's a bad company, just that conditions may not be ideal for buying right now."
                : "A mix of signals — some positive, some uncertain. Take your time to understand the full picture."
            }
          </p>
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex flex-wrap gap-3" data-testid="coaching-quadrant-summary">
            {quadrantData.map((q) => (
              <div 
                key={q.id}
                className="flex items-center gap-2 text-sm"
                data-testid={`coaching-quadrant-${q.id}`}
              >
                {getTrafficLightIcon(strengthToCategory(q.strength))}
                <span className="text-muted-foreground">{q.title}:</span>
                <span className={cn(
                  "font-medium",
                  q.strength === "sensible" && "text-green-600 dark:text-green-400",
                  q.strength === "caution" && "text-yellow-600 dark:text-yellow-400",
                  q.strength === "risky" && "text-red-600 dark:text-red-400"
                )}>
                  {getCategoryLabel(q.strength)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
