import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

const TERM_DEFINITIONS: Record<string, string> = {
  "Revenue": "The total money a company earns from selling its products or services — before any expenses.",
  "Earnings": "What's left after all costs are paid. Also called 'net income' or 'profit.'",
  "Margins": "How much profit the company keeps from each dollar of sales. Higher is usually better.",
  "FCF": "The money left after the business pays its bills and reinvests. Real money it can keep or use.",
  "Debt": "What the company owes. Some is fine, too much is risky.",
  "Cash": "Money the company has on hand. A safety cushion for tough times.",
  "CapEx": "Spending to grow or maintain the business — like new equipment or upgrades.",
  "ROIC": "Return on invested capital — how well the company turns invested money into profits.",
};

export type SignalStrength = "strong" | "mixed" | "weak";

export interface QuadrantData {
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
  // For inverse metrics (Debt, CapEx): true means show down arrow when good
  // e.g., low debt is good but shows DOWN arrow since debt decreased
  invertedSignals?: [boolean, boolean];
  strength: SignalStrength;
}

export const QUADRANT_DATA: QuadrantData[] = [
  {
    id: "growth-quality",
    title: "Growth Quality",
    verdict: "Scalable Growth",
    signals: ["Revenue", "Earnings"],
    signalDirections: [true, true],
    xLabel: "Revenue Growth",
    yLabel: "Earnings Growth",
    zones: {
      topRight: { label: "Efficient Growth", color: "green" },
      topLeft: { label: "Cost Cutting", color: "yellow" },
      bottomRight: { label: "Scaling Up", color: "blue" },
      bottomLeft: { label: "Declining", color: "red" },
    },
    position: { x: 72, y: 25 },
    insight: "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder that can sustain growth over time.",
    strength: "strong",
  },
  {
    id: "profit-cash",
    title: "Profit vs Cash",
    verdict: "Profitable + Liquid",
    signals: ["Margins", "FCF"],
    signalDirections: [true, true],
    xLabel: "Profit Margins",
    yLabel: "Free Cash Flow",
    zones: {
      topRight: { label: "Cash Machine", color: "green" },
      topLeft: { label: "Paper Profits", color: "yellow" },
      bottomRight: { label: "Reinvesting", color: "blue" },
      bottomLeft: { label: "Cash Burn", color: "red" },
    },
    position: { x: 68, y: 30 },
    insight: "Strong profit margins paired with growing free cash flow. The business generates real cash, not just accounting profits. This is the sign of a healthy, sustainable operation.",
    strength: "strong",
  },
  {
    id: "debt-safety",
    title: "Debt Safety",
    verdict: "Low Debt Burden",
    signals: ["Debt", "Earnings"],
    signalDirections: [true, true], // Default: debt is low (good), earnings up
    invertedSignals: [true, false], // Debt is inverted: down arrow = good (low debt)
    xLabel: "Return / Earnings Strength",
    yLabel: "Debt Levels",
    zones: {
      topRight: { label: "Aggressive Borrower", color: "orange" },
      topLeft: { label: "Financially Fragile", color: "red" },
      bottomRight: { label: "Healthy Leverage", color: "green" },
      bottomLeft: { label: "Underleveraged", color: "yellow" },
    },
    position: { x: 75, y: 70 },
    insight: "Low debt and strong earnings create financial resilience. The company can weather economic downturns and seize opportunities when competitors struggle.",
    strength: "strong",
  },
  {
    id: "reinvestment",
    title: "Reinvestment Return",
    verdict: "Smart Allocation",
    signals: ["CapEx", "ROIC"],
    signalDirections: [true, true],
    invertedSignals: [true, false], // CapEx is inverted: up spending = caution context
    xLabel: "Capital Expenditure",
    yLabel: "Return on Capital",
    zones: {
      topRight: { label: "Value Creator", color: "green" },
      topLeft: { label: "Efficient", color: "yellow" },
      bottomRight: { label: "Investing", color: "blue" },
      bottomLeft: { label: "Destroying Value", color: "red" },
    },
    position: { x: 65, y: 28 },
    insight: "High capital investment paired with strong returns. The company is reinvesting wisely and generating value from every dollar invested back into the business.",
    strength: "strong",
  },
];

