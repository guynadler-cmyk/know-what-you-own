import { StockPerformance } from "@shared/schema";

// Generate mock stock performance data for testing
// This will be replaced with real API data later
export function generateMockStockPerformance(ticker: string): StockPerformance {
  // Different companies get different mock data based on ticker
  const seedValue = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const yearsToDouble = 5 + (seedValue % 10); // 5-15 years
  const currentValue = 10000 + (seedValue % 5000) * 10;
  
  // Generate compound growth projection data
  const growthRate = 72 / yearsToDouble / 100; // Rule of 72
  const chartData = [];
  for (let year = 0; year <= 30; year++) {
    chartData.push({
      year,
      value: Math.round(currentValue * Math.pow(1 + growthRate, year)),
    });
  }

  return {
    yearsToDoubling: {
      years: yearsToDouble,
      currentValue: `$${currentValue.toLocaleString()}`,
      projectedValue: `$${(currentValue * 2).toLocaleString()}`,
      chartData,
    },
    metrics: [
      {
        name: "Price to Earnings",
        value: `${(15 + (seedValue % 20)).toFixed(1)}`,
        explanation: "How much investors pay for each dollar of profit. Lower numbers mean better value.",
        chartData: [
          { year: "2020", value: 18.2 },
          { year: "2021", value: 22.5 },
          { year: "2022", value: 15.8 },
          { year: "2023", value: 19.3 },
          { year: "2024", value: 21.1 },
        ],
      },
      {
        name: "Revenue Growth",
        value: `${(5 + (seedValue % 15))}%`,
        explanation: "How fast the company is growing its sales year over year. Higher is better for growth investors.",
        chartData: [
          { year: "2020", value: 8.5 },
          { year: "2021", value: 12.3 },
          { year: "2022", value: 15.7 },
          { year: "2023", value: 18.2 },
          { year: "2024", value: 14.9 },
        ],
      },
      {
        name: "Profit Margin",
        value: `${(10 + (seedValue % 25))}%`,
        explanation: "What percentage of revenue becomes profit. Higher margins mean better efficiency and pricing power.",
        chartData: [
          { year: "2020", value: 18.5 },
          { year: "2021", value: 21.2 },
          { year: "2022", value: 24.8 },
          { year: "2023", value: 26.3 },
          { year: "2024", value: 28.1 },
        ],
      },
      {
        name: "Free Cash Flow",
        value: `$${(5 + (seedValue % 20))}B`,
        explanation: "Cash left over after expenses and investments. This is what's available for dividends or buybacks.",
        chartData: [
          { year: "2020", value: 12.3 },
          { year: "2021", value: 15.7 },
          { year: "2022", value: 18.2 },
          { year: "2023", value: 21.8 },
          { year: "2024", value: 24.5 },
        ],
      },
      {
        name: "Return on Equity",
        value: `${(10 + (seedValue % 30))}%`,
        explanation: "How efficiently the company uses shareholder money to generate profits. Higher means better returns.",
        chartData: [
          { year: "2020", value: 22.5 },
          { year: "2021", value: 25.8 },
          { year: "2022", value: 28.3 },
          { year: "2023", value: 31.2 },
          { year: "2024", value: 29.7 },
        ],
      },
      {
        name: "Debt to Equity",
        value: `${((seedValue % 80) / 100).toFixed(2)}`,
        explanation: "How much debt the company has compared to shareholder money. Lower is generally safer.",
        chartData: [
          { year: "2020", value: 0.52 },
          { year: "2021", value: 0.48 },
          { year: "2022", value: 0.45 },
          { year: "2023", value: 0.41 },
          { year: "2024", value: 0.38 },
        ],
      },
    ],
  };
}
