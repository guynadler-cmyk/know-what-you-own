import type { MomentumChartData, TimingSignalStatus } from "@shared/schema";

interface MomentumChartProps {
  data: MomentumChartData;
  status: TimingSignalStatus;
}

export function MomentumChart({ data, status }: MomentumChartProps) {
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

  const gapLinePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const gapAreaPath = values.map((v, i) => {
    const x = scaleX(i);
    const y = scaleY(v);
    return i === 0 ? `M ${x} ${centerY} L ${x} ${y}` : `L ${x} ${y}`;
  }).join(" ") + 
    values.slice().reverse().map((_, i) => {
      const originalIndex = values.length - 1 - i;
      return `L ${scaleX(originalIndex)} ${centerY}`;
    }).join(" ") + " Z";

  const latestValue = values[values.length - 1];
  const isPositive = latestValue >= 0;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="momentum-chart"
    >
      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted-foreground/40"
      />

      <path
        d={gapAreaPath}
        fill={isPositive ? "rgba(16, 185, 129, 0.25)" : "rgba(244, 63, 94, 0.3)"}
      />

      <path
        d={gapLinePath}
        fill="none"
        stroke={isPositive ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
