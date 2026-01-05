import { useState } from "react";
import { cn } from "@/lib/utils";
import { Compass, ChevronDown, ChevronUp } from "lucide-react";
import type { ValuationQuadrantData } from "./ValuationExplorer";

interface PriceDisciplineTagProps {
  quadrant: ValuationQuadrantData;
}

function getStrengthTone(strength: string): "green" | "yellow" | "red" {
  switch (strength) {
    case "sensible":
      return "green";
    case "risky":
      return "red";
    default:
      return "yellow";
  }
}

function getToneStyles(tone: "green" | "yellow" | "red") {
  switch (tone) {
    case "green":
      return {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        tagColor: "text-green-700 dark:text-green-400",
        dotColor: "bg-green-500",
      };
    case "yellow":
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        tagColor: "text-yellow-700 dark:text-yellow-400",
        dotColor: "bg-yellow-500",
      };
    case "red":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        tagColor: "text-red-700 dark:text-red-400",
        dotColor: "bg-red-500",
      };
  }
}

export function PriceDisciplineTag({ quadrant }: PriceDisciplineTagProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const tier1 = quadrant.tier1Summary || quadrant.verdict;
  const tier2 = quadrant.tier2Explanation || quadrant.insight;
  const tone = getStrengthTone(quadrant.strength);
  const styles = getToneStyles(tone);

  return (
    <div 
      className={cn(
        "rounded-lg p-4 border",
        styles.bg,
        styles.border
      )}
      data-testid="price-discipline-tag"
    >
      <div className="flex items-start gap-3">
        <Compass className={cn("w-5 h-5 mt-0.5 shrink-0", styles.tagColor)} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", styles.dotColor)} />
            <span className={cn("font-semibold text-sm", styles.tagColor)} data-testid="price-tag-label">
              {quadrant.verdict}
            </span>
          </div>
          <p className="text-sm text-foreground leading-snug" data-testid="price-tag-tier1">
            {tier1}
          </p>
          
          {tier2 && tier2 !== tier1 && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md transition-colors"
                data-testid="button-expand-tier2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Why this matters</span>
                  </>
                )}
              </button>
              
              {isExpanded && (
                <div 
                  className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-current/10"
                  data-testid="price-tag-tier2"
                >
                  {tier2}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
