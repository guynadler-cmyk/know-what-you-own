import type { StretchChartData, TimingSignalStatus } from "@shared/schema";

interface StretchChartProps {
  data: StretchChartData;
  status: TimingSignalStatus;
  showOverlay?: boolean;
}

export function StretchChart({ data, status, showOverlay = false }: StretchChartProps) {
  const { values } = data;
  
  if (!values || values.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;

  const latestValue = values[values.length - 1];
  const prevValue = values.length > 5 ? values[values.length - 6] : latestValue;
  
  const maxStretch = 60;
  const stretchDistance = latestValue * maxStretch;
  const clampedStretch = Math.max(-maxStretch, Math.min(maxStretch, stretchDistance));
  
  const markerY = centerY - clampedStretch;
  
  const isReturning = Math.abs(latestValue) < Math.abs(prevValue);
  const isStretching = !isReturning;
  
  const absStretch = Math.abs(clampedStretch);
  const stretchRatio = absStretch / maxStretch;
  
  const balanceZoneHeight = 16;
  
  const stretchColor = stretchRatio > 0.6 ? '#f43f5e' : 
                       stretchRatio > 0.3 ? '#f59e0b' : 
                       '#10b981';
  
  const markerOpacity = 0.5 + stretchRatio * 0.5;
  const markerSize = 8 + stretchRatio * 6;

  const directionHintLength = 15 + stretchRatio * 10;
  const hintDirection = isReturning ? 'returning' : 'stretching';

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      data-testid="stretch-chart"
    >
      <defs>
        <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="40%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        x={centerX - 60}
        y={centerY - balanceZoneHeight}
        width={120}
        height={balanceZoneHeight * 2}
        fill="url(#balanceGradient)"
        rx="4"
      />

      <line
        x1={centerX - 50}
        y1={centerY}
        x2={centerX + 50}
        y2={centerY}
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />

      {absStretch > 5 && (
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX}
          y2={markerY}
          stroke={stretchColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.4"
          className="transition-all duration-500"
        />
      )}

      <circle
        cx={centerX}
        cy={markerY}
        r={markerSize}
        fill={stretchColor}
        opacity={markerOpacity}
        className="transition-all duration-500 ease-out"
      />

      {absStretch > 8 && (
        <g 
          className="transition-all duration-500"
          style={{ opacity: 0.5 }}
        >
          {hintDirection === 'returning' ? (
            <path
              d={`M ${centerX + 20} ${markerY} 
                  Q ${centerX + 25} ${(markerY + centerY) / 2}, ${centerX + 20} ${centerY + (latestValue > 0 ? -5 : 5)}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          ) : (
            <g transform={`translate(${centerX + 20}, ${markerY})`}>
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={latestValue > 0 ? -directionHintLength : directionHintLength}
                stroke={stretchColor}
                strokeWidth="1.5"
              />
              <path
                d={latestValue > 0 
                  ? `M -4 ${-directionHintLength + 5} L 0 ${-directionHintLength} L 4 ${-directionHintLength + 5}`
                  : `M -4 ${directionHintLength - 5} L 0 ${directionHintLength} L 4 ${directionHintLength - 5}`
                }
                fill="none"
                stroke={stretchColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
        </g>
      )}

      <g 
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: showOverlay ? 1 : 0, pointerEvents: showOverlay ? 'auto' : 'none' }}
      >
        <rect
          x={centerX - 120}
          y={centerY - balanceZoneHeight * 0.8}
          width={40}
          height={balanceZoneHeight * 1.6}
          fill="#10b981"
          opacity="0.1"
          rx="3"
        />
        <line
          x1={centerX - 110}
          y1={centerY}
          x2={centerX - 90}
          y2={centerY}
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle
          cx={centerX - 100}
          cy={centerY}
          r={5}
          fill="#10b981"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
