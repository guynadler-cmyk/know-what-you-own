import { useMemo, useState } from "react";
import { SummaryCard } from "@/components/SummaryCard";
import { ComingSoonStage } from "@/components/ComingSoonStage";
import { ProtectStage } from "@/components/ProtectStage";
import { QuadrantExplorer, generateQuadrantData } from "@/components/QuadrantExplorer";
import { FinancialScorecard } from "@/components/FinancialScorecard";
import { ValuationExplorer, VALUATION_QUADRANT_DATA, type ValuationQuadrantData } from "@/components/ValuationExplorer";
import { ValuationScorecard } from "@/components/ValuationScorecard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, Info } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu
};

interface StageContentProps {
  stage: number;
  summaryData: CompanySummary | null;
  financialMetrics?: FinancialMetrics;
  balanceSheetMetrics?: BalanceSheetMetrics;
  ticker?: string;
}

const COMING_SOON_STAGES = {
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

function IntroContextBlock() {
  return (
    <div 
      className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5 mb-8 border border-border/40"
      data-testid="intro-context-block"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground leading-relaxed">
            You've seen what this business does. Now let's look under the hood — is it financially strong enough to own?
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We'll guide you through revenue, earnings, cash flow, debt, and reinvestment — to help you decide if this is a business worth holding long term.
          </p>
        </div>
      </div>
    </div>
  );
}

function ValuationIntroBlock() {
  return (
    <div 
      className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5 mb-8 border border-border/40"
      data-testid="valuation-intro-block"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground leading-relaxed">
            You've seen what the business is. Now let's look at what you're paying for.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Sensible investing isn't about finding the cheapest stock — it's about knowing whether the price, expectations, and potential returns make sense together.
          </p>
        </div>
      </div>
    </div>
  );
}


export function StageContent({ stage, summaryData, financialMetrics, balanceSheetMetrics, ticker }: StageContentProps) {
  // Generate quadrant data based on real financial metrics
  const quadrantData = useMemo(
    () => generateQuadrantData(financialMetrics, balanceSheetMetrics),
    [financialMetrics, balanceSheetMetrics]
  );

  // State for valuation quadrant data from API
  const [valuationQuadrantData, setValuationQuadrantData] = useState<ValuationQuadrantData[]>(VALUATION_QUADRANT_DATA);

  if (stage === 6) {
    return <ProtectStage ticker={ticker} />;
  }

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
        <CardHeader className="text-center pb-6">
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
          <IntroContextBlock />
          
          <QuadrantExplorer 
            financialMetrics={financialMetrics}
            balanceSheetMetrics={balanceSheetMetrics}
          />
          
          <FinancialScorecard quadrantData={quadrantData} />
        </CardContent>
      </Card>
    );
  }

  if (stage === 3) {
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
      <Card data-testid="stage-3-content">
        <CardHeader className="text-center pb-6">
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
          <CardTitle className="text-2xl">Evaluate the Stock</CardTitle>
        </CardHeader>
        <CardContent className="pb-12">
          <ValuationIntroBlock />
          
          <ValuationExplorer ticker={ticker} companyName={summaryData?.companyName} onQuadrantDataChange={setValuationQuadrantData} />
          
          <ValuationScorecard quadrantData={valuationQuadrantData} />
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