// Generate dynamic quadrant data based on real financial metrics
export function generateQuadrantData(
  financialMetrics?: FinancialMetrics,
  balanceSheetMetrics?: BalanceSheetMetrics
): QuadrantData[] {
  // Default to static data if no metrics provided
  if (!financialMetrics && !balanceSheetMetrics) {
    return QUADRANT_DATA;
  }

  // Helper to map status to strength
  const statusToStrength = (status: "strong" | "caution" | "weak"): SignalStrength => {
    if (status === "strong") return "strong";
    if (status === "caution") return "mixed";
    return "weak";
  };

  // Helper to get position based on metrics (0-100 scale)
  const getGrowthPosition = (revenueGrowth: boolean, earningsGrowth: boolean, revPct: number, earnPct: number) => {
    // X = revenue position, Y = earnings position (inverted for SVG)
    // Map percentage to 25-75 range for visual clarity
    const clamp = (val: number) => Math.max(10, Math.min(90, val));
    const x = clamp(50 + (revPct / 2)); // Center at 50, scale by half
    const y = clamp(50 - (earnPct / 2)); // Inverted Y axis
    return { x, y };
  };

  // 1. Growth Quality - based on revenue and earnings
  const revenueUp = financialMetrics?.revenueGrowth === "growing";
  const earningsUp = financialMetrics?.earningsGrowth === "growing";
  const revPct = financialMetrics?.revenueChangePercent ?? 0;
  const earnPct = financialMetrics?.earningsChangePercent ?? 0;
  
  let growthStrength: SignalStrength = "weak";
  let growthVerdict = "Declining";
  let growthInsight = "Both revenue and earnings are declining — a red flag for long-term investors. The business may be losing market share or facing structural challenges.";
  
  if (revenueUp && earningsUp) {
    growthStrength = "strong";
    growthVerdict = "Scalable Growth";
    growthInsight = "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder.";
  } else if (revenueUp && !earningsUp) {
    growthStrength = "mixed";
    growthVerdict = "Scaling Up";
    growthInsight = "Revenue is growing but earnings aren't keeping pace. The company may be investing heavily for future growth, or facing margin pressure.";
  } else if (!revenueUp && earningsUp) {
    growthStrength = "mixed";
    growthVerdict = "Cost Cutting";
    growthInsight = "Earnings are up despite flat or declining revenue. This could mean efficiency gains, but watch for sustainability if revenue doesn't recover.";
  }

  // 2. Liquidity - based on balance sheet
  const liquidityStatus = balanceSheetMetrics?.checks?.liquidity?.status ?? "strong";
  const liquiditySummary = balanceSheetMetrics?.checks?.liquidity?.summary ?? "";
  
  let liquidityStrength = statusToStrength(liquidityStatus);
  let liquidityVerdict = liquidityStatus === "strong" ? "Financially Resilient" : 
                         liquidityStatus === "caution" ? "Moderate Liquidity" : "Liquidity Concerns";
  let liquidityInsight = liquidityStatus === "strong" 
    ? "Strong cash position relative to short-term obligations. The company can weather economic downturns and seize opportunities."
    : liquidityStatus === "caution"
    ? "Liquidity is adequate but not exceptional. The company should manage its short-term obligations carefully."
    : "The company may struggle to meet short-term obligations. This is a significant risk factor to monitor closely.";

  // 3. Debt Burden - based on balance sheet
  const debtStatus = balanceSheetMetrics?.checks?.debtBurden?.status ?? "strong";
  
  let debtStrength = statusToStrength(debtStatus);
  let debtVerdict = debtStatus === "strong" ? "Low Debt Burden" :
                    debtStatus === "caution" ? "Moderate Debt" : "High Debt Load";
  let debtInsight = debtStatus === "strong"
    ? "Low debt levels provide financial flexibility and safety margin. The company isn't overleveraged."
    : debtStatus === "caution"
    ? "Debt levels are manageable but worth monitoring. The company has some leverage that could amplify both gains and losses."
    : "High debt creates financial risk. Interest payments could strain cash flow, especially if earnings decline.";

  // 4. Equity Growth - based on balance sheet
  const equityStatus = balanceSheetMetrics?.checks?.equityGrowth?.status ?? "strong";
  
  let equityStrength = statusToStrength(equityStatus);
  let equityVerdict = equityStatus === "strong" ? "Growing Book Value" :
                      equityStatus === "caution" ? "Stable Equity" : "Shrinking Equity";
  let equityInsight = equityStatus === "strong"
    ? "Shareholder equity is growing — the company is building long-term value and reinvesting profits effectively."
    : equityStatus === "caution"
    ? "Equity is relatively stable. The company is maintaining its book value but not dramatically increasing it."
    : "Shareholder equity is declining. This could indicate losses, excessive dividends, or share buybacks at poor prices.";

  // Calculate positions based on real data
  const growthPos = getGrowthPosition(revenueUp, earningsUp, revPct, earnPct);
  
  // Position mapping for balance sheet metrics (status -> position)
  const statusToPosition = (status: "strong" | "caution" | "weak", inverted: boolean = false) => {
    if (status === "strong") return inverted ? { x: 75, y: 70 } : { x: 72, y: 25 };
    if (status === "caution") return inverted ? { x: 50, y: 50 } : { x: 50, y: 50 };
    return inverted ? { x: 25, y: 30 } : { x: 28, y: 75 };
  };

  // Helper to convert status to signal direction (true = positive, false = negative)
  const statusToSignal = (status: "strong" | "caution" | "weak"): boolean => status === "strong";

  return [
    {
      ...QUADRANT_DATA[0],
      verdict: growthVerdict,
      position: growthPos,
      insight: growthInsight,
      signalDirections: [revenueUp, earningsUp] as [boolean, boolean],
      strength: growthStrength,
    },
    {
      ...QUADRANT_DATA[1],
      verdict: liquidityVerdict,
      position: statusToPosition(liquidityStatus),
      insight: liquidityInsight,
      signalDirections: [statusToSignal(liquidityStatus), statusToSignal(liquidityStatus)] as [boolean, boolean],
      strength: liquidityStrength,
    },
    {
      ...QUADRANT_DATA[2],
      verdict: debtVerdict,
      position: statusToPosition(debtStatus, true),
      insight: debtInsight,
      signalDirections: [statusToSignal(debtStatus), earningsUp] as [boolean, boolean],
      strength: debtStrength,
    },
    {
      ...QUADRANT_DATA[3],
      verdict: equityVerdict,
      position: statusToPosition(equityStatus),
      insight: equityInsight,
      signalDirections: [statusToSignal(equityStatus), statusToSignal(equityStatus)] as [boolean, boolean],
      strength: equityStrength,
    },
  ];
}

