import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, HelpCircle, CheckCircle, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ValuationSignalStrength = "sensible" | "caution" | "risky";

const VALUATION_TERM_DEFINITIONS: Record<string, string> = {
  "ROIC": "Return on Invested Capital — how much return the company earns on the money it reinvests. Higher is better.",
  "Rule of 72": "Divide 72 by a growth rate to estimate how long it'll take to double. For example, 10% growth = ~7 years to double.",
  "P/E": "Price-to-Earnings — how much you pay for each dollar of profit. Lower can mean cheaper, but context matters.",
  "EV/EBIT": "Enterprise Value to Operating Earnings — a measure of what you're paying relative to the company's core profits.",
  "FCF Yield": "Free Cash Flow Yield — how much real cash the company generates relative to its price. Higher is often better.",
  "Share Dilution": "When a company issues new shares, existing owners' stake shrinks. This can reduce your returns.",
  "Buybacks": "When a company repurchases its own shares, remaining owners' stakes grow. This can boost your returns.",
  "Market Cap": "The total market value of all outstanding shares. Bigger companies have larger market caps.",
  "52-Week High": "The highest price the stock has traded at over the past year.",
  "Historical Multiples": "Past valuation ratios for this stock. Useful for context, but not a crystal ball.",
};

function TermWithTooltip({ term }: { term: string }) {
  const definition = VALUATION_TERM_DEFINITIONS[term];
  
  if (!definition) {
    return <span>{term}</span>;
  }
  
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-current">
          {term}
          <HelpCircle className="w-3 h-3 opacity-60" />
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs text-sm"
      >
        {definition}
      </TooltipContent>
    </Tooltip>
  );
}

export interface ValuationQuadrantData {
  id: string;
  title: string;
  verdict: string;
  signals: [string, string];
  xLabel: string;
  yLabel: string;
  zones: {
    topRight: { label: string; color: string };
    topLeft: { label: string; color: string };
    bottomRight: { label: string; color: string };
    bottomLeft: { label: string; color: string };
  };
  position: { x: number; y: number };
  insight: string;
  signalDirections: [boolean, boolean];
  strength: ValuationSignalStrength;
}

const VALUATION_QUADRANT_DATA: ValuationQuadrantData[] = [
  {
    id: "price-discipline",
    title: "Price Discipline",
    verdict: "Reasonable Entry",
    signals: ["52-Week High", "Market Cap"],
    signalDirections: [true, true],
    xLabel: "Distance from Highs",
    yLabel: "Entry Risk",
    zones: {
      topRight: { label: "Euphoric High", color: "red" },
      topLeft: { label: "Conviction Buy", color: "yellow" },
      bottomRight: { label: "Discounted Entry", color: "green" },
      bottomLeft: { label: "Falling Knife", color: "orange" },
    },
    position: { x: 35, y: 65 },
    insight: "The stock is trading below its recent highs. This could be a reasonable entry point — but make sure the fundamentals still support the story.",
    strength: "sensible",
  },
  {
    id: "valuation-context",
    title: "Valuation Context",
    verdict: "Fairly Valued",
    signals: ["P/E", "Historical Multiples"],
    signalDirections: [true, false],
    xLabel: "Current Valuation",
    yLabel: "Historical Percentile",
    zones: {
      topRight: { label: "Priced for Perfection", color: "red" },
      topLeft: { label: "Cheap for a Reason", color: "orange" },
      bottomRight: { label: "Fair Value", color: "green" },
      bottomLeft: { label: "Undervalued Opportunity", color: "blue" },
    },
    position: { x: 55, y: 45 },
    insight: "The stock is trading at reasonable multiples compared to its own history. Future growth needs to justify today's price, but expectations aren't stretched.",
    strength: "sensible",
  },
  {
    id: "capital-discipline",
    title: "Capital Discipline",
    verdict: "Value Creator",
    signals: ["ROIC", "Buybacks"],
    signalDirections: [true, true],
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
    strength: "sensible",
  },
  {
    id: "doubling-potential",
    title: "Doubling Potential",
    verdict: "Realistic Compounder",
    signals: ["Rule of 72", "Market Cap"],
    signalDirections: [true, true],
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
    strength: "sensible",
  },
];

