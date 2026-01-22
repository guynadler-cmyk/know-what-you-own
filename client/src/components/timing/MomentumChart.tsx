import type { MomentumChartData, TimingSignalStatus } from "@shared/schema";

interface MomentumChartProps {
  data: MomentumChartData;
  status: TimingSignalStatus;
}

function getPositiveColor(intensity: number): string {
  const alpha = 0.3 + intensity * 0.7;
  return `rgba(16, 185, 129, ${alpha})`;
}

function getNegativeColor(intensity: number): string {
  const alpha = 0.3 + intensity * 0.7;
  return `rgba(244, 63, 94, ${alpha})`;
}

export function MomentumChart({ data, status }: MomentumChartProps) {
  const { values, intensity } = data;
  
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

  const barWidth = (chartWidth / values.length) * 0.7;
  const barGap = (chartWidth / values.length) * 0.3;

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
        strokeWidth="1"
        className="text-muted-foreground/30"
      />
      
      {values.map((value, i) => {
        const x = padding.left + (i / values.length) * chartWidth + barGap / 2;
        const barHeight = Math.abs(value) * (chartHeight / 2) * 0.85;
        const y = value >= 0 ? centerY - barHeight : centerY;
        const intensityValue = intensity[i] || 0.5;
        const color = value >= 0 ? getPositiveColor(intensityValue) : getNegativeColor(intensityValue);

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx="1"
          />
        );
      })}

      <path
        d={values.map((v, i) => {
          const x = padding.left + (i / values.length) * chartWidth + barWidth / 2 + barGap / 2;
          const y = centerY - v * (chartHeight / 2) * 0.85;
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/60"
      />
    </svg>
  );
}
