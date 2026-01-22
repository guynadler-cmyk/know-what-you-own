import type { TrendChartData, TimingSignalStatus } from "@shared/schema";

interface TrendChartProps {
  data: TrendChartData;
  status: TimingSignalStatus;
  timeHorizon?: string;
}

interface SwingPoint {
  index: number;
  value: number;
  type: 'high' | 'low';
  confirmed: boolean;
}

function calculateATR(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return (Math.max(...prices) - Math.min(...prices)) * 0.05;
  
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    atrSum += Math.abs(prices[i] - prices[i - 1]);
  }
  return atrSum / period;
}

function zigzag(prices: number[], thresholdPercent: number, confirmationBars: number = 5): SwingPoint[] {
  if (prices.length < 3) return [];
  
  const swings: SwingPoint[] = [];
  let trend: 'up' | 'down' | null = null;
  let pivotIndex = 0;
  let pivotValue = prices[0];
  const lastConfirmableIndex = prices.length - 1 - confirmationBars;
  
  for (let i = 1; i < prices.length; i++) {
    const price = prices[i];
    const changePercent = ((price - pivotValue) / pivotValue) * 100;
    
    if (trend === null) {
      if (changePercent >= thresholdPercent) {
        swings.push({ 
          index: pivotIndex, 
          value: pivotValue, 
          type: 'low',
          confirmed: pivotIndex <= lastConfirmableIndex
        });
        trend = 'up';
        pivotIndex = i;
        pivotValue = price;
      } else if (changePercent <= -thresholdPercent) {
        swings.push({ 
          index: pivotIndex, 
          value: pivotValue, 
          type: 'high',
          confirmed: pivotIndex <= lastConfirmableIndex
        });
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
          swings.push({ 
            index: pivotIndex, 
            value: pivotValue, 
            type: 'high',
            confirmed: pivotIndex <= lastConfirmableIndex
          });
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
          swings.push({ 
            index: pivotIndex, 
            value: pivotValue, 
            type: 'low',
            confirmed: pivotIndex <= lastConfirmableIndex
          });
          trend = 'up';
          pivotIndex = i;
          pivotValue = price;
        }
      }
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
      { index: 0, value: v0, type: upTrend ? 'low' : 'high', confirmed: true },
      { index: Math.max(1, Math.floor(len / 2)), value: v1, type: upTrend ? 'high' : 'low', confirmed: true },
      { index: Math.max(2, len - 1), value: v2, type: upTrend ? 'low' : 'high', confirmed: true }
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
    { index: startIdx, value: startVal, type: upTrend ? 'low' : 'high', confirmed: true },
    { index: midIdx, value: midVal, type: upTrend ? 'high' : 'low', confirmed: true },
    { index: endIdx, value: endVal, type: upTrend ? 'low' : 'high', confirmed: false }
  ];
}

