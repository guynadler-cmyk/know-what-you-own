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
    const upTrend = v1 > v0;
    return [
      { index: 0, value: v0, type: upTrend ? 'low' : 'high', confirmed: true },
      { index: 1, value: v1, type: upTrend ? 'high' : 'low', confirmed: true },
      { index: 2, value: v0, type: upTrend ? 'low' : 'high', confirmed: true }
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

  const width = 400;
  const height = 140;
  const padding = { top: 28, right: 20, bottom: 16, left: 20 };
  const chartHeight = height - padding.top - padding.bottom;

  const minValue = Math.min(...effectivePrices);
  const maxValue = Math.max(...effectivePrices);
  const valueRange = maxValue - minValue || 1;

  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  const highsX = width * 0.35;
  const lowsX = width * 0.65;

  const highValues = confirmedHighs.map(s => s.value).sort((a, b) => b - a);
  const lowValues = confirmedLows.map(s => s.value).sort((a, b) => a - b);

  const latestHigh = highValues.length > 0 ? Math.max(...confirmedHighs.filter(h => h.index === Math.max(...confirmedHighs.map(x => x.index))).map(h => h.value)) : null;
  const latestLow = lowValues.length > 0 ? Math.min(...confirmedLows.filter(l => l.index === Math.max(...confirmedLows.map(x => x.index))).map(l => l.value)) : null;

  const highsTrending = highValues.length >= 2 ? (highValues[0] > highValues[highValues.length - 1] ? 'up' : 'down') : 'flat';
  const lowsTrending = lowValues.length >= 2 ? (lowValues[lowValues.length - 1] > lowValues[0] ? 'up' : 'down') : 'flat';

  const overallTrend = highsTrending === 'up' && lowsTrending === 'up' ? 'up' : 
                       highsTrending === 'down' && lowsTrending === 'down' ? 'down' : 'unresolved';

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <span className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
          Structure view ({timeHorizon})
        </span>
      </div>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        data-testid="trend-chart"
      >
        <line
          x1={highsX}
          y1={padding.top}
          x2={highsX}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/15"
        />
        <line
          x1={lowsX}
          y1={padding.top}
          x2={lowsX}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted-foreground/15"
        />

        {confirmedHighs.map((swing, i) => {
          const isLatest = swing.value === latestHigh;
          return (
            <circle
              key={`high-${i}`}
              cx={highsX}
              cy={scaleY(swing.value)}
              r={isLatest ? 6 : 4}
              fill={isLatest ? "#10b981" : "#10b981"}
              opacity={isLatest ? 1 : 0.5}
              className="transition-all duration-300"
            />
          );
        })}

        {confirmedLows.map((swing, i) => {
          const isLatest = swing.value === latestLow;
          return (
            <rect
              key={`low-${i}`}
              x={lowsX - (isLatest ? 5 : 3.5)}
              y={scaleY(swing.value) - (isLatest ? 5 : 3.5)}
              width={isLatest ? 10 : 7}
              height={isLatest ? 10 : 7}
              fill="#f43f5e"
              opacity={isLatest ? 1 : 0.5}
              className="transition-all duration-300"
            />
          );
        })}

        {overallTrend === 'up' && (
          <path
            d={`M ${width/2 - 8} ${height - 8} L ${width/2} ${height - 16} L ${width/2 + 8} ${height - 8}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        )}
        {overallTrend === 'down' && (
          <path
            d={`M ${width/2 - 8} ${height - 16} L ${width/2} ${height - 8} L ${width/2 + 8} ${height - 16}`}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
        )}
        {overallTrend === 'unresolved' && (
          <line
            x1={width/2 - 10}
            y1={height - 12}
            x2={width/2 + 10}
            y2={height - 12}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-muted-foreground/40"
          />
        )}
      </svg>
    </div>
  );
}
