import type { StretchChartData, TimingSignalStatus } from "@shared/schema";

interface StretchChartProps {
  data: StretchChartData;
  status: TimingSignalStatus;
}

export function StretchChart({ data, status }: StretchChartProps) {
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
  const padding = { top: 12, right: 12, bottom: 12, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const centerY = padding.top + chartHeight / 2;

  const scaleX = (index: number) => padding.left + (index / (values.length - 1)) * chartWidth;
  const scaleY = (value: number) => centerY - value * (chartHeight / 2) * 0.85;

  const pricePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const gapPath = values.map((v, i) => {
    const x = scaleX(i);
    const y = scaleY(v);
    return i === 0 ? `M ${x} ${centerY} L ${x} ${y}` : `L ${x} ${y}`;
  }).join(" ") + 
    values.slice().reverse().map((_, i) => {
      const originalIndex = values.length - 1 - i;
      return `L ${scaleX(originalIndex)} ${centerY}`;
    }).join(" ") + " Z";

  const latestValue = values[values.length - 1];
  const absLatest = Math.abs(latestValue);
  const tensionOpacity = 0.15 + absLatest * 0.3;
  const tensionColor = absLatest > 0.5 ? `rgba(244, 63, 94, ${tensionOpacity})` : `rgba(245, 158, 11, ${tensionOpacity})`;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="stretch-chart"
    >
      <path
        d={gapPath}
        fill={tensionColor}
      />

      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="#10b981"
        strokeWidth="4"
      />

      <path
        d={pricePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/50"
      />
    </svg>
  );
}
