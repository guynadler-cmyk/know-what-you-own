import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react";

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
  signalIcons: [boolean, boolean];
}

const QUADRANT_DATA: QuadrantData[] = [
  {
    id: "growth-quality",
    title: "Growth Quality",
    verdict: "Scalable Growth",
    signals: ["Revenue ↑", "Earnings ↑"],
    signalIcons: [true, true],
    xLabel: "Revenue Growth",
    yLabel: "Earnings Growth",
    zones: {
      topRight: "Efficient Growth",
      topLeft: "Cost Cutting",
      bottomRight: "Scaling Up",
      bottomLeft: "Declining",
    },
    position: { x: 72, y: 25 },
    insight: "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder.",
  },
  {
    id: "profit-cash",
    title: "Profit vs Cash",
    verdict: "Profitable + Liquid",
    signals: ["Margins ↑", "FCF ↑"],
    signalIcons: [true, true],
    xLabel: "Profit Margins",
    yLabel: "Free Cash Flow",
    zones: {
      topRight: "Cash Machine",
      topLeft: "Paper Profits",
      bottomRight: "Reinvesting",
      bottomLeft: "Cash Burn",
    },
    position: { x: 68, y: 30 },
    insight: "Strong profit margins paired with growing free cash flow. The business generates real cash, not just accounting profits.",
  },
  {
    id: "debt-safety",
    title: "Debt Safety",
    verdict: "Financially Resilient",
    signals: ["Debt ↓", "Cash ↑"],
    signalIcons: [false, true],
    xLabel: "Cash Position",
    yLabel: "Debt Level",
    zones: {
      topRight: "Fortress",
      topLeft: "Overleveraged",
      bottomRight: "Cash Rich",
      bottomLeft: "At Risk",
    },
    position: { x: 75, y: 70 },
    insight: "Low debt and strong cash reserves create a safety cushion. The company can weather downturns and seize opportunities.",
  },
  {
    id: "reinvestment",
    title: "Reinvestment Return",
    verdict: "Smart Allocation",
    signals: ["CapEx ↑", "ROIC ↑"],
    signalIcons: [true, true],
    xLabel: "Capital Expenditure",
    yLabel: "Return on Capital",
    zones: {
      topRight: "Value Creator",
      topLeft: "Efficient",
      bottomRight: "Investing",
      bottomLeft: "Destroying Value",
    },
    position: { x: 65, y: 28 },
    insight: "High capital investment paired with strong returns. The company is reinvesting wisely and generating value from its investments.",
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {QUADRANT_DATA.map((quadrant) => {
        const isSelected = selectedId === quadrant.id;
        return (
          <button
            key={quadrant.id}
            onClick={() => onSelect(quadrant.id)}
            className={cn(
              "text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200",
              "bg-card hover-elevate active-elevate-2",
              isSelected 
                ? "border-primary shadow-md" 
                : "border-border/50"
            )}
            data-testid={`quadrant-card-${quadrant.id}`}
          >
            <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-1">
              {quadrant.title}
            </h3>
            <p className={cn(
              "text-xs md:text-sm font-medium mb-2",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {quadrant.verdict}
            </p>
            <div className="flex flex-wrap gap-1 md:gap-2">
              {quadrant.signals.map((signal, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-0.5 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full"
                >
                  {quadrant.signalIcons[idx] ? (
                    <ArrowUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className="hidden sm:inline">{signal.replace(" ↑", "").replace(" ↓", "")}</span>
                  <span className="sm:hidden">{signal.replace(" ↑", "").replace(" ↓", "").slice(0, 3)}</span>
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
  const chartSize = 320;
  const padding = 48;
  const innerSize = chartSize - padding * 2;
  const center = chartSize / 2;
  
  const dotX = padding + (quadrant.position.x / 100) * innerSize;
  const dotY = padding + (quadrant.position.y / 100) * innerSize;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[320px] aspect-square">
        <svg 
          viewBox={`0 0 ${chartSize} ${chartSize}`} 
          className="w-full h-full"
          data-testid={`quadrant-chart-${quadrant.id}`}
        >
          <rect 
            x={padding} 
            y={padding} 
            width={innerSize} 
            height={innerSize} 
            className="fill-muted/30"
            rx="8"
          />
          
          <line 
            x1={center} 
            y1={padding} 
            x2={center} 
            y2={chartSize - padding}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line 
            x1={padding} 
            y1={center} 
            x2={chartSize - padding} 
            y2={center}
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          
          <g className="text-[9px] fill-muted-foreground font-medium">
            <text 
              x={center + innerSize/4} 
              y={padding + innerSize/4} 
              textAnchor="middle"
              className="fill-green-600/70 dark:fill-green-400/70"
            >
              {quadrant.zones.topRight}
            </text>
            <text 
              x={center - innerSize/4} 
              y={padding + innerSize/4} 
              textAnchor="middle"
              className="fill-yellow-600/70 dark:fill-yellow-400/70"
            >
              {quadrant.zones.topLeft}
            </text>
            <text 
              x={center + innerSize/4} 
              y={center + innerSize/4} 
              textAnchor="middle"
              className="fill-blue-600/70 dark:fill-blue-400/70"
            >
              {quadrant.zones.bottomRight}
            </text>
            <text 
              x={center - innerSize/4} 
              y={center + innerSize/4} 
              textAnchor="middle"
              className="fill-red-600/70 dark:fill-red-400/70"
            >
              {quadrant.zones.bottomLeft}
            </text>
          </g>
          
          <circle
            cx={dotX}
            cy={dotY}
            r="10"
            className="fill-primary"
          />
          <circle
            cx={dotX}
            cy={dotY}
            r="16"
            className="fill-primary/20"
          />
          
          <text 
            x={padding - 8} 
            y={center} 
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
            transform={`rotate(-90, ${padding - 8}, ${center})`}
          >
            {quadrant.yLabel}
          </text>
          
          <text 
            x={center} 
            y={chartSize - padding + 24} 
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {quadrant.xLabel}
          </text>
          
          <g className="text-[8px] fill-muted-foreground/60">
            <text x={padding} y={chartSize - padding + 12} textAnchor="start">Low</text>
            <text x={chartSize - padding} y={chartSize - padding + 12} textAnchor="end">High</text>
            <text x={padding - 6} y={chartSize - padding} textAnchor="end">Low</text>
            <text x={padding - 6} y={padding + 4} textAnchor="end">High</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export function QuadrantExplorer() {
  const [selectedId, setSelectedId] = useState<string>(QUADRANT_DATA[0].id);
  
  const selectedQuadrant = QUADRANT_DATA.find(q => q.id === selectedId) || QUADRANT_DATA[0];

  return (
    <div className="space-y-6 md:space-y-8" data-testid="quadrant-explorer">
      <SummaryCardRow 
        selectedId={selectedId} 
        onSelect={setSelectedId} 
      />
      
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <QuadrantChart quadrant={selectedQuadrant} />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-1" data-testid="quadrant-title">
                {selectedQuadrant.title}
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm font-medium text-primary" data-testid="quadrant-verdict">
                  {selectedQuadrant.verdict}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {selectedQuadrant.signals.map((signal, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                    selectedQuadrant.signalIcons[idx] 
                      ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  )}
                  data-testid={`signal-${idx}`}
                >
                  {selectedQuadrant.signalIcons[idx] ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {signal}
                </div>
              ))}
            </div>
            
            <p 
              className="text-muted-foreground leading-relaxed"
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
