import { cn } from "@/lib/utils";
import { Compass } from "lucide-react";
import type { ValuationQuadrantData, ValuationSignalStrength } from "./ValuationExplorer";

interface PriceDisciplineTagProps {
  quadrant: ValuationQuadrantData;
}

interface TagData {
  tag: string;
  explanation: string;
  tone: "green" | "yellow" | "red";
}

function generatePriceTag(quadrant: ValuationQuadrantData): TagData {
  const distanceSignal = quadrant.signals[0];
  const trendSignal = quadrant.signals[1];
  
  const distanceValue = distanceSignal?.value?.toLowerCase() || "";
  const trendValue = trendSignal?.value?.toLowerCase() || "";
  const strength = quadrant.strength;
  
  const distanceNum = parseFloat(distanceValue.replace(/[^0-9.]/g, '')) || 0;
  
  const isFarFromHigh = distanceNum >= 25;
  const isMidDistance = distanceNum >= 10 && distanceNum < 25;
  const isNearHigh = distanceNum < 10;
  
  const isRising = trendValue.includes("rising") || trendValue.includes("recovering");
  const isDrifting = trendValue.includes("drifting") || trendValue.includes("falling");
  const isFlat = trendValue.includes("flat") || trendValue.includes("stable");

  if (isFarFromHigh && isRising) {
    return {
      tag: "Discounted & Recovering",
      explanation: "Price is well below recent highs and starting to climb back — could be a good entry if the business is solid.",
      tone: "green",
    };
  }
  
  if (isFarFromHigh && isFlat) {
    return {
      tag: "On Sale",
      explanation: "The price has dropped significantly and is holding steady — might be worth a look if you like the story.",
      tone: "green",
    };
  }
  
  if (isFarFromHigh && isDrifting) {
    return {
      tag: "Falling Knife",
      explanation: "Price is down a lot and still dropping — might get cheaper before it gets better.",
      tone: "yellow",
    };
  }
  
  if (isMidDistance && isRising) {
    return {
      tag: "Building Momentum",
      explanation: "The stock is off its highs but trending upward — not a steal, but not overheated either.",
      tone: "yellow",
    };
  }
  
  if (isMidDistance && isFlat) {
    return {
      tag: "Waiting Game",
      explanation: "Price is in the middle range and holding flat — no urgency to buy or sell.",
      tone: "yellow",
    };
  }
  
  if (isMidDistance && isDrifting) {
    return {
      tag: "Softening",
      explanation: "Price is drifting lower from a moderate level — patience might get you a better deal.",
      tone: "yellow",
    };
  }
  
  if (isNearHigh && isRising) {
    return {
      tag: "Near the Peak",
      explanation: "Price is close to recent highs and still climbing — expectations are high, be cautious.",
      tone: "red",
    };
  }
  
  if (isNearHigh && isFlat) {
    return {
      tag: "Fully Priced",
      explanation: "The stock is trading near its high and holding steady — not much margin for error here.",
      tone: "red",
    };
  }
  
  if (isNearHigh && isDrifting) {
    return {
      tag: "Starting to Slip",
      explanation: "Price is near the top but starting to fade — could be early signs of cooling off.",
      tone: "yellow",
    };
  }

  if (strength === "sensible") {
    return {
      tag: "Reasonable Entry",
      explanation: "The price looks fair based on where it's been — not a screaming deal, but not overpriced.",
      tone: "green",
    };
  }
  
  if (strength === "risky") {
    return {
      tag: "Looks Expensive",
      explanation: "The stock is priced near recent highs — you'd be buying when everyone else is excited.",
      tone: "red",
    };
  }

  return {
    tag: "Mixed Signals",
    explanation: "Price signals are unclear — dig deeper before deciding.",
    tone: "yellow",
  };
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
  const tagData = generatePriceTag(quadrant);
  const styles = getToneStyles(tagData.tone);

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
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", styles.dotColor)} />
            <span className={cn("font-semibold text-sm", styles.tagColor)} data-testid="price-tag-label">
              {tagData.tag}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-snug" data-testid="price-tag-explanation">
            {tagData.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
