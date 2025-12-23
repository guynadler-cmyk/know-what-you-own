import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, HelpCircle, CheckCircle, AlertTriangle, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ValuationSignalStrength = "sensible" | "caution" | "risky";
export type SignalColor = "green" | "red" | "yellow" | "neutral";

const VALUATION_TERM_DEFINITIONS: Record<string, string> = {
  "Distance from Recent High": "How far the current price is from the stock's recent peak. Useful context, but not a buy or sell signal on its own.",
  "Company Size": "The total value of the company in the stock market. Larger companies are often more stable, but size alone doesn't determine value.",
  "Valuation Rising": "The stock is getting more expensive relative to earnings. This could mean the market expects more growth — or it's getting overpriced.",
  "Cheaper vs History": "The stock is trading cheaper than usual based on past metrics. This could signal opportunity — or a reason for concern.",
  "ROIC": "How much return the company earns on the money it reinvests. Higher is better — it means the business is using capital wisely.",
  "Share Buybacks": "When a company repurchases its own shares, your ownership stake grows. This can boost your returns over time.",
  "Share Dilution": "When a company issues new shares, your ownership stake shrinks. This can reduce your returns unless the capital is used well.",
  "Time to Double": "A rough estimate of how long it might take for the company to double in size, based on current growth rates.",
  "P/E": "Price-to-Earnings — how much you pay for each dollar of profit. Lower can mean cheaper, but context matters.",
  "EV/EBIT": "Enterprise Value to Operating Earnings — a measure of what you're paying relative to the company's core profits.",
  "FCF Yield": "Free Cash Flow Yield — how much real cash the company generates relative to its price. Higher is often better.",
  "Historical Multiples": "Past valuation ratios for this stock. Useful for context, but not a crystal ball.",
};

interface SignalInfo {
  label: string;
  color: SignalColor;
  direction: "up" | "down" | "neutral";
}

function getSignalStyles(color: SignalColor) {
  switch (color) {
    case "green":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: TrendingUp,
      };
    case "red":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: TrendingDown,
      };
    case "yellow":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
      };
    case "neutral":
      return {
        bg: "bg-neutral-500/10",
        text: "text-neutral-600 dark:text-neutral-400",
        icon: Minus,
      };
  }
}

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
  signals: [SignalInfo, SignalInfo];
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
  insightHighlight: string;
  strength: ValuationSignalStrength;
}

const VALUATION_QUADRANT_DATA: ValuationQuadrantData[] = [
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
      topRight: { label: "Euphoric High", color: "red" },
      topLeft: { label: "Conviction Buy", color: "yellow" },
      bottomRight: { label: "Discounted Entry", color: "green" },
      bottomLeft: { label: "Falling Knife", color: "orange" },
    },
    position: { x: 35, y: 65 },
    insight: "The stock is trading below its recent highs. This could be a reasonable entry point — but make sure the fundamentals still support the story.",
    insightHighlight: "This could be a reasonable entry point.",
    strength: "sensible",
  },
  {
    id: "valuation-check",
    title: "Valuation Check",
    verdict: "Fairly Valued",
    signals: [
      { label: "Valuation Rising", color: "red", direction: "up" },
      { label: "Cheaper vs History", color: "green", direction: "down" }
    ],
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
    insightHighlight: "Expectations aren't stretched.",
    strength: "sensible",
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

function SignalTag({ signal }: { signal: SignalInfo }) {
  const styles = getSignalStyles(signal.color);
  const Icon = styles.icon;
  
  const getDirectionSymbol = () => {
    if (signal.direction === "up") return "↑";
    if (signal.direction === "down") return "↓";
    return "";
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        styles.bg,
        styles.text
      )}
      data-testid={`valuation-signal-tag`}
    >
      <Icon className="w-4 h-4" />
      <TermWithTooltip term={signal.label} />
      {getDirectionSymbol()}
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
                <SignalTag key={idx} signal={signal} />
              ))}
            </div>
            
            <div 
              className="bg-primary/5 rounded-lg p-4 border border-primary/10"
              data-testid="valuation-quadrant-insight"
            >
              <p className="text-foreground leading-relaxed text-base">
                {selectedQuadrant.insightHighlight && selectedQuadrant.insight.includes(selectedQuadrant.insightHighlight) ? (
                  <>
                    {selectedQuadrant.insight.split(selectedQuadrant.insightHighlight)[0]}
                    <span className="font-semibold text-primary">
                      {selectedQuadrant.insightHighlight}
                    </span>
                    {selectedQuadrant.insight.split(selectedQuadrant.insightHighlight)[1] || ''}
                  </>
                ) : (
                  selectedQuadrant.insight
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export { VALUATION_QUADRANT_DATA, getStrengthStyles };
export type { ValuationQuadrantData as ValuationData };
