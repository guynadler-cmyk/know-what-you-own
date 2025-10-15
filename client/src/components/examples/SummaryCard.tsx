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
        leaders={[
          { name: "Tim Cook", role: "Chief Executive Officer", initials: "TC", twitter: "tim_cook" },
          { name: "Luca Maestri", role: "Chief Financial Officer", initials: "LM" },
          { name: "Jeff Williams", role: "Chief Operating Officer", initials: "JW" },
          { name: "Katherine Adams", role: "General Counsel", initials: "KA" }
        ]}
        metrics={[
          { label: "Annual Revenue", value: "$383B", trend: "up" },
          { label: "Net Income", value: "$97B", trend: "up" },
          { label: "Employees", value: "161K" },
          { label: "R&D Spending", value: "$30B", trend: "up" }
        ]}
        metadata={{
          homepage: "https://www.apple.com",
          investorRelations: "https://investor.apple.com",
          news: [
            {
              title: "Apple Reports Fourth Quarter Results",
              source: "Apple Newsroom",
              date: "Nov 2, 2023",
              url: "#"
            },
            {
              title: "Apple Unveils Vision Pro Spatial Computer",
              source: "TechCrunch",
              date: "Oct 28, 2023",
              url: "#"
            },
            {
              title: "iPhone 15 Series Exceeds Sales Expectations",
              source: "Bloomberg",
              date: "Oct 15, 2023",
              url: "#"
            }
          ],
          videos: [
            {
              title: "Understanding Apple's Business Model",
              channel: "The Plain Bagel",
              url: "#"
            },
            {
              title: "Apple's 2023 Strategy Breakdown",
              channel: "Wall Street Journal",
              url: "#"
            },
            {
              title: "Why Apple Stock is a Buy (Analysis)",
              channel: "Financial Education",
              url: "#"
            }
          ]
        }}
        cik="0000320193"
      />
    </div>
  );
}
