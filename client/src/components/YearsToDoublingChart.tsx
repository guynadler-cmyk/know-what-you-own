import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface YearsToDoublingChartProps {
  formattedData: Array<{ year: number; value: number }>;
  maxYear: number;
}

export default function YearsToDoublingChart({ formattedData, maxYear }: YearsToDoublingChartProps) {
  return (
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
  );
}
