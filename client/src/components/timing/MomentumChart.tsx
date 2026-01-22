import type { MomentumChartData, TimingSignalStatus } from "@shared/schema";

interface MomentumChartProps {
  data: MomentumChartData;
  status: TimingSignalStatus;
}

export function MomentumChart({ data, status }: MomentumChartProps) {
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

  const scaleX = (index: number) => padding.left + (index / (shortEma.length - 1)) * chartWidth;
  const scaleY = (value: number) => padding.top + chartHeight - value * chartHeight;

  const longEmaPath = longEma
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const shortEmaPath = shortEma
    .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`)
    .join(" ");

  const gapPath = shortEma.map((v, i) => {
    const x = scaleX(i);
    const yShort = scaleY(v);
    const yLong = scaleY(longEma[i]);
    return i === 0 ? `M ${x} ${yLong} L ${x} ${yShort}` : `L ${x} ${yShort}`;
  }).join(" ") + 
    shortEma.slice().reverse().map((_, i) => {
      const originalIndex = shortEma.length - 1 - i;
      return `L ${scaleX(originalIndex)} ${scaleY(longEma[originalIndex])}`;
    }).join(" ") + " Z";

  const latestShort = shortEma[shortEma.length - 1];
  const latestLong = longEma[longEma.length - 1];
  const isAbove = latestShort > latestLong;
  const gapColor = isAbove ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)";

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      preserveAspectRatio="none"
      data-testid="momentum-chart"
    >
      <path
        d={gapPath}
        fill={gapColor}
      />

      <path
        d={longEmaPath}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/50"
      />

      <path
        d={shortEmaPath}
        fill="none"
        stroke={isAbove ? "#10b981" : "#f43f5e"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
