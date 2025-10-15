import { SummaryCard } from '../SummaryCard'
import { Package, TrendingUp, Globe, Users, Zap, Target } from 'lucide-react'

export default function SummaryCardExample() {
  return (
    <div className="p-8 bg-background">
      <SummaryCard
        companyName="Apple Inc."
        ticker="AAPL"
        filingDate="November 3, 2023"
        fiscalYear="2023"
        tagline="Consumer electronics and digital services leader"
        sections={[
          {
            icon: <Package className="h-4 w-4" />,
            title: "Products",
            items: [
              "iPhone smartphones",
              "Mac computers & laptops",
              "iPad tablets",
              "Apple Watch & AirPods"
            ]
          },
          {
            icon: <Zap className="h-4 w-4" />,
            title: "Services",
            items: [
              "App Store ecosystem",
              "Apple Music streaming",
              "iCloud storage",
              "Apple Pay & AppleCare"
            ]
          },
          {
            icon: <Globe className="h-4 w-4" />,
            title: "Market Reach",
            items: [
              "Global retail presence",
              "Online store platform",
              "Consumer & enterprise",
              "150+ countries"
            ]
          },
          {
            icon: <TrendingUp className="h-4 w-4" />,
            title: "Business Model",
            items: [
              "Hardware sales revenue",
              "Subscription services",
              "Ecosystem integration",
              "Premium positioning"
            ]
          },
          {
            icon: <Users className="h-4 w-4" />,
            title: "Competitive Edge",
            items: [
              "Brand loyalty & premium",
              "Seamless device integration",
              "Innovation focus",
              "Privacy & security first"
            ]
          },
          {
            icon: <Target className="h-4 w-4" />,
            title: "Strategy",
            items: [
              "Expand services revenue",
              "Sustainable innovation",
              "AR/VR technologies",
              "Emerging markets growth"
            ]
          }
        ]}
        cik="0000320193"
      />
    </div>
  );
}
