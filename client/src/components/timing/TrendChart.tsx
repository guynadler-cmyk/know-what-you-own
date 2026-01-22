import type { TrendChartData, TimingSignalStatus } from "@shared/schema";

interface TrendChartProps {
  data: TrendChartData;
  status: TimingSignalStatus;
}

interface SwingPoint {
  index: number;
  value: number;
  type: 'high' | 'low';
}

function findStructuralSwings(prices: number[], windowSize: number = 8): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (prices.length < windowSize * 2 + 1) return swings;
  
  for (let i = windowSize; i < prices.length - windowSize; i++) {
    const windowBefore = prices.slice(i - windowSize, i);
    const windowAfter = prices.slice(i + 1, i + windowSize + 1);
    const current = prices[i];
    
    const isLocalHigh = windowBefore.every(p => p <= current) && windowAfter.every(p => p <= current);
    const isLocalLow = windowBefore.every(p => p >= current) && windowAfter.every(p => p >= current);
    
    if (isLocalHigh) {
      if (swings.length === 0 || swings[swings.length - 1].type !== 'high') {
        swings.push({ index: i, value: current, type: 'high' });
      } else if (current > swings[swings.length - 1].value) {
        swings[swings.length - 1] = { index: i, value: current, type: 'high' };
      }
    } else if (isLocalLow) {
      if (swings.length === 0 || swings[swings.length - 1].type !== 'low') {
        swings.push({ index: i, value: current, type: 'low' });
      } else if (current < swings[swings.length - 1].value) {
        swings[swings.length - 1] = { index: i, value: current, type: 'low' };
      }
    }
  }
  
  return swings.slice(-6);
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
  const padding = { top: 12, right: 40, bottom: 12, left: 12 };
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

  const swingPoints = findStructuralSwings(prices, 6);
  const highs = swingPoints.filter(s => s.type === 'high');
  const lows = swingPoints.filter(s => s.type === 'low');
  
  const projectionX = width - padding.right + 15;
  const projectionWidth = 8;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="trend-chart"
    >
      <path
        d={pricePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/30"
      />

      {highs.map((swing, i) => (
        <circle
          key={`high-main-${i}`}
          cx={scaleX(swing.index)}
          cy={scaleY(swing.value)}
          r="5"
          fill="#10b981"
        />
      ))}
      {lows.map((swing, i) => (
        <rect
          key={`low-main-${i}`}
          x={scaleX(swing.index) - 4}
          y={scaleY(swing.value) - 4}
          width="8"
          height="8"
          fill="#f43f5e"
        />
      ))}

      <line
        x1={projectionX}
        y1={padding.top}
        x2={projectionX}
        y2={height - padding.bottom}
        stroke="currentColor"
        strokeWidth="1"
        className="text-muted-foreground/20"
      />

      {highs.map((swing, i) => (
        <g key={`high-proj-${i}`}>
          <circle
            cx={projectionX}
            cy={scaleY(swing.value)}
            r="4"
            fill="#10b981"
          />
          {i > 0 && (
            <line
              x1={projectionX}
              y1={scaleY(highs[i - 1].value)}
              x2={projectionX}
              y2={scaleY(swing.value)}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          )}
        </g>
      ))}

      {lows.map((swing, i) => (
        <g key={`low-proj-${i}`}>
          <rect
            x={projectionX - 3}
            y={scaleY(swing.value) - 3}
            width="6"
            height="6"
            fill="#f43f5e"
          />
          {i > 0 && (
            <line
              x1={projectionX}
              y1={scaleY(lows[i - 1].value)}
              x2={projectionX}
              y2={scaleY(swing.value)}
              stroke="#f43f5e"
              strokeWidth="2"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
