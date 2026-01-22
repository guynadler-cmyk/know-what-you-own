import type { MomentumChartData, TimingSignalStatus } from "@shared/schema";

interface MomentumChartProps {
  data: MomentumChartData;
  status: TimingSignalStatus;
}

function getPressureLabel(values: number[]): string {
  if (values.length === 0) return "";
  
  const recent = values.slice(-10);
  const positiveCount = recent.filter(v => v > 0).length;
  const negativeCount = recent.filter(v => v < 0).length;
  const latestValue = values[values.length - 1];
  const prevValue = values.length > 1 ? values[values.length - 2] : 0;
  
  if (positiveCount >= 7) {
    return latestValue > prevValue ? "Positive pressure building" : "Positive pressure holding";
  } else if (negativeCount >= 7) {
    return latestValue < prevValue ? "Downward pressure intensifying" : "Downward pressure persisting";
  } else if (latestValue > 0 && prevValue < 0) {
    return "Pressure shifting upward";
  } else if (latestValue < 0 && prevValue > 0) {
    return "Pressure shifting downward";
  }
  return "Mixed pressure";
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
  const height = 140;
  const padding = { top: 15, right: 15, bottom: 25, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const centerY = padding.top + chartHeight / 2;

  const barWidth = (chartWidth / values.length) * 0.75;
  const barGap = (chartWidth / values.length) * 0.25;

  const positiveCount = values.filter(v => v > 0).length;
  const negativeCount = values.filter(v => v < 0).length;
  const dominantPressure = negativeCount > positiveCount ? 'negative' : 'positive';
  
  const amplificationFactor = dominantPressure === 'negative' ? 1.3 : 1.0;
  const diminishFactor = dominantPressure === 'negative' ? 0.8 : 1.0;

  const pressureLabel = getPressureLabel(values);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="momentum-chart"
    >
      <defs>
        <linearGradient id="positive-pressure" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="negative-pressure" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="flow-direction" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor={dominantPressure === 'negative' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'} />
          <stop offset="100%" stopColor={dominantPressure === 'negative' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'} />
        </linearGradient>
        <filter id="pressure-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight}
        fill="url(#flow-direction)"
      />
      
      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="currentColor"
        strokeWidth="1"
        className="text-muted-foreground/20"
      />
      
      {values.map((value, i) => {
        const x = padding.left + (i / values.length) * chartWidth + barGap / 2;
        const intensityValue = intensity[i] || 0.5;
        
        const adjustedValue = value < 0 
          ? value * amplificationFactor 
          : value * diminishFactor;
        
        const baseHeight = Math.abs(adjustedValue) * (chartHeight / 2) * 0.85;
        const barHeight = baseHeight * (0.7 + intensityValue * 0.5);
        const y = value >= 0 ? centerY - barHeight : centerY;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(1, barHeight)}
            fill={value >= 0 ? "url(#positive-pressure)" : "url(#negative-pressure)"}
            rx="2"
            filter={i > values.length - 5 ? "url(#pressure-glow)" : undefined}
          />
        );
      })}

      <path
        d={values.map((v, i) => {
          const x = padding.left + (i / values.length) * chartWidth + barWidth / 2 + barGap / 2;
          const adjustedV = v < 0 ? v * amplificationFactor : v * diminishFactor;
          const y = centerY - adjustedV * (chartHeight / 2) * 0.85;
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/50"
      />

      {dominantPressure === 'negative' && (
        <>
          <line
            x1={width - padding.right - 30}
            y1={centerY + 15}
            x2={width - padding.right - 10}
            y2={centerY + 25}
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <polygon
            points={`${width - padding.right - 10},${centerY + 25} ${width - padding.right - 16},${centerY + 20} ${width - padding.right - 14},${centerY + 27}`}
            fill="#f43f5e"
            opacity="0.6"
          />
        </>
      )}
      {dominantPressure === 'positive' && (
        <>
          <line
            x1={width - padding.right - 30}
            y1={centerY - 15}
            x2={width - padding.right - 10}
            y2={centerY - 25}
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <polygon
            points={`${width - padding.right - 10},${centerY - 25} ${width - padding.right - 16},${centerY - 20} ${width - padding.right - 14},${centerY - 27}`}
            fill="#10b981"
            opacity="0.6"
          />
        </>
      )}

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
        {pressureLabel}
      </text>
    </svg>
  );
}
