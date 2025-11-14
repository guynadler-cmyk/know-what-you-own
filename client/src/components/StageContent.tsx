import { SummaryCard } from "@/components/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, Brain } from "lucide-react";
import { CompanySummary } from "@shared/schema";

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, 
  Brain, Cpu
};

interface StageContentProps {
  stage: number;
  summaryData: CompanySummary | null;
}

const STAGE_INFO = {
  2: {
    title: "Understand Performance",
    description: "Analyze financial metrics, revenue trends, and operational efficiency to gauge business health."
  },
  3: {
    title: "Evaluate the Stock",
    description: "Assess current valuation and stock price relative to business quality and growth potential."
  },
  4: {
    title: "Plan Your Investment",
    description: "Determine appropriate position sizing and develop your personalized investment strategy."
  },
  5: {
    title: "Time It Sensibly",
    description: "Identify favorable entry points based on market conditions and technical signals."
  },
  6: {
    title: "Protect What's Yours",
    description: "Establish stop losses, exit rules, and risk management protocols to safeguard your capital."
  }
};

export function StageContent({ stage, summaryData }: StageContentProps) {
  if (stage === 1 && summaryData) {
    const preparedSummary = {
      ...summaryData,
      products: summaryData.products.map(p => ({
        ...p,
        icon: iconMap[p.icon] || Package
      }))
    };
    return <SummaryCard {...preparedSummary} />;
  }

  const stageInfo = STAGE_INFO[stage as keyof typeof STAGE_INFO];
  
  if (!stageInfo) {
    return null;
  }

  return (
    <Card data-testid={`stage-${stage}-content`}>
      <CardHeader className="text-center pb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">{stageInfo.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-12">
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          {stageInfo.description}
        </p>
        <div className="bg-muted/50 rounded-lg p-8 max-w-lg mx-auto">
          <p className="text-sm font-medium text-foreground mb-2">
            Coming Soon
          </p>
          <p className="text-xs text-muted-foreground">
            We're building this stage to help you make better investment decisions. 
            Check back soon for comprehensive tools and guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
