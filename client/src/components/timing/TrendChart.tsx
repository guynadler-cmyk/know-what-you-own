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

function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return (Math.max(...prices) - Math.min(...prices)) * 0.05;
  
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    atrSum += Math.abs(prices[i] - prices[i - 1]);
  }
  return atrSum / period;
}

function zigzag(prices: number[], thresholdPercent: number): SwingPoint[] {
  if (prices.length < 3) return [];
  
  const swings: SwingPoint[] = [];
  let trend: 'up' | 'down' | null = null;
  let pivotIndex = 0;
  let pivotValue = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i];
    const changePercent = ((price - pivotValue) / pivotValue) * 100;
    
    if (trend === null) {
      if (changePercent >= thresholdPercent) {
        swings.push({ index: pivotIndex, value: pivotValue, type: 'low' });
        trend = 'up';
        pivotIndex = i;
        pivotValue = price;
      } else if (changePercent <= -thresholdPercent) {
        swings.push({ index: pivotIndex, value: pivotValue, type: 'high' });
        trend = 'down';
        pivotIndex = i;
        pivotValue = price;
      } else if (price > pivotValue) {
        pivotIndex = i;
        pivotValue = price;
      } else if (price < pivotValue) {
        pivotIndex = i;
        pivotValue = price;
      }
    } else if (trend === 'up') {
      if (price > pivotValue) {
        pivotIndex = i;
        pivotValue = price;
      } else {
        const reversal = ((pivotValue - price) / pivotValue) * 100;
        if (reversal >= thresholdPercent) {
          swings.push({ index: pivotIndex, value: pivotValue, type: 'high' });
          trend = 'down';
          pivotIndex = i;
          pivotValue = price;
        }
      }
    } else {
      if (price < pivotValue) {
        pivotIndex = i;
        pivotValue = price;
      } else {
        const reversal = ((price - pivotValue) / pivotValue) * 100;
        if (reversal >= thresholdPercent) {
          swings.push({ index: pivotIndex, value: pivotValue, type: 'low' });
          trend = 'up';
          pivotIndex = i;
          pivotValue = price;
        }
      }
    }
  }
  
  if (swings.length > 0) {
    const lastSwing = swings[swings.length - 1];
    if (lastSwing.type === 'low' && trend === 'up') {
      swings.push({ index: pivotIndex, value: pivotValue, type: 'high' });
    } else if (lastSwing.type === 'high' && trend === 'down') {
      swings.push({ index: pivotIndex, value: pivotValue, type: 'low' });
    }
  }
  
  return swings;
}

function guaranteeThreePivots(prices: number[]): SwingPoint[] {
  const len = prices.length;
  
  if (len <= 2) {
    const v0 = len > 0 ? prices[0] : 0;
    const v1 = len > 1 ? prices[1] : v0 + 1;
    const v2 = len > 2 ? prices[2] : v0;
    const upTrend = v1 > v0;
    return [
      { index: 0, value: v0, type: upTrend ? 'low' : 'high' },
      { index: Math.max(1, Math.floor(len / 2)), value: v1, type: upTrend ? 'high' : 'low' },
      { index: Math.max(2, len - 1), value: v2, type: upTrend ? 'low' : 'high' }
    ];
  }
  
  const startIdx = 0;
  const midIdx = Math.floor(len / 2);
  const endIdx = len - 1;
  
  const startVal = prices[startIdx];
  const midVal = prices[midIdx];
  const endVal = prices[endIdx];
  
  const upTrend = endVal > startVal;
  
  return [
    { index: startIdx, value: startVal, type: upTrend ? 'low' : 'high' },
    { index: midIdx, value: midVal, type: upTrend ? 'high' : 'low' },
    { index: endIdx, value: endVal, type: upTrend ? 'low' : 'high' }
  ];
}

function findStructuralSwings(prices: number[]): SwingPoint[] {
  if (!prices || prices.length === 0) {
    return guaranteeThreePivots([0, 1, 0]);
  }
  
  if (prices.length < 5) return guaranteeThreePivots(prices);
  
  const atr = calculateATR(prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const baseThreshold = (atr / avgPrice) * 100 * 1.5;
  const minThreshold = 0.3;
  const maxThreshold = 15;
  
  let threshold = Math.max(minThreshold, Math.min(maxThreshold, baseThreshold));
  let swings: SwingPoint[] = [];
  let attempts = 0;
  
  while (attempts < 20) {
    swings = zigzag(prices, threshold);
    
    if (swings.length >= 3 && swings.length <= 6) break;
    
    if (swings.length < 3) {
      threshold *= 0.3;
      if (threshold < 0.05) break;
    } else if (swings.length > 6) {
      threshold *= 1.8;
    }
    
    threshold = Math.max(0.05, Math.min(50, threshold));
    attempts++;
  }
  
  if (swings.length < 3) {
    swings = guaranteeThreePivots(prices);
  }
  
  if (swings.length > 6) {
    const amplitudes = swings.map((s, i) => {
      if (i === 0) return { swing: s, amplitude: Math.abs(s.value - avgPrice) };
      const prev = swings[i - 1];
      return { swing: s, amplitude: Math.abs(s.value - prev.value) };
    });
    amplitudes.sort((a, b) => b.amplitude - a.amplitude);
    const topSwings = amplitudes.slice(0, 6).map(a => a.swing);
    swings = topSwings.sort((a, b) => a.index - b.index);
  }
  
  return swings;
}

export function TrendChart({ data, status }: TrendChartProps) {
  const { prices } = data;
  
  let effectivePrices: number[];
  if (!prices || prices.length === 0) {
    effectivePrices = [100, 110, 95];
  } else if (prices.length === 1) {
    const base = prices[0] || 100;
    effectivePrices = [base * 0.95, base * 1.05, base * 0.97];
  } else if (prices.length === 2) {
    const p0 = prices[0];
    const p1 = prices[1];
    const range = Math.abs(p1 - p0) || Math.max(p0, p1, 1) * 0.05;
    effectivePrices = [p0, p1, p0 - range * 0.5];
  } else {
    effectivePrices = prices;
  }
  
  const swingPoints = findStructuralSwings(effectivePrices);
  const highs = swingPoints.filter(s => s.type === 'high');
  const lows = swingPoints.filter(s => s.type === 'low');

  const width = 400;
  const height = 120;
  const padding = { top: 12, right: 40, bottom: 12, left: 12 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = Math.min(...effectivePrices);
  const maxValue = Math.max(...effectivePrices);
  const valueRange = maxValue - minValue || 1;

  const scaleX = (index: number) => padding.left + (index / Math.max(1, effectivePrices.length - 1)) * chartWidth;
  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const pricePath = effectivePrices
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p)}`)
    .join(" ");

  const projectionX = width - padding.right + 18;

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
        className="text-muted-foreground/25"
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
        className="text-muted-foreground/15"
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
              stroke={swing.value < highs[i - 1].value ? "#f43f5e" : "#10b981"}
              strokeWidth="2"
              opacity="0.7"
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
              stroke={swing.value > lows[i - 1].value ? "#10b981" : "#f43f5e"}
              strokeWidth="2"
              opacity="0.7"
            />
          )}
        </g>
      ))}
    </svg>
  );
}
