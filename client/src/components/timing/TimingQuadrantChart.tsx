import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimingQuadrantConfig {
  id: string;
  xLabel: string;
  yLabel: string;
  zones: {
    topRight: { label: string; color: string; tooltip?: string };
    topLeft: { label: string; color: string; tooltip?: string };
    bottomRight: { label: string; color: string; tooltip?: string };
    bottomLeft: { label: string; color: string; tooltip?: string };
  };
  position: { x: number; y: number };
  guidedView?: boolean;
}

function getZoneColors(color: string) {
  const colorMap: Record<string, { gradient: string; label: string }> = {
    green: { gradient: "#22c55e", label: "text-green-700 dark:text-green-400" },
    red: { gradient: "#ef4444", label: "text-red-700 dark:text-red-400" },
    yellow: { gradient: "#eab308", label: "text-yellow-700 dark:text-yellow-400" },
    orange: { gradient: "#f97316", label: "text-orange-700 dark:text-orange-400" },
    blue: { gradient: "#3b82f6", label: "text-blue-700 dark:text-blue-400" },
    neutral: { gradient: "#737373", label: "text-neutral-600 dark:text-neutral-400" },
  };
  return colorMap[color] || colorMap.neutral;
}

export function TimingQuadrantChart({ config }: { config: TimingQuadrantConfig }) {
  const chartSize = 400;
  const padding = 56;
  const innerSize = chartSize - padding * 2;
  const center = chartSize / 2;
  
  const dotX = padding + (config.position.x / 100) * innerSize;
  const dotY = padding + ((100 - config.position.y) / 100) * innerSize;

  const topRightColors = getZoneColors(config.zones.topRight.color);
  const topLeftColors = getZoneColors(config.zones.topLeft.color);
  const bottomRightColors = getZoneColors(config.zones.bottomRight.color);
  const bottomLeftColors = getZoneColors(config.zones.bottomLeft.color);

  const showLabels = config.guidedView !== false;

  return (
    <div className="relative w-full max-w-[400px] mx-auto" data-testid={`timing-quadrant-${config.id}`}>
      <svg 
        viewBox={`0 0 ${chartSize} ${chartSize}`} 
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id={`tTopRightGradient-${config.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={topRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topRightColors.gradient} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`tTopLeftGradient-${config.id}`} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={topLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={topLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`tBottomRightGradient-${config.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bottomRightColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomRightColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id={`tBottomLeftGradient-${config.id}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={bottomLeftColors.gradient} stopOpacity="0.08" />
            <stop offset="100%" stopColor={bottomLeftColors.gradient} stopOpacity="0.12" />
          </linearGradient>
          <filter id={`tGlow-${config.id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect 
          x={padding} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#tTopLeftGradient-${config.id})`}
        />
        <rect 
          x={center} 
          y={padding} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#tTopRightGradient-${config.id})`}
        />
        <rect 
          x={padding} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#tBottomLeftGradient-${config.id})`}
        />
        <rect 
          x={center} 
          y={center} 
          width={innerSize / 2} 
          height={innerSize / 2} 
          fill={`url(#tBottomRightGradient-${config.id})`}
        />

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

        {showLabels && (
          <>
            <text 
              x={center} 
              y={chartSize - 16} 
              textAnchor="middle" 
              className="text-xs fill-muted-foreground"
            >
              {config.xLabel}
            </text>
            <text 
              x={16} 
              y={center} 
              textAnchor="middle" 
              className="text-xs fill-muted-foreground"
              transform={`rotate(-90, 16, ${center})`}
            >
              {config.yLabel}
            </text>
          </>
        )}

        <g filter={`url(#tGlow-${config.id})`}>
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
      
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: '14%' }}>
          <div className="relative w-full h-full">
            <div className="absolute pointer-events-auto" style={{ left: '25%', top: '10%', transform: 'translateX(-50%)' }}>
              {config.zones.topLeft.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("text-xs font-medium cursor-help flex items-center gap-1", topLeftColors.label)}>
                      {config.zones.topLeft.label}
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-xs">{config.zones.topLeft.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className={cn("text-xs font-medium", topLeftColors.label)}>
                  {config.zones.topLeft.label}
                </span>
              )}
            </div>
            
            <div className="absolute pointer-events-auto" style={{ left: '75%', top: '10%', transform: 'translateX(-50%)' }}>
              {config.zones.topRight.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("text-xs font-medium cursor-help flex items-center gap-1", topRightColors.label)}>
                      {config.zones.topRight.label}
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-xs">{config.zones.topRight.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className={cn("text-xs font-medium", topRightColors.label)}>
                  {config.zones.topRight.label}
                </span>
              )}
            </div>
            
            <div className="absolute pointer-events-auto" style={{ left: '25%', bottom: '8%', transform: 'translateX(-50%)' }}>
              {config.zones.bottomLeft.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("text-xs font-medium cursor-help flex items-center gap-1", bottomLeftColors.label)}>
                      {config.zones.bottomLeft.label}
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{config.zones.bottomLeft.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className={cn("text-xs font-medium", bottomLeftColors.label)}>
                  {config.zones.bottomLeft.label}
                </span>
              )}
            </div>
            
            <div className="absolute pointer-events-auto" style={{ left: '75%', bottom: '8%', transform: 'translateX(-50%)' }}>
              {config.zones.bottomRight.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("text-xs font-medium cursor-help flex items-center gap-1", bottomRightColors.label)}>
                      {config.zones.bottomRight.label}
                      <HelpCircle className="w-3 h-3 opacity-60" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">{config.zones.bottomRight.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className={cn("text-xs font-medium", bottomRightColors.label)}>
                  {config.zones.bottomRight.label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
