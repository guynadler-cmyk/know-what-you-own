import type { StretchChartData, TimingSignalStatus } from "@shared/schema";

interface StretchChartProps {
  data: StretchChartData;
  status: TimingSignalStatus;
}

function getColorForValue(value: number): string {
  const absValue = Math.abs(value);
  if (absValue > 0.6) {
    return "#f43f5e";
  } else if (absValue > 0.3) {
    return "#f59e0b";
  }
  return "#10b981";
}

function getOpacityForTension(tension: number): number {
  return 0.4 + tension * 0.6;
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
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const centerY = padding.top + chartHeight / 2;

  const scaleX = (index: number) => padding.left + (index / (values.length - 1)) * chartWidth;
  const scaleY = (value: number) => centerY - value * (chartHeight / 2) * 0.85;

  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const points = values.map((v, i) => ({
    x: scaleX(i),
    y: scaleY(v),
    color: getColorForValue(v),
    opacity: getOpacityForTension(tension[i] || 0.5),
  }));

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="stretch-chart"
    >
      <defs>
        <linearGradient id="stretch-upper-zone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stretch-lower-zone" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight * 0.25}
        fill="url(#stretch-upper-zone)"
      />
      <rect
        x={padding.left}
        y={centerY + chartHeight * 0.25}
        width={chartWidth}
        height={chartHeight * 0.25}
        fill="url(#stretch-lower-zone)"
      />
      
      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-muted-foreground/40"
      />
      
      <line
        x1={padding.left}
        y1={scaleY(0.4)}
        x2={width - padding.right}
        y2={scaleY(0.4)}
        stroke="#f59e0b"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      <line
        x1={padding.left}
        y1={scaleY(-0.4)}
        x2={width - padding.right}
        y2={scaleY(-0.4)}
        stroke="#f59e0b"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        opacity="0.4"
      />

      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/70"
      />

      {points.filter((_, i) => i % 3 === 0 || i === points.length - 1).map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="3"
          fill={point.color}
          opacity={point.opacity}
        />
      ))}

      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill={points[points.length - 1].color}
          stroke="white"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
