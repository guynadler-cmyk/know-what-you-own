import type { StretchChartData, TimingSignalStatus } from "@shared/schema";

interface StretchChartProps {
  data: StretchChartData;
  status: TimingSignalStatus;
}

function getTensionLabel(values: number[], status: TimingSignalStatus): string {
  if (values.length === 0) return "";
  
  const latestValue = values[values.length - 1];
  const absLatest = Math.abs(latestValue);
  const prevValues = values.slice(-5);
  const avgRecent = prevValues.reduce((a, b) => a + Math.abs(b), 0) / prevValues.length;
  const isTensionDecreasing = absLatest < avgRecent;
  
  if (absLatest > 0.6) {
    return latestValue > 0 
      ? "Price stretched high — tension elevated" 
      : "Price compressed low — tension elevated";
  } else if (absLatest > 0.3) {
    if (isTensionDecreasing) {
      return "Tension easing toward equilibrium";
    }
    return latestValue > 0 ? "Warming above balance" : "Cooling below balance";
  }
  return "Near equilibrium — low tension";
}

export function StretchChart({ data, status }: StretchChartProps) {
  const { values, tension } = data;
  
  if (!values || values.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const width = 400;
  const height = 140;
  const padding = { top: 15, right: 15, bottom: 25, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const centerY = padding.top + chartHeight / 2;

  const scaleX = (index: number) => padding.left + (index / (values.length - 1)) * chartWidth;
  const scaleY = (value: number) => centerY - value * (chartHeight / 2) * 0.85;

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const tensionAreaPath = values.map((v, i) => {
    const x = scaleX(i);
    return `${i === 0 ? "M" : "L"} ${x} ${scaleY(v)}`;
  }).join(" ") + ` L ${scaleX(values.length - 1)} ${centerY} L ${padding.left} ${centerY} Z`;

  const latestValue = values[values.length - 1];
  const latestY = scaleY(latestValue);
  const distanceFromCenter = Math.abs(latestY - centerY);

  const tensionLabel = getTensionLabel(values, status);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="stretch-chart"
    >
      <defs>
        <linearGradient id="equilibrium-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="40%" stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="tension-fill-positive" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="tension-fill-negative" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.35" />
        </linearGradient>
        <filter id="equilibrium-blur">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight / 2 - 5}
        fill="url(#tension-fill-positive)"
      />
      <rect
        x={padding.left}
        y={centerY + 5}
        width={chartWidth}
        height={chartHeight / 2 - 5}
        fill="url(#tension-fill-negative)"
      />
      
      <rect
        x={padding.left}
        y={centerY - 8}
        width={chartWidth}
        height="16"
        fill="url(#equilibrium-glow)"
        opacity="0.4"
      />

      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="#10b981"
        strokeWidth="3"
        filter="url(#equilibrium-blur)"
        opacity="0.8"
      />
      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="#10b981"
        strokeWidth="2"
      />

      <text
        x={padding.left + 8}
        y={centerY + 3}
        fontSize="8"
        fontWeight="600"
        fill="#10b981"
        opacity="0.9"
      >
        EQUILIBRIUM
      </text>

      <path
        d={tensionAreaPath}
        fill={latestValue >= 0 ? "url(#tension-fill-positive)" : "url(#tension-fill-negative)"}
        opacity="0.5"
      />

      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/70"
      />

      {values.length > 0 && (
        <>
          <line
            x1={scaleX(values.length - 1)}
            y1={latestY}
            x2={scaleX(values.length - 1)}
            y2={centerY}
            stroke={Math.abs(latestValue) > 0.4 ? "#f43f5e" : Math.abs(latestValue) > 0.2 ? "#f59e0b" : "#10b981"}
            strokeWidth="2"
            strokeDasharray="4 2"
            opacity="0.7"
          />
          
          <circle
            cx={scaleX(values.length - 1)}
            cy={latestY}
            r="7"
            fill={Math.abs(latestValue) > 0.4 ? "#f43f5e" : Math.abs(latestValue) > 0.2 ? "#f59e0b" : "#10b981"}
            stroke="white"
            strokeWidth="2"
          />
          
          {distanceFromCenter > 20 && (
            <text
              x={scaleX(values.length - 1) + 12}
              y={(latestY + centerY) / 2}
              fontSize="8"
              fill="currentColor"
              className="text-muted-foreground"
            >
              {Math.abs(latestValue) > 0.5 ? "high" : "moderate"}
            </text>
          )}
        </>
      )}

      <rect
        x={width / 2 - 85}
        y={height - 20}
        width="170"
        height="16"
        rx="3"
        fill="currentColor"
        className="text-background/80"
      />
      <text
        x={width / 2}
        y={height - 9}
        textAnchor="middle"
        fontSize="9"
        fontWeight="500"
        fill="currentColor"
        className="text-muted-foreground"
      >
        {tensionLabel}
      </text>
    </svg>
  );
}
