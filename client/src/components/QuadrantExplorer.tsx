import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";
import { QUADRANT_DATA, generateQuadrantData, type SignalStrength, type QuadrantData } from "@/lib/quadrantData";
export { QUADRANT_DATA, generateQuadrantData, type SignalStrength, type QuadrantData };

const TERM_DEFINITIONS: Record<string, string> = {
  "Revenue": "The total money a company earns from selling its products or services — before any expenses.",
  "Earnings": "What's left after all costs are paid. Also called 'net income' or 'profit.'",
  "Margins": "How much profit the company keeps from each dollar of sales. Higher is usually better.",
  "FCF": "Free cash flow — the real cash left after the business pays its bills and reinvests. Money it can actually keep or use.",
  "Debt": "What the company owes. Some is fine, too much is risky.",
  "Coverage": "How easily the company's earnings cover its interest payments. Higher means more breathing room.",
  "Book Value Growth": "How fast the company's net worth (assets minus debts) is growing over time — a sign of building real value for owners.",
  "ROIC": "Return on invested capital — how well the company turns invested money into profits.",
};

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
  ticker?: string;
}

export function QuadrantExplorer({ financialMetrics, balanceSheetMetrics, ticker }: QuadrantExplorerProps) {
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
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-4"
          style={{ background: "var(--lp-teal-deep)" }}
        >
          <span className="text-white/50 text-[10px] font-mono uppercase tracking-widest">
            Stage 2 · Performance
          </span>
          {ticker && (
            <span className="text-white font-mono text-sm font-semibold tracking-wide">
              {ticker}
            </span>
          )}
          <span className="text-white/50 text-[10px] font-mono uppercase tracking-widest">
            {selectedQuadrant.title}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-0">
          <div className="p-6 lg:p-8 flex items-center justify-center bg-muted/30">
            <QuadrantChart quadrant={selectedQuadrant} />
          </div>
          
          <div className="p-6 lg:p-8 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border">
            <div>
              <h3
                className="text-2xl font-bold mb-2 italic"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)" }}
                data-testid="quadrant-title"
              >
                {selectedQuadrant.title}
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold text-primary" data-testid="quadrant-verdict">
                  {selectedQuadrant.verdict}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              {selectedQuadrant.signals.map((signal, idx) => {
                const isGood = selectedQuadrant.signalDirections[idx];
                const isInverted = selectedQuadrant.invertedSignals?.[idx] ?? false;
                const showUpArrow = isInverted ? !isGood : isGood;
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium",
                      isGood 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                    data-testid={`signal-${idx}`}
                  >
                    {showUpArrow ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <TermWithTooltip term={signal} />
                  </div>
                );
              })}
            </div>
            
            <div
              className="border-l-2 pl-4 py-0.5"
              style={{ borderColor: "var(--lp-teal-deep)" }}
            >
              <p 
                className="text-muted-foreground leading-relaxed text-base"
                data-testid="quadrant-insight"
              >
                {selectedQuadrant.insight}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
