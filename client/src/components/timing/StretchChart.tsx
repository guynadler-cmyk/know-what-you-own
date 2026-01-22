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

  const balanceZoneHeight = chartHeight * 0.25;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="stretch-chart"
    >
      <g 
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: showOverlay ? 1 : 0, pointerEvents: showOverlay ? 'auto' : 'none' }}
      >
          <defs>
            <linearGradient id="balanceZoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="35%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="65%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <rect
            x={padding.left}
            y={centerY - balanceZoneHeight}
            width={chartWidth}
            height={balanceZoneHeight * 2}
            fill="url(#balanceZoneGradient)"
          />
          
          <line
            x1={padding.left}
            y1={centerY - balanceZoneHeight * 0.7}
            x2={width - padding.right}
            y2={centerY - balanceZoneHeight * 0.7}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="6 4"
            opacity="0.2"
          />
          <line
            x1={padding.left}
            y1={centerY + balanceZoneHeight * 0.7}
            x2={width - padding.right}
            y2={centerY + balanceZoneHeight * 0.7}
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="6 4"
            opacity="0.2"
          />
          
          <path
            d={`M ${padding.left + chartWidth * 0.7} ${centerY - balanceZoneHeight * 1.2}
                C ${padding.left + chartWidth * 0.75} ${centerY - balanceZoneHeight * 0.6},
                  ${padding.left + chartWidth * 0.8} ${centerY - balanceZoneHeight * 0.3},
                  ${padding.left + chartWidth * 0.85} ${centerY}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.35"
          />
          <path
            d={`M ${padding.left + chartWidth * 0.2} ${centerY + balanceZoneHeight * 1.3}
                C ${padding.left + chartWidth * 0.25} ${centerY + balanceZoneHeight * 0.7},
                  ${padding.left + chartWidth * 0.3} ${centerY + balanceZoneHeight * 0.3},
                  ${padding.left + chartWidth * 0.35} ${centerY}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.35"
          />
        </g>

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
