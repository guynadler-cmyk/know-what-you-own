import type { MomentumChartData, TimingSignalStatus } from "@shared/schema";

interface MomentumChartProps {
  data: MomentumChartData;
  status: TimingSignalStatus;
  showOverlay?: boolean;
}

export function MomentumChart({ data, status, showOverlay = false }: MomentumChartProps) {
  const { shortEma, longEma } = data;
  
  if (!shortEma || !longEma || shortEma.length === 0 || longEma.length === 0) {
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

  const scaleX = (index: number) => padding.left + (index / (shortEma.length - 1)) * chartWidth;
  const scaleY = (value: number) => padding.top + chartHeight - value * chartHeight;

  const longEmaPath = longEma
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const shortEmaPath = shortEma
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const gapSegments: { path: string; isAbove: boolean }[] = [];
  let currentSegmentStart = 0;
  let currentIsAbove = shortEma[0] > longEma[0];
  
  for (let i = 1; i <= shortEma.length; i++) {
    const atEnd = i === shortEma.length;
    const isAbove = atEnd ? currentIsAbove : shortEma[i] > longEma[i];
    
    if (isAbove !== currentIsAbove || atEnd) {
      const segmentIndices = [];
      for (let j = currentSegmentStart; j < i; j++) {
        segmentIndices.push(j);
      }
      
      if (segmentIndices.length > 0) {
        const pathTop = segmentIndices.map((idx, pi) => {
          const x = scaleX(idx);
          const y = scaleY(shortEma[idx]);
          return pi === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(" ");
        
        const pathBottom = segmentIndices.slice().reverse().map((idx) => {
          const x = scaleX(idx);
          const y = scaleY(longEma[idx]);
          return `L ${x} ${y}`;
        }).join(" ");
        
        gapSegments.push({
          path: pathTop + pathBottom + " Z",
          isAbove: currentIsAbove
        });
      }
      
      currentSegmentStart = i;
      currentIsAbove = isAbove;
    }
  }

  const latestShort = shortEma[shortEma.length - 1];
  const latestLong = longEma[longEma.length - 1];
  const isCurrentlyAbove = latestShort > latestLong;

  const overlayStartX = padding.left + chartWidth * 0.15;
  const overlayEndX = padding.left + chartWidth * 0.45;
  const overlayMidX = (overlayStartX + overlayEndX) / 2;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="momentum-chart"
    >
      {gapSegments.map((segment, i) => (
        <path
          key={`gap-${i}`}
          d={segment.path}
          fill={segment.isAbove ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)"}
        />
      ))}

      <line
        x1={padding.left}
        y1={centerY}
        x2={width - padding.right}
        y2={centerY}
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/40"
      />

      <path
        d={shortEmaPath}
        fill="none"
        stroke={isCurrentlyAbove ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g 
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: showOverlay ? 1 : 0, pointerEvents: showOverlay ? 'auto' : 'none' }}
      >
          <defs>
            <linearGradient id="overlayFade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="20%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="80%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <rect
            x={overlayStartX - 10}
            y={padding.top}
            width={overlayEndX - overlayStartX + 20}
            height={chartHeight}
            fill="url(#overlayFade)"
            className="text-primary"
          />
          
          <path
            d={`M ${overlayStartX} ${centerY + 20} 
                Q ${overlayMidX - 20} ${centerY + 15}, ${overlayMidX} ${centerY + 5}
                Q ${overlayMidX + 20} ${centerY - 5}, ${overlayEndX} ${centerY - 8}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />
          
          <path
            d={`M ${overlayStartX} ${centerY} L ${overlayEndX} ${centerY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.3"
            className="text-muted-foreground"
          />
          
          <circle
            cx={overlayMidX}
            cy={centerY + 5}
            r="3"
            fill="#10b981"
            opacity="0.6"
          />
          <circle
            cx={overlayEndX - 15}
            cy={centerY - 5}
            r="3"
            fill="#10b981"
            opacity="0.6"
          />
        </g>
    </svg>
  );
}
