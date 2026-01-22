import type { TrendChartData, TimingSignalStatus } from "@shared/schema";

interface TrendChartProps {
  data: TrendChartData;
  status: TimingSignalStatus;
}

function getAccentColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "#10b981";
    case "yellow":
      return "#f59e0b";
    case "red":
      return "#f43f5e";
  }
}

interface SwingPoint {
  index: number;
  value: number;
  type: 'high' | 'low';
}

function findSwingPoints(prices: number[], windowSize: number = 4): SwingPoint[] {
  const swings: SwingPoint[] = [];
  
  for (let i = windowSize; i < prices.length - windowSize; i++) {
    const windowBefore = prices.slice(i - windowSize, i);
    const windowAfter = prices.slice(i + 1, i + windowSize + 1);
    const current = prices[i];
    
    const isLocalHigh = windowBefore.every(p => p <= current) && windowAfter.every(p => p <= current);
    const isLocalLow = windowBefore.every(p => p >= current) && windowAfter.every(p => p >= current);
    
    if (isLocalHigh && (swings.length === 0 || swings[swings.length - 1].type !== 'high')) {
      swings.push({ index: i, value: current, type: 'high' });
    } else if (isLocalLow && (swings.length === 0 || swings[swings.length - 1].type !== 'low')) {
      swings.push({ index: i, value: current, type: 'low' });
    }
  }
  
  return swings;
}

export function TrendChart({ data, status }: TrendChartProps) {
  const { prices } = data;
  
  if (!prices || prices.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const padding = { top: 12, right: 12, bottom: 12, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = Math.min(...prices);
  const maxValue = Math.max(...prices);
  const valueRange = maxValue - minValue || 1;

  const scaleX = (index: number) => padding.left + (index / (prices.length - 1)) * chartWidth;
  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const pricePath = prices
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p)}`)
    .join(" ");

  const swingPoints = findSwingPoints(prices, 3);
  const highs = swingPoints.filter(s => s.type === 'high');
  const lows = swingPoints.filter(s => s.type === 'low');
  
  const highsGuidePath = highs.length >= 2 
    ? highs.map((h, i) => `${i === 0 ? "M" : "L"} ${scaleX(h.index)} ${scaleY(h.value)}`).join(" ")
    : null;
  const lowsGuidePath = lows.length >= 2
    ? lows.map((l, i) => `${i === 0 ? "M" : "L"} ${scaleX(l.index)} ${scaleY(l.value)}`).join(" ")
    : null;

  const accentColor = getAccentColor(status);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="trend-chart"
    >
      {highsGuidePath && (
        <path
          d={highsGuidePath}
          fill="none"
          stroke={accentColor}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.4"
        />
      )}
      {lowsGuidePath && (
        <path
          d={lowsGuidePath}
          fill="none"
          stroke={accentColor}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.4"
        />
      )}
      
      <path
        d={pricePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/70"
      />

      {highs.map((swing, i) => (
        <circle
          key={`high-${i}`}
          cx={scaleX(swing.index)}
          cy={scaleY(swing.value)}
          r="4"
          fill={accentColor}
        />
      ))}
      {lows.map((swing, i) => (
        <circle
          key={`low-${i}`}
          cx={scaleX(swing.index)}
          cy={scaleY(swing.value)}
          r="4"
          fill={accentColor}
        />
      ))}
    </svg>
  );
}
