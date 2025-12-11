import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface QuadrantData {
  id: string;
  title: string;
  verdict: string;
  signals: [string, string];
  xLabel: string;
  yLabel: string;
  zones: {
    topRight: string;
    topLeft: string;
    bottomRight: string;
    bottomLeft: string;
  };
  position: { x: number; y: number };
  insight: string;
  signalDirections: [boolean, boolean];
}

const QUADRANT_DATA: QuadrantData[] = [
  {
    id: "growth-quality",
    title: "Growth Quality",
    verdict: "Scalable Growth",
    signals: ["Revenue", "Earnings"],
    signalDirections: [true, true],
    xLabel: "Revenue Growth",
    yLabel: "Earnings Growth",
    zones: {
      topRight: "Efficient Growth",
      topLeft: "Cost Cutting",
      bottomRight: "Scaling Up",
      bottomLeft: "Declining",
    },
    position: { x: 72, y: 25 },
    insight: "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder that can sustain growth over time.",
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
      topRight: "Cash Machine",
      topLeft: "Paper Profits",
      bottomRight: "Reinvesting",
      bottomLeft: "Cash Burn",
    },
    position: { x: 68, y: 30 },
    insight: "Strong profit margins paired with growing free cash flow. The business generates real cash, not just accounting profits. This is the sign of a healthy, sustainable operation.",
  },
  {
    id: "debt-safety",
    title: "Debt Safety",
    verdict: "Financially Resilient",
    signals: ["Debt", "Cash"],
    signalDirections: [false, true],
    xLabel: "Cash Position",
    yLabel: "Debt Level",
    zones: {
      topRight: "Overleveraged",
      topLeft: "At Risk",
      bottomRight: "Fortress",
      bottomLeft: "Cash Poor",
    },
    position: { x: 75, y: 70 },
    insight: "Low debt and strong cash reserves create a financial fortress. The company can weather economic downturns and seize opportunities when competitors struggle.",
  },
  {
    id: "reinvestment",
    title: "Reinvestment Return",
    verdict: "Smart Allocation",
    signals: ["CapEx", "ROIC"],
    signalDirections: [true, true],
    xLabel: "Capital Expenditure",
    yLabel: "Return on Capital",
    zones: {
      topRight: "Value Creator",
      topLeft: "Efficient",
      bottomRight: "Investing",
      bottomLeft: "Destroying Value",
    },
    position: { x: 65, y: 28 },
    insight: "High capital investment paired with strong returns. The company is reinvesting wisely and generating value from every dollar invested back into the business.",
  },
];

function SummaryCardRow({ 
  selectedId, 
  onSelect 
}: { 
  selectedId: string; 
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {QUADRANT_DATA.map((quadrant) => {
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
              {quadrant.signals.map((signal, idx) => (
                <span 
                  key={idx} 
                  className={cn(
                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                    quadrant.signalDirections[idx] 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                >
                  {quadrant.signalDirections[idx] ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {signal}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuadrantChart({ quadrant }: { quadrant: QuadrantData }) {
  const chartSize = 400;
  const padding = 56;
  const innerSize = chartSize - padding * 2;
  const center = chartSize / 2;
  
  const dotX = padding + (quadrant.position.x / 100) * innerSize;
  const dotY = padding + (quadrant.position.y / 100) * innerSize;

  return (
    <div className="relative w-full max-w-[400px] mx-auto">
      <svg 
        viewBox={`0 0 ${chartSize} ${chartSize}`} 
        className="w-full h-auto"
        data-testid={`quadrant-chart-${quadrant.id}`}
      >
        <defs>
          <linearGradient id="topRightGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="topLeftGradient" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(48, 96%, 53%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(48, 96%, 53%)" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="bottomRightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="bottomLeftGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 72%, 51%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(0, 72%, 51%)" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <rect 
          x={padding} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill="url(#topLeftGradient)"
        />
        <rect 
          x={center} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill="url(#topRightGradient)"
        />
        <rect 
          x={padding} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill="url(#bottomLeftGradient)"
        />
        <rect 
          x={center} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill="url(#bottomRightGradient)"
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
            x={center + innerSize/4} 
            y={padding + innerSize/4 + 4} 
            textAnchor="middle"
            className="fill-green-600 dark:fill-green-400"
          >
            {quadrant.zones.topRight}
          </text>
          <text 
            x={center - innerSize/4} 
            y={padding + innerSize/4 + 4} 
            textAnchor="middle"
            className="fill-yellow-600 dark:fill-yellow-400"
          >
            {quadrant.zones.topLeft}
          </text>
          <text 
            x={center + innerSize/4} 
            y={center + innerSize/4 + 4} 
            textAnchor="middle"
            className="fill-blue-600 dark:fill-blue-400"
          >
            {quadrant.zones.bottomRight}
          </text>
          <text 
            x={center - innerSize/4} 
            y={center + innerSize/4 + 4} 
            textAnchor="middle"
            className="fill-red-600 dark:fill-red-400"
          >
            {quadrant.zones.bottomLeft}
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

export function QuadrantExplorer() {
  const [selectedId, setSelectedId] = useState<string>(QUADRANT_DATA[0].id);
  
  const selectedQuadrant = QUADRANT_DATA.find(q => q.id === selectedId) || QUADRANT_DATA[0];

  return (
    <div className="space-y-6" data-testid="quadrant-explorer">
      <SummaryCardRow 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
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
              {selectedQuadrant.signals.map((signal, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    selectedQuadrant.signalDirections[idx] 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                  data-testid={`signal-${idx}`}
                >
                  {selectedQuadrant.signalDirections[idx] ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {signal} {selectedQuadrant.signalDirections[idx] ? "↑" : "↓"}
                </div>
              ))}
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
