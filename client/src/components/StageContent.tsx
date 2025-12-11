import { SummaryCard } from "@/components/SummaryCard";
import { ComingSoonStage } from "@/components/ComingSoonStage";
import { QuadrantExplorer } from "@/components/QuadrantExplorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, Brain } from "lucide-react";
import { CompanySummary } from "@shared/schema";

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, 
  Brain, Cpu
};

interface StageContentProps {
  stage: number;
  summaryData: CompanySummary | null;
  financialMetrics?: any;
  balanceSheetMetrics?: any;
}

const COMING_SOON_STAGES = {
  3: {
    stageTitle: "Evaluate the Deal",
    icon: "📊",
    hook: "Don't just buy stocks. Understand the deal.",
    summary: "Buying a stock is buying a business. This step helps you figure out: is the price fair? What are you really getting? No jargon. Just practical valuation logic you can actually use.",
    cta: "Want first access when this launches? Join the waitlist below."
  },
  4: {
    stageTitle: "Plan Your Investment",
    icon: "🗺️",
    hook: "No more winging it. Invest with a plan.",
    summary: "What's your goal? How much should you invest — and when? This step helps you create a calm, intentional strategy that makes emotional blowups less likely.",
    cta: "Coming soon: your personal investing playbook. Join the waitlist to be the first in."
  },
  5: {
    stageTitle: "Make Your Move",
    icon: "🎯",
    hook: "Don't time the market. Time your move.",
    summary: "Execution isn't about prediction — it's about structure. This step guides you through entering with clarity: when, how, and how much. No FOMO, no YOLO, just calm execution.",
    cta: "Be the first to try smarter execution tools. Join the waitlist below."
  },
  6: {
    stageTitle: "Protect What You Own",
    icon: "🛡️",
    hook: "Don't just buy smart. Hold smart.",
    summary: "Every investor eventually hits doubt. This step gives you the tools to stay steady when it matters — with check-ins, exit rules, and guardrails that protect your peace and your portfolio.",
    cta: "Build resilience into your portfolio. Join the waitlist for early access."
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

  if (stage === 2) {
    const getLogoUrl = (homepage: string) => {
      try {
        const url = new URL(homepage);
        return `/api/logo/${url.hostname}`;
      } catch {
        return null;
      }
    };
    const logoUrl = summaryData?.metadata?.homepage ? getLogoUrl(summaryData.metadata.homepage) : null;

    return (
      <Card data-testid="stage-2-content">
        <CardHeader className="text-center pb-8">
          {summaryData && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                {logoUrl ? (
                  <img 
                    src={logoUrl}
                    alt={`${summaryData.companyName} logo`}
                    className="w-16 h-16 rounded-lg object-contain bg-white p-2 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${logoUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-lg bg-primary/10 items-center justify-center shadow-sm`}>
                  <span className="text-2xl font-bold text-primary">{summaryData.ticker.charAt(0)}</span>
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold">{summaryData.companyName}</h2>
                <p className="text-sm text-muted-foreground">{summaryData.ticker}</p>
              </div>
            </div>
          )}
          <CardTitle className="text-2xl">Understand Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-12">
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Explore different dimensions of financial health. Click on any card to dive deeper.
          </p>
          <QuadrantExplorer />
        </CardContent>
      </Card>
    );
  }

  const comingSoonStage = COMING_SOON_STAGES[stage as keyof typeof COMING_SOON_STAGES];
  
  if (comingSoonStage) {
    return (
      <ComingSoonStage
        stageTitle={comingSoonStage.stageTitle}
        icon={comingSoonStage.icon}
        hook={comingSoonStage.hook}
        summary={comingSoonStage.summary}
        cta={comingSoonStage.cta}
      />
    );
  }

  return null;
}
