import { lazy, Suspense } from "react";
import { YearsToDoubling } from "@shared/schema";

const LazyDoublingChart = lazy(() => import("./YearsToDoublingChart"));

interface YearsToDoublingCardProps {
  data: YearsToDoubling;
  companyName: string;
}

export function YearsToDoublingCard({ data, companyName }: YearsToDoublingCardProps) {
  const formattedData = data.chartData.map((point) => ({
    year: point.year,
    value: point.value,
  }));

  const investmentValue = data.chartData[0]?.value || 0;
  const projectedValue = data.chartData[data.chartData.length - 1]?.value || 0;
  const maxYear = data.chartData[data.chartData.length - 1]?.year || 30;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12">
      <div className="mb-8">
        <p className="text-lg sm:text-xl font-light mb-2 opacity-90">
          {companyName} is on track for
        </p>
        <h3 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4">
          ${investmentValue.toLocaleString()}
        </h3>
        <p className="text-2xl sm:text-3xl md:text-4xl font-light">
          doubling at the current pace every{" "}
          <span className="font-bold">{data.years.toFixed(1)} years</span>
        </p>
      </div>

      <div className="h-48 sm:h-64 mb-6">
        <Suspense fallback={<div className="w-full h-full bg-primary-foreground/10 animate-pulse rounded" />}>
          <LazyDoublingChart formattedData={formattedData} maxYear={maxYear} />
        </Suspense>
      </div>

      <div className="flex flex-wrap gap-6 text-sm sm:text-base">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-foreground opacity-90"></div>
          <span>Investment Value: <span className="font-semibold">${investmentValue.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-foreground opacity-90"></div>
          <span>Projected Returns: <span className="font-semibold">${projectedValue.toLocaleString()}</span></span>
        </div>
      </div>
    </div>
  );
}