function findStructuralSwings(prices: number[]): SwingPoint[] {
  if (!prices || prices.length === 0) {
    return guaranteeThreePivots([0, 1, 0]);
  }
  
  if (prices.length < 5) return guaranteeThreePivots(prices);
  
  const atr = calculateATR(prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const baseThreshold = (atr / avgPrice) * 100 * 2.0;
  const minThreshold = 1.0;
  const maxThreshold = 15;
  
  let threshold = Math.max(minThreshold, Math.min(maxThreshold, baseThreshold));
  let swings: SwingPoint[] = [];
  let attempts = 0;
  
  while (attempts < 25) {
    swings = zigzag(prices, threshold);
    
    const highCount = swings.filter(s => s.type === 'high').length;
    const lowCount = swings.filter(s => s.type === 'low').length;
    
    if (highCount >= 3 && highCount <= 6 && lowCount >= 3 && lowCount <= 6) break;
    
    if (highCount < 3 || lowCount < 3) {
      threshold *= 0.6;
      if (threshold < 0.2) break;
    } else if (highCount > 6 || lowCount > 6) {
      threshold *= 1.4;
    }
    
    threshold = Math.max(0.2, Math.min(50, threshold));
    attempts++;
  }
  
  if (swings.length < 6) {
    swings = guaranteeThreePivots(prices);
  }
  
  let highs = swings.filter(s => s.type === 'high');
  let lows = swings.filter(s => s.type === 'low');
  
  if (highs.length > 6) {
    const sorted = highs.map((s, i) => ({
      swing: s,
      amplitude: i === 0 ? Math.abs(s.value - avgPrice) : Math.abs(s.value - highs[i-1].value)
    })).sort((a, b) => b.amplitude - a.amplitude);
    highs = sorted.slice(0, 6).map(a => a.swing).sort((a, b) => a.index - b.index);
  }
  
  if (lows.length > 6) {
    const sorted = lows.map((s, i) => ({
      swing: s,
      amplitude: i === 0 ? Math.abs(s.value - avgPrice) : Math.abs(s.value - lows[i-1].value)
    })).sort((a, b) => b.amplitude - a.amplitude);
    lows = sorted.slice(0, 6).map(a => a.swing).sort((a, b) => a.index - b.index);
  }
  
  return [...highs, ...lows].sort((a, b) => a.index - b.index);
}

export function TrendChart({ data, status, timeHorizon = "~6 months" }: TrendChartProps) {
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
  const confirmedHighs = swingPoints.filter(s => s.type === 'high' && s.confirmed);
  const confirmedLows = swingPoints.filter(s => s.type === 'low' && s.confirmed);
  const unconfirmedPoints = swingPoints.filter(s => !s.confirmed);

  const width = 400;
  const height = 140;
  const padding = { top: 24, right: 48, bottom: 12, left: 12 };
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

  const projectionX = width - padding.right + 20;

  const latestPrice = effectivePrices[effectivePrices.length - 1];
  const latestX = scaleX(effectivePrices.length - 1);
  const latestY = scaleY(latestPrice);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 text-[10px] text-muted-foreground/60 font-medium tracking-wide">
        Structure view: {timeHorizon}
      </div>
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
          className="text-muted-foreground/20"
        />

        {confirmedHighs.map((swing, i) => (
          <circle
            key={`high-main-${i}`}
            cx={scaleX(swing.index)}
            cy={scaleY(swing.value)}
            r="4"
            fill="#10b981"
            opacity="0.9"
          />
        ))}
        {confirmedLows.map((swing, i) => (
          <rect
            key={`low-main-${i}`}
            x={scaleX(swing.index) - 3.5}
            y={scaleY(swing.value) - 3.5}
            width="7"
            height="7"
            fill="#f43f5e"
            opacity="0.9"
          />
        ))}

        {unconfirmedPoints.map((swing, i) => (
          swing.type === 'high' ? (
            <circle
              key={`unconf-high-${i}`}
              cx={scaleX(swing.index)}
              cy={scaleY(swing.value)}
              r="4"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          ) : (
            <rect
              key={`unconf-low-${i}`}
              x={scaleX(swing.index) - 3.5}
              y={scaleY(swing.value) - 3.5}
              width="7"
              height="7"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          )
        ))}

        <circle
          cx={latestX}
          cy={latestY}
          r="3"
          fill="currentColor"
          className="text-muted-foreground/40"
        />

        <line
          x1={projectionX}
          y1={padding.top}
          x2={projectionX}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/10"
        />

        {confirmedHighs.map((swing, i) => (
          <g key={`high-proj-${i}`}>
            <circle
              cx={projectionX}
              cy={scaleY(swing.value)}
              r="3"
              fill="#10b981"
              opacity="0.8"
            />
            {i > 0 && (
              <line
                x1={projectionX}
                y1={scaleY(confirmedHighs[i - 1].value)}
                x2={projectionX}
                y2={scaleY(swing.value)}
                stroke={swing.value < confirmedHighs[i - 1].value ? "#f43f5e" : "#10b981"}
                strokeWidth="1.5"
                opacity="0.5"
              />
            )}
          </g>
        ))}

        {confirmedLows.map((swing, i) => (
          <g key={`low-proj-${i}`}>
            <rect
              x={projectionX - 2.5}
              y={scaleY(swing.value) - 2.5}
              width="5"
              height="5"
              fill="#f43f5e"
              opacity="0.8"
            />
            {i > 0 && (
              <line
                x1={projectionX}
                y1={scaleY(confirmedLows[i - 1].value)}
                x2={projectionX}
                y2={scaleY(swing.value)}
                stroke={swing.value > confirmedLows[i - 1].value ? "#10b981" : "#f43f5e"}
                strokeWidth="1.5"
                opacity="0.5"
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
