import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export type ValuationSignalStrength = "sensible" | "caution" | "risky";
export type SignalColor = "green" | "red" | "yellow" | "neutral";

interface SignalInfo {
  label: string;
  color: SignalColor;
  direction: "up" | "down" | "neutral";
  value?: string;
  tooltip?: string;
}

export interface ValuationQuadrantData {
  id: string;
  title: string;
  verdict: string;
  signals: [SignalInfo, SignalInfo];
  xLabel: string;
  yLabel: string;
  zones: {
    topRight: { label: string; color: string; tooltip?: string };
    topLeft: { label: string; color: string; tooltip?: string };
    bottomRight: { label: string; color: string; tooltip?: string };
    bottomLeft: { label: string; color: string; tooltip?: string };
  };
  position: { x: number; y: number };
  insight: string;
  insightHighlight: string;
  strength: ValuationSignalStrength;
  tier1Summary?: string;
  tier2Explanation?: string;
}

export const VALUATION_QUADRANT_DATA: ValuationQuadrantData[] = [
  {
    id: "price-discipline",
    title: "Price Discipline",
    verdict: "Reasonable Entry",
    signals: [
      { label: "Distance from Recent High", color: "neutral", direction: "neutral" },
      { label: "Company Size", color: "neutral", direction: "neutral" }
    ],
    xLabel: "Distance from Highs",
    yLabel: "Entry Risk",
    zones: {
      topLeft: { label: "Stormy Peak", color: "red", tooltip: "Prices are high and the trend is shaky — not the best time to jump in." },
      topRight: { label: "Bargain in the Rain", color: "yellow", tooltip: "The price has dropped, but conditions are still unstable — could get cheaper or bounce back." },
      bottomLeft: { label: "Clear but Pricey", color: "orange", tooltip: "Conditions are stable, but you're paying full price — no discount here." },
      bottomRight: { label: "Sunny Discount", color: "green", tooltip: "The price is down and the trend is steady — conditions look favorable." },
    },
    position: { x: 35, y: 65 },
    insight: "The stock is trading below its recent highs. This could be a reasonable entry point — but make sure the fundamentals still support the story.",
    insightHighlight: "This could be a reasonable entry point.",
    strength: "sensible",
  },
  {
    id: "price-tag",
    title: "Price Tag",
    verdict: "Fairly Priced",
    signals: [
      { label: "P/E Ratio", color: "neutral", direction: "neutral" },
      { label: "Earnings Growth", color: "neutral", direction: "neutral" }
    ],
    xLabel: "P/E Ratio",
    yLabel: "Earnings Growth",
    zones: {
      topLeft: { label: "Priced for Perfection", color: "red", tooltip: "Expensive stock with slow earnings growth — expectations may not be met." },
      topRight: { label: "Growth Premium", color: "yellow", tooltip: "High price, but fast-growing earnings — the growth may justify the cost." },
      bottomLeft: { label: "Cheap for a Reason", color: "orange", tooltip: "Low price, but earnings aren't growing — there may be a reason it's cheap." },
      bottomRight: { label: "Undervalued Opportunity", color: "green", tooltip: "Low price with strong earnings growth — could be a hidden gem worth exploring." },
    },
    position: { x: 55, y: 45 },
    insight: "The price seems reasonable relative to earnings growth. Not a screaming deal, but not overpriced either.",
    insightHighlight: "reasonable",
    strength: "caution",
  },
  {
    id: "capital-discipline",
    title: "Capital Discipline",
    verdict: "Value Creator",
    signals: [
      { label: "ROIC", color: "green", direction: "up" },
      { label: "Share Buybacks", color: "green", direction: "up" }
    ],
    xLabel: "Share Count Trend",
    yLabel: "Return on Capital",
    zones: {
      topRight: { label: "Value Creator", color: "green" },
      topLeft: { label: "Stable Operator", color: "blue" },
      bottomRight: { label: "Growth at All Costs", color: "yellow" },
      bottomLeft: { label: "Value Destroyer", color: "red" },
    },
    position: { x: 72, y: 28 },
    insight: "The company earns strong returns on invested capital and has been reducing share count through buybacks. This is a sign of disciplined capital allocation.",
    insightHighlight: "A sign of disciplined capital allocation.",
    strength: "sensible",
  },
  {
    id: "doubling-potential",
    title: "Doubling Potential",
    verdict: "Realistic Compounder",
    signals: [
      { label: "Time to Double", color: "neutral", direction: "neutral" },
      { label: "Company Size", color: "neutral", direction: "neutral" }
    ],
    xLabel: "Growth Rate",
    yLabel: "Time to Double",
    zones: {
      topRight: { label: "Pipe Dream", color: "red" },
      topLeft: { label: "Too Slow to Matter", color: "orange" },
      bottomRight: { label: "Breakout Potential", color: "blue" },
      bottomLeft: { label: "Realistic Compounder", color: "green" },
    },
    position: { x: 30, y: 35 },
    insight: "At current growth rates, this business could double in roughly 6-7 years — a reasonable compounding profile if execution holds.",
    insightHighlight: "A reasonable compounding profile.",
    strength: "sensible",
  },
];

export function getStrengthStyles(strength: ValuationSignalStrength) {
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
