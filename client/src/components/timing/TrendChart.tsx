import type { TrendChartData, TimingSignalStatus } from "@shared/schema";

interface TrendChartProps {
  data: TrendChartData;
  status: TimingSignalStatus;
}

function getStrokeColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "#10b981";
    case "yellow":
      return "#f59e0b";
    case "red":
      return "#f43f5e";
  }
}

function getFillColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "rgba(16, 185, 129, 0.12)";
    case "yellow":
      return "rgba(245, 158, 11, 0.12)";
    case "red":
      return "rgba(244, 63, 94, 0.12)";
  }
}

function getStructureLabel(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "Higher highs, higher lows";
    case "yellow":
      return "Structure transitioning";
    case "red":
      return "Lower highs, lower lows";
  }
}

interface SwingPoint {
  index: number;
  value: number;
  type: 'high' | 'low';
}

function findSwingPoints(prices: number[], windowSize: number = 5): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  for (let i = windowSize; i < prices.length - windowSize; i++) {
    const windowBefore = prices.slice(i - windowSize, i);
    const windowAfter = prices.slice(i + 1, i + windowSize + 1);
    const current = prices[i];
    
    const isLocalHigh = windowBefore.every(p => p < current) && windowAfter.every(p => p < current);
    const isLocalLow = windowBefore.every(p => p > current) && windowAfter.every(p => p > current);
    
    if (isLocalHigh) {
      swings.push({ index: i, value: current, type: 'high' });
    } else if (isLocalLow) {
      swings.push({ index: i, value: current, type: 'low' });
    }
  }
  
  return swings;
}

export function TrendChart({ data, status }: TrendChartProps) {
  const { prices, baseline } = data;
  
  if (!prices || prices.length === 0) {
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

  const allValues = [...prices, ...(baseline || [])];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;

  const scaleX = (index: number) => padding.left + (index / (prices.length - 1)) * chartWidth;
  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const pricePath = prices
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p)}`)
    .join(" ");

  const areaPath = `${pricePath} L ${scaleX(prices.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  const baselinePath = baseline && baseline.length > 0
    ? baseline.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p)}`).join(" ")
    : null;

  const swingPoints = findSwingPoints(prices, 4);
  const highs = swingPoints.filter(s => s.type === 'high');
  const lows = swingPoints.filter(s => s.type === 'low');
  
  const highsPath = highs.length >= 2 
    ? highs.map((h, i) => `${i === 0 ? "M" : "L"} ${scaleX(h.index)} ${scaleY(h.value)}`).join(" ")
    : null;
  const lowsPath = lows.length >= 2
    ? lows.map((l, i) => `${i === 0 ? "M" : "L"} ${scaleX(l.index)} ${scaleY(l.value)}`).join(" ")
    : null;

  const structureLabel = getStructureLabel(status);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="trend-chart"
    >
      <defs>
        <linearGradient id={`trend-gradient-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={getFillColor(status)} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <path
        d={areaPath}
        fill={`url(#trend-gradient-${status})`}
      />
      
      {baselinePath && (
        <path
          d={baselinePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground/30"
        />
      )}

      {highsPath && (
        <path
          d={highsPath}
          fill="none"
          stroke={status === 'green' ? '#10b981' : status === 'yellow' ? '#f59e0b' : '#f43f5e'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.5"
        />
      )}
      {lowsPath && (
        <path
          d={lowsPath}
          fill="none"
          stroke={status === 'green' ? '#10b981' : status === 'yellow' ? '#f59e0b' : '#f43f5e'}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.5"
        />
      )}
      
      <path
        d={pricePath}
        fill="none"
        stroke={getStrokeColor(status)}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {highs.map((swing, i) => (
        <g key={`high-${i}`}>
          <circle
            cx={scaleX(swing.index)}
            cy={scaleY(swing.value)}
            r="4"
            fill={getStrokeColor(status)}
            opacity="0.7"
          />
          <line
            x1={scaleX(swing.index)}
            y1={scaleY(swing.value) - 6}
            x2={scaleX(swing.index)}
            y2={scaleY(swing.value) - 12}
            stroke={getStrokeColor(status)}
            strokeWidth="1.5"
            opacity="0.5"
          />
        </g>
      ))}
      {lows.map((swing, i) => (
        <g key={`low-${i}`}>
          <circle
            cx={scaleX(swing.index)}
            cy={scaleY(swing.value)}
            r="4"
            fill={getStrokeColor(status)}
            opacity="0.7"
          />
          <line
            x1={scaleX(swing.index)}
            y1={scaleY(swing.value) + 6}
            x2={scaleX(swing.index)}
            y2={scaleY(swing.value) + 12}
            stroke={getStrokeColor(status)}
            strokeWidth="1.5"
            opacity="0.5"
          />
        </g>
      ))}

      <rect
        x={width / 2 - 75}
        y={height - 20}
        width="150"
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
        {structureLabel}
      </text>
    </svg>
  );
}