function TermWithTooltip({ term }: { term: string }) {
  const definition = TERM_DEFINITIONS[term];
  
  if (!definition) {
    return <span>{term}</span>;
  }
  
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-current">
          {term}
          <Info className="w-3 h-3 opacity-60" />
        </span>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-[280px] text-sm leading-relaxed"
        data-testid={`tooltip-${term}`}
      >
        <p><strong>{term}:</strong> {definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SummaryCardRow({ 
  selectedId, 
  onSelect,
  quadrantData
}: { 
  selectedId: string; 
  onSelect: (id: string) => void;
  quadrantData: QuadrantData[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {quadrantData.map((quadrant) => {
        const isSelected = selectedId === quadrant.id;
        return (
          <button
            key={quadrant.id}
            onClick={() => onSelect(quadrant.id)}
            className={cn(
              "text-left p-4 rounded-xl border-2 transition-all duration-200",
              "bg-card hover-elevate active-elevate-2",
              isSelected 
                ? "border-primary shadow-lg ring-1 ring-primary/20" 
                : "border-border/40 hover:border-border"
            )}
            data-testid={`quadrant-card-${quadrant.id}`}
          >
            <h3 className="font-semibold text-sm mb-1">
              {quadrant.title}
            </h3>
            <p className={cn(
              "text-xs font-medium mb-2",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {quadrant.verdict}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quadrant.signals.map((signal, idx) => {
                const isGood = quadrant.signalDirections[idx];
                const isInverted = quadrant.invertedSignals?.[idx] ?? false;
                // Color based on good/bad: green for good, red for bad
                // Arrow: for inverted metrics (Debt), good means DOWN arrow (debt decreased)
                const showUpArrow = isInverted ? !isGood : isGood;
                
                return (
                  <span 
                    key={idx} 
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                      isGood 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                  >
                    {showUpArrow ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {signal}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getZoneColors(color: string) {
  const colorMap: Record<string, { gradient: string; text: string }> = {
    green: {
      gradient: "hsl(142, 76%, 36%)",
      text: "fill-green-600 dark:fill-green-400",
    },
    yellow: {
      gradient: "hsl(48, 96%, 53%)",
      text: "fill-yellow-600 dark:fill-yellow-400",
    },
    blue: {
      gradient: "hsl(217, 91%, 60%)",
      text: "fill-blue-600 dark:fill-blue-400",
    },
    red: {
      gradient: "hsl(0, 72%, 51%)",
      text: "fill-red-600 dark:fill-red-400",
    },
    orange: {
      gradient: "hsl(25, 95%, 53%)",
      text: "fill-orange-600 dark:fill-orange-400",
    },
  };
  return colorMap[color] || colorMap.blue;
}

function QuadrantChart({ quadrant }: { quadrant: QuadrantData }) {
  const chartSize = 400;
  const padding = 56;
  const innerSize = chartSize - padding * 2;
  const center = chartSize / 2;
  
  const dotX = padding + (quadrant.position.x / 100) * innerSize;
  const dotY = padding + (quadrant.position.y / 100) * innerSize;

  const topRightColors = getZoneColors(quadrant.zones.topRight.color);
  const topLeftColors = getZoneColors(quadrant.zones.topLeft.color);
  const bottomRightColors = getZoneColors(quadrant.zones.bottomRight.color);
  const bottomLeftColors = getZoneColors(quadrant.zones.bottomLeft.color);

  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      <svg 
        viewBox={`0 0 ${chartSize} ${chartSize}`} 
        className="w-full h-auto"
        data-testid={`quadrant-chart-${quadrant.id}`}
      >
        <defs>
          <linearGradient id={`topRightGradient-${quadrant.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={topRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topRightColors.gradient} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`topLeftGradient-${quadrant.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={topLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`bottomRightGradient-${quadrant.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bottomRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomRightColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`bottomLeftGradient-${quadrant.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bottomLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <rect 
          x={padding} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#topLeftGradient-${quadrant.id})`}
        />
        <rect 
          x={center} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#topRightGradient-${quadrant.id})`}
        />
        <rect 
          x={padding} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#bottomLeftGradient-${quadrant.id})`}
        />
        <rect 
          x={center} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#bottomRightGradient-${quadrant.id})`}
        />
        
        <rect 
          x={padding} 
          y={padding} 
          width={innerSize} 
          height={innerSize} 
          fill="none"
          className="stroke-border"
          strokeWidth="1"
          rx="12"
        />
        
        <line 
          x1={center} 
          y1={padding + 8} 
          x2={center} 
          y2={chartSize - padding - 8}
          className="stroke-border/60"
          strokeWidth="1"
        />
        <line 
          x1={padding + 8} 
          y1={center} 
          x2={chartSize - padding - 8} 
          y2={center}
          className="stroke-border/60"
          strokeWidth="1"
        />
        
        <g className="text-[11px] font-medium">
          <text 
            x={chartSize - padding - 8} 
            y={padding + 20} 
            textAnchor="end"
            className={topRightColors.text}
          >
            {quadrant.zones.topRight.label}
          </text>
          <text 
            x={padding + 8} 
            y={padding + 20} 
            textAnchor="start"
            className={topLeftColors.text}
          >
            {quadrant.zones.topLeft.label}
          </text>
          <text 
            x={chartSize - padding - 8} 
            y={chartSize - padding - 12} 
            textAnchor="end"
            className={bottomRightColors.text}
          >
            {quadrant.zones.bottomRight.label}
          </text>
          <text 
            x={padding + 8} 
            y={chartSize - padding - 12} 
            textAnchor="start"
            className={bottomLeftColors.text}
          >
            {quadrant.zones.bottomLeft.label}
          </text>
        </g>
        
        <circle
          cx={dotX}
          cy={dotY}
          r="20"
          className="fill-primary/15"
        />
        <circle
          cx={dotX}
          cy={dotY}
          r="12"
          className="fill-primary stroke-white dark:stroke-background"
          strokeWidth="3"
        />
        
        <text 
          x={12} 
          y={center} 
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[11px] font-medium"
          transform={`rotate(-90, 12, ${center})`}
        >
          {quadrant.yLabel}
        </text>
        
        <text 
          x={center} 
          y={chartSize - 16} 
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-medium"
        >
          {quadrant.xLabel}
        </text>
        
        <g className="text-[9px] fill-muted-foreground/70 font-medium">
          <text x={padding + 4} y={chartSize - padding + 14} textAnchor="start">Low</text>
          <text x={chartSize - padding - 4} y={chartSize - padding + 14} textAnchor="end">High</text>
          <text x={padding - 8} y={chartSize - padding - 4} textAnchor="end">Low</text>
          <text x={padding - 8} y={padding + 8} textAnchor="end">High</text>
        </g>
      </svg>
    </div>
  );
}

interface QuadrantExplorerProps {
  financialMetrics?: FinancialMetrics;
  balanceSheetMetrics?: BalanceSheetMetrics;
}

export function QuadrantExplorer({ financialMetrics, balanceSheetMetrics }: QuadrantExplorerProps) {
  // Generate dynamic quadrant data based on real metrics
  const quadrantData = useMemo(
    () => generateQuadrantData(financialMetrics, balanceSheetMetrics),
    [financialMetrics, balanceSheetMetrics]
  );
  
  const [selectedId, setSelectedId] = useState<string>(quadrantData[0].id);
  
  const selectedQuadrant = quadrantData.find(q => q.id === selectedId) || quadrantData[0];

  return (
    <div className="space-y-6" data-testid="quadrant-explorer">
      <SummaryCardRow 
        selectedId={selectedId} 
        onSelect={setSelectedId}
        quadrantData={quadrantData}
      />
      
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-6 lg:p-8 flex items-center justify-center bg-muted/30">
            <QuadrantChart quadrant={selectedQuadrant} />
          </div>
          
          <div className="p-6 lg:p-8 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border">
            <div>
              <h3 className="text-2xl font-bold mb-2" data-testid="quadrant-title">
                {selectedQuadrant.title}
              </h3>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-primary" data-testid="quadrant-verdict">
                  {selectedQuadrant.verdict}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {selectedQuadrant.signals.map((signal, idx) => {
                const isGood = selectedQuadrant.signalDirections[idx];
                const isInverted = selectedQuadrant.invertedSignals?.[idx] ?? false;
                // Color based on good/bad, arrow inverted for metrics like Debt
                const showUpArrow = isInverted ? !isGood : isGood;
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                      isGood 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                    data-testid={`signal-${idx}`}
                  >
                    {showUpArrow ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <TermWithTooltip term={signal} />
                    {showUpArrow ? "↑" : "↓"}
                  </div>
                );
              })}
            </div>
            
            <p 
              className="text-muted-foreground leading-relaxed text-base"
              data-testid="quadrant-insight"
            >
              {selectedQuadrant.insight}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