function getZoneColors(color: string) {
  const colorMap: Record<string, { gradient: string; label: string }> = {
    green: { gradient: "#22c55e", label: "text-green-700 dark:text-green-400" },
    red: { gradient: "#ef4444", label: "text-red-700 dark:text-red-400" },
    yellow: { gradient: "#eab308", label: "text-yellow-700 dark:text-yellow-400" },
    orange: { gradient: "#f97316", label: "text-orange-700 dark:text-orange-400" },
    blue: { gradient: "#3b82f6", label: "text-blue-700 dark:text-blue-400" },
  };
  return colorMap[color] || colorMap.green;
}

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

function ValuationQuadrantChart({ quadrant }: { quadrant: ValuationQuadrantData }) {
  const chartSize = 400;
  const padding = 56;
  const innerSize = chartSize - padding * 2;
  const center = chartSize / 2;
  
  const dotX = padding + (quadrant.position.x / 100) * innerSize;
  const dotY = padding + ((100 - quadrant.position.y) / 100) * innerSize;

  const topRightColors = getZoneColors(quadrant.zones.topRight.color);
  const topLeftColors = getZoneColors(quadrant.zones.topLeft.color);
  const bottomRightColors = getZoneColors(quadrant.zones.bottomRight.color);
  const bottomLeftColors = getZoneColors(quadrant.zones.bottomLeft.color);

  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      <svg 
        viewBox={`0 0 ${chartSize} ${chartSize}`} 
        className="w-full h-auto"
        data-testid={`valuation-quadrant-chart-${quadrant.id}`}
      >
        <defs>
          <linearGradient id={`vTopRightGradient-${quadrant.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={topRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topRightColors.gradient} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`vTopLeftGradient-${quadrant.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={topLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`vBottomRightGradient-${quadrant.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bottomRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomRightColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`vBottomLeftGradient-${quadrant.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bottomLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <filter id={`vGlow-${quadrant.id}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Top Left Quadrant */}
        <rect 
          x={padding} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#vTopLeftGradient-${quadrant.id})`}
        />
        {/* Top Right Quadrant */}
        <rect 
          x={center} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#vTopRightGradient-${quadrant.id})`}
        />
        {/* Bottom Left Quadrant */}
        <rect 
          x={padding} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#vBottomLeftGradient-${quadrant.id})`}
        />
        {/* Bottom Right Quadrant */}
        <rect 
          x={center} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#vBottomRightGradient-${quadrant.id})`}
        />

        {/* Grid lines */}
        <line 
          x1={padding} y1={center} x2={chartSize - padding} y2={center} 
          stroke="currentColor" 
          strokeOpacity="0.15" 
          strokeWidth="1"
        />
        <line 
          x1={center} y1={padding} x2={center} y2={chartSize - padding} 
          stroke="currentColor" 
          strokeOpacity="0.15" 
          strokeWidth="1"
        />

        {/* Border */}
        <rect 
          x={padding} 
          y={padding} 
          width={innerSize} 
          height={innerSize} 
          fill="none" 
          stroke="currentColor" 
          strokeOpacity="0.2" 
          strokeWidth="1"
        />

        {/* Quadrant labels */}
        <text 
          x={padding + innerSize * 0.25} 
          y={padding + innerSize * 0.15} 
          textAnchor="middle" 
          className={cn("text-xs font-medium fill-current", topLeftColors.label)}
        >
          {quadrant.zones.topLeft.label}
        </text>
        <text 
          x={padding + innerSize * 0.75} 
          y={padding + innerSize * 0.15} 
          textAnchor="middle" 
          className={cn("text-xs font-medium fill-current", topRightColors.label)}
        >
          {quadrant.zones.topRight.label}
        </text>
        <text 
          x={padding + innerSize * 0.25} 
          y={padding + innerSize * 0.88} 
          textAnchor="middle" 
          className={cn("text-xs font-medium fill-current", bottomLeftColors.label)}
        >
          {quadrant.zones.bottomLeft.label}
        </text>
        <text 
          x={padding + innerSize * 0.75} 
          y={padding + innerSize * 0.88} 
          textAnchor="middle" 
          className={cn("text-xs font-medium fill-current", bottomRightColors.label)}
        >
          {quadrant.zones.bottomRight.label}
        </text>

        {/* Axis labels */}
        <text 
          x={center} 
          y={chartSize - 16} 
          textAnchor="middle" 
          className="text-xs fill-muted-foreground"
        >
          {quadrant.xLabel}
        </text>
        <text 
          x={16} 
          y={center} 
          textAnchor="middle" 
          className="text-xs fill-muted-foreground"
          transform={`rotate(-90, 16, ${center})`}
        >
          {quadrant.yLabel}
        </text>

        {/* Position dot with glow */}
        <g filter={`url(#vGlow-${quadrant.id})`}>
          <circle 
            cx={dotX} 
            cy={dotY} 
            r="12" 
            className="fill-primary"
          />
          <circle 
            cx={dotX} 
            cy={dotY} 
            r="6" 
            className="fill-white"
          />
        </g>
      </svg>
    </div>
  );
}

interface SummaryCardProps {
  id: string;
  title: string;
  verdict: string;
  strength: ValuationSignalStrength;
  isSelected: boolean;
  onClick: () => void;
}

function ValuationSummaryCard({ id, title, verdict, strength, isSelected, onClick }: SummaryCardProps) {
  const styles = getStrengthStyles(strength);
  const Icon = styles.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-[140px] p-4 rounded-xl border text-left transition-all",
        isSelected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border hover-elevate",
        styles.bg
      )}
      data-testid={`valuation-summary-card-${id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Icon className={cn("w-4 h-4", styles.text)} />
      </div>
      <div className={cn("text-xs font-semibold", styles.text)}>
        {styles.label}
      </div>
    </button>
  );
}

function ValuationSummaryCardRow({ 
  selectedId, 
  onSelect, 
  quadrantData 
}: { 
  selectedId: string; 
  onSelect: (id: string) => void;
  quadrantData: ValuationQuadrantData[];
}) {
  return (
    <div className="flex flex-wrap gap-3" data-testid="valuation-summary-card-row">
      {quadrantData.map((quadrant) => (
        <ValuationSummaryCard
          key={quadrant.id}
          id={quadrant.id}
          title={quadrant.title}
          verdict={quadrant.verdict}
          strength={quadrant.strength}
          isSelected={selectedId === quadrant.id}
          onClick={() => onSelect(quadrant.id)}
        />
      ))}
    </div>
  );
}

export function ValuationExplorer() {
  const quadrantData = useMemo(() => VALUATION_QUADRANT_DATA, []);
  const [selectedId, setSelectedId] = useState<string>(quadrantData[0].id);
  
  const selectedQuadrant = quadrantData.find(q => q.id === selectedId) || quadrantData[0];

  return (
    <div className="space-y-6" data-testid="valuation-explorer">
      <ValuationSummaryCardRow 
        selectedId={selectedId} 
        onSelect={setSelectedId}
        quadrantData={quadrantData}
      />
      
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-6 lg:p-8 flex items-center justify-center bg-muted/30">
            <ValuationQuadrantChart quadrant={selectedQuadrant} />
          </div>
          
          <div className="p-6 lg:p-8 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border">
            <div>
              <h3 className="text-2xl font-bold mb-2" data-testid="valuation-quadrant-title">
                {selectedQuadrant.title}
              </h3>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                getStrengthStyles(selectedQuadrant.strength).bg
              )}>
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  selectedQuadrant.strength === "sensible" && "bg-green-500",
                  selectedQuadrant.strength === "caution" && "bg-yellow-500",
                  selectedQuadrant.strength === "risky" && "bg-red-500"
                )} />
                <span className={cn(
                  "text-sm font-semibold",
                  getStrengthStyles(selectedQuadrant.strength).text
                )} data-testid="valuation-quadrant-verdict">
                  {selectedQuadrant.verdict}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {selectedQuadrant.signals.map((signal, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    selectedQuadrant.signalDirections[idx] 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                  data-testid={`valuation-signal-${idx}`}
                >
                  {selectedQuadrant.signalDirections[idx] ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <TermWithTooltip term={signal} />
                  {selectedQuadrant.signalDirections[idx] ? "↑" : "↓"}
                </div>
              ))}
            </div>
            
            <p 
              className="text-muted-foreground leading-relaxed text-base"
              data-testid="valuation-quadrant-insight"
            >
              {selectedQuadrant.insight}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { VALUATION_QUADRANT_DATA, getStrengthStyles };
export type { ValuationQuadrantData as ValuationData };
