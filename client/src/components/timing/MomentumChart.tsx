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
  const centerX = width / 2;
  const centerY = height / 2;

  const latestShort = shortEma[shortEma.length - 1];
  const latestLong = longEma[longEma.length - 1];
  
  const separation = (latestShort - latestLong) * 15;
  const clampedSeparation = Math.max(-40, Math.min(40, separation));
  
  const prevShort = shortEma.length > 5 ? shortEma[shortEma.length - 6] : latestShort;
  const prevLong = longEma.length > 5 ? longEma[longEma.length - 6] : latestLong;
  const prevSeparation = (prevShort - prevLong) * 15;
  
  const isConverging = Math.abs(separation) < Math.abs(prevSeparation);
  const isDiverging = !isConverging;
  
  const shortTermY = centerY - clampedSeparation;
  
  const forceDirection = separation > 0 ? 'up' : separation < 0 ? 'down' : 'neutral';
  const forceColor = forceDirection === 'up' ? '#10b981' : forceDirection === 'down' ? '#f43f5e' : 'currentColor';
  
  const absForce = Math.abs(clampedSeparation);
  const forceOpacity = 0.3 + (absForce / 40) * 0.5;

  const longTermRadius = 24;
  const shortTermRadius = 12;

  const arrowAngle = separation > 0 ? -90 : 90;
  const arrowLength = Math.min(20, absForce * 0.5);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      data-testid="momentum-chart"
    >
      <circle
        cx={centerX}
        cy={centerY}
        r={longTermRadius}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/30"
      />

      <circle
        cx={centerX}
        cy={shortTermY}
        r={shortTermRadius}
        fill={forceColor}
        opacity={forceOpacity}
        className="transition-all duration-500 ease-out"
      />

      {absForce > 5 && (
        <g className="transition-opacity duration-300" style={{ opacity: 0.5 }}>
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX}
            y2={shortTermY + (separation > 0 ? shortTermRadius : -shortTermRadius)}
            stroke={forceColor}
            strokeWidth="2"
            strokeDasharray="4 3"
            className="transition-all duration-500"
          />
        </g>
      )}

      {isDiverging && absForce > 10 && (
        <g 
          transform={`translate(${centerX + 40}, ${(centerY + shortTermY) / 2}) rotate(${arrowAngle})`}
          className="transition-all duration-500"
          style={{ opacity: forceOpacity }}
        >
          <line
            x1={0}
            y1={0}
            x2={arrowLength}
            y2={0}
            stroke={forceColor}
            strokeWidth="2"
          />
          <path
            d={`M ${arrowLength - 5} -4 L ${arrowLength} 0 L ${arrowLength - 5} 4`}
            fill="none"
            stroke={forceColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {isConverging && (
        <g 
          className="transition-opacity duration-500"
          style={{ opacity: 0.4 }}
        >
          <line
            x1={centerX - 50}
            y1={shortTermY}
            x2={centerX - 35}
            y2={centerY}
            stroke={forceColor}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d={`M ${centerX - 38} ${centerY + (separation > 0 ? 4 : -4)} L ${centerX - 35} ${centerY} L ${centerX - 32} ${centerY + (separation > 0 ? 4 : -4)}`}
            fill="none"
            stroke={forceColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      <g 
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: showOverlay ? 1 : 0, pointerEvents: showOverlay ? 'auto' : 'none' }}
      >
        <circle
          cx={centerX - 100}
          cy={centerY}
          r={longTermRadius * 0.6}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.3"
        />
        <circle
          cx={centerX - 100}
          cy={centerY - 8}
          r={shortTermRadius * 0.6}
          fill="#10b981"
          opacity="0.25"
        />
        <line
          x1={centerX - 100}
          y1={centerY - 8}
          x2={centerX - 100}
          y2={centerY}
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity="0.4"
        />
        <path
          d={`M ${centerX - 103} ${centerY - 3} L ${centerX - 100} ${centerY} L ${centerX - 97} ${centerY - 3}`}
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </g>
    </svg>
  );
}
