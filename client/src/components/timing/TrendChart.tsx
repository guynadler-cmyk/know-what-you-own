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
      return "rgba(16, 185, 129, 0.15)";
    case "yellow":
      return "rgba(245, 158, 11, 0.15)";
    case "red":
      return "rgba(244, 63, 94, 0.15)";
  }
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
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
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
          className="text-muted-foreground/40"
        />
      )}
      
      <path
        d={pricePath}
        fill="none"
        stroke={getStrokeColor(status)}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
