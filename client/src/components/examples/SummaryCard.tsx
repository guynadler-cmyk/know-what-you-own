import { SummaryCard } from '../SummaryCard'
import { Smartphone, Laptop, Tablet, Watch } from 'lucide-react'

export default function SummaryCardExample() {
  return (
    <div className="p-8 bg-background">
      <SummaryCard
        companyName="Apple Inc."
        ticker="AAPL"
        filingDate="November 3, 2023"
        fiscalYear="2023"
        tagline="Consumer electronics and digital services leader"
        products={[
          {
            name: "iPhone",
            icon: Smartphone,
            description: "Flagship smartphone line"
          },
          {
            name: "Mac",
            icon: Laptop,
            description: "Computers & laptops"
          },
          {
            name: "iPad",
            icon: Tablet,
            description: "Tablet devices"
          },
          {
            name: "Wearables",
            icon: Watch,
            description: "Watch & AirPods"
          }
        ]}
        operations={{
          regions: ["Americas", "Europe", "Greater China", "Japan", "Rest of Asia Pacific"],
          channels: ["Retail Stores", "Online Store", "Direct Sales", "Third-Party Resellers"],
          scale: "Global presence in 150+ countries with 500+ retail stores"
        }}
        competitors={[
          { name: "Samsung", focus: "Smartphones & consumer electronics" },
          { name: "Google", focus: "Software, services & Pixel devices" },
          { name: "Microsoft", focus: "Software, cloud services & Surface" },
          { name: "Amazon", focus: "E-commerce & cloud services" }
        ]}
        metrics={[
          { label: "Annual Revenue", value: "$383B", trend: "up" },
          { label: "Net Income", value: "$97B", trend: "up" },
          { label: "Employees", value: "161K" },
          { label: "R&D Spending", value: "$30B", trend: "up" }
        ]}
        metadata={{
          homepage: "https://www.apple.com",
          investorRelations: "https://investor.apple.com"
        }}
        cik="0000320193"
      />
    </div>
  );
}
