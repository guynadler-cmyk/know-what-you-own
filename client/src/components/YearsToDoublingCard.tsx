import { YearsToDoubling } from "@shared/schema";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface YearsToDoublingCardProps {
  data: YearsToDoubling;
  companyName: string;
}

export function YearsToDoublingCard({ data, companyName }: YearsToDoublingCardProps) {
  // Format the chart data to show growth projection
  const formattedData = data.chartData.map((point) => ({
    year: point.year,
    value: point.value,
  }));

  // Calculate investment and projected values for display
  // Use first and last data points instead of hard-coded indices
  const investmentValue = data.chartData[0]?.value || 0;
  const projectedValue = data.chartData[data.chartData.length - 1]?.value || 0;
  const maxYear = data.chartData[data.chartData.length - 1]?.year || 30;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12">
      {/* Header */}
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

      {/* Chart */}
      <div className="h-48 sm:h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="year" 
              stroke="currentColor" 
              tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              ticks={[0, maxYear]}
              tickFormatter={(value) => value === 0 ? 'Today' : `${value} Years`}
            />
            <YAxis hide />
            <Bar 
              dataKey="value" 
              fill="currentColor" 
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
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
