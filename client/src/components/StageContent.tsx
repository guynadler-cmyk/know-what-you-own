import { useMemo, useState } from "react";
import { SummaryCard } from "@/components/SummaryCard";
import { ComingSoonStage } from "@/components/ComingSoonStage";
import { ProtectStage } from "@/components/ProtectStage";
import { TimingStage } from "@/components/TimingStage";
import { StrategyStage } from "@/components/StrategyStage";
import { QuadrantExplorer, generateQuadrantData } from "@/components/QuadrantExplorer";
import { FinancialScorecard } from "@/components/FinancialScorecard";
import { ValuationExplorer, VALUATION_QUADRANT_DATA, type ValuationQuadrantData } from "@/components/ValuationExplorer";
import { ValuationScorecard } from "@/components/ValuationScorecard";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, FileX2, ChevronRight } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  onStageChange?: (stage: number) => void;
}

const COMING_SOON_STAGES = {
  6: {
    stageTitle: "Protect What You Own",
    icon: "shield",
    hook: "Don't just buy smart. Hold smart.",
    summary: "Every investor eventually hits doubt. This step gives you the tools to stay steady when it matters — with check-ins, exit rules, and guardrails that protect your peace and your portfolio.",
    cta: "Build resilience into your portfolio. Join the waitlist for early access."
  }
};

interface StagePageHeaderProps {
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
}

function StagePageHeader({ eyebrow, headline, sub }: StagePageHeaderProps) {
  return (
    <div className="mb-8">
      <p
        className="text-xs font-mono uppercase tracking-widest mb-2 font-semibold"
        style={{ color: "var(--lp-teal-deep)" }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-3xl font-bold mb-3 leading-tight"
        style={{ fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)" }}
      >
        {headline}
      </h2>
      <p className="text-muted-foreground leading-relaxed max-w-2xl">
        {sub}
      </p>
    </div>
  );
}

interface ComingUpNextProps {
  stageNumber: number;
  stageLabel: string;
  headline: React.ReactNode;
  sub: string;
  previewItems: Array<{ label: string; value: string }>;
  onNavigate?: () => void;
}

function ComingUpNext({ stageNumber, stageLabel, headline, sub, previewItems, onNavigate }: ComingUpNextProps) {
  return (
    <div className="mt-16 pt-10 border-t border-border/40">
      <div className="mb-6">
        <p
          className="text-xs font-mono uppercase tracking-widest mb-2 font-semibold opacity-60"
          style={{ color: "var(--lp-teal-deep)" }}
        >
          Coming up next
        </p>
        <h3
          className="text-2xl font-bold mb-2 leading-snug"
          style={{ fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)" }}
        >
          {headline}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          {sub}
        </p>
      </div>

      <div className="rounded-md border border-border overflow-hidden opacity-80">
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-4"
          style={{ background: "var(--lp-teal-deep)" }}
        >
          <span className="text-white/50 text-[10px] font-mono uppercase tracking-widest">
            Stage {stageNumber} · {stageLabel}
          </span>
          <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
            Preview
          </span>
        </div>
        <div className="bg-card divide-y divide-border/60">
          {previewItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-muted flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground/60 font-mono">—</span>
            </div>
          ))}
        </div>
      </div>

      {onNavigate && (
        <div className="mt-6 flex justify-start">
          <Button
            onClick={onNavigate}
            className="gap-2"
            data-testid={`button-next-stage-${stageNumber}`}
          >
            Continue to {stageLabel}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function StageContent({ stage, summaryData, financialMetrics, balanceSheetMetrics, ticker, onStageChange }: StageContentProps) {
  const quadrantData = useMemo(
    () => generateQuadrantData(financialMetrics, balanceSheetMetrics),
    [financialMetrics, balanceSheetMetrics]
  );

  const [valuationQuadrantData, setValuationQuadrantData] = useState<ValuationQuadrantData[]>(VALUATION_QUADRANT_DATA);

  if (stage === 5) {
    const strongCount = quadrantData.filter(q => q.strength === "strong").length;
    const fundamentalsScore = quadrantData.length > 0 
      ? `${strongCount}/${quadrantData.length} strong` 
      : undefined;

    const sensibleCount = valuationQuadrantData.filter(q => q.strength === "sensible").length;
    const valuationLabel = valuationQuadrantData.length > 0 
      ? `${sensibleCount}/${valuationQuadrantData.length} sensible` 
      : undefined;

    return (
      <StrategyStage 
        ticker={ticker}
        companyName={summaryData?.companyName}
        homepage={summaryData?.metadata?.homepage}
        fundamentalsScore={fundamentalsScore}
        valuationLabel={valuationLabel}
        onStageChange={onStageChange}
      />
    );
  }

  if (stage === 6) {
    return <ProtectStage ticker={ticker} />;
  }

  if (stage === 1 && summaryData) {
    if (summaryData.no10KAvailable) {
      return (
        <AlertDialog open={true}>
          <AlertDialogContent className="max-w-md text-center">
            <AlertDialogHeader>
              <div className="flex justify-center mb-2">
                <FileX2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <AlertDialogTitle className="text-center">No 10-K Analysis Available</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                {summaryData.companyName} doesn't file a 10-K with the SEC — it may be a foreign company (which files a 20-F instead) or a fund. Business analysis isn't available, but Performance, Valuation, Timing, Strategy and Protection are all fully accessible using market data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="justify-center sm:justify-center">
              <AlertDialogAction onClick={() => onStageChange?.(2)} data-testid="button-continue-performance">
                Continue to Performance Analysis
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    const preparedSummary = {
      ...summaryData,
      products: summaryData.products.map(p => ({
        ...p,
        icon: iconMap[p.icon] || Package
      }))
    };
    return <SummaryCard {...preparedSummary} onStageChange={onStageChange} />;
  }

  if (stage === 2) {
    return (
      <div data-testid="stage-2-content">
        <StagePageHeader
          eyebrow="Stage 2 of 6 · Financial Performance"
          headline={
            <>
              Is this business <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>financially strong</em> enough to own?
            </>
          }
          sub="We'll guide you through revenue, earnings, cash flow, debt, and reinvestment — to help you decide if this is a business worth holding long term."
        />

        <QuadrantExplorer 
          financialMetrics={financialMetrics}
          balanceSheetMetrics={balanceSheetMetrics}
          ticker={ticker}
        />
        
        <FinancialScorecard quadrantData={quadrantData} />

        <ComingUpNext
          stageNumber={3}
          stageLabel="Valuation"
          headline={
            <>
              What are you actually <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>paying</em> for this?
            </>
          }
          sub="Now that you've seen the financial picture, let's look at whether the current price makes sense — relative to earnings, history, and future potential."
          previewItems={[
            { label: "Price Discipline", value: "—" },
            { label: "Price Tag", value: "—" },
            { label: "Capital Discipline", value: "—" },
            { label: "Doubling Potential", value: "—" },
          ]}
          onNavigate={onStageChange ? () => onStageChange(3) : undefined}
        />
      </div>
    );
  }

  if (stage === 3) {
    return (
      <div data-testid="stage-3-content">
        <StagePageHeader
          eyebrow="Stage 3 of 6 · Valuation"
          headline={
            <>
              What are you actually <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>paying</em> for this?
            </>
          }
          sub="Sensible investing isn't about finding the cheapest stock — it's about knowing whether the price, expectations, and potential returns make sense together."
        />

        <ValuationExplorer ticker={ticker} onQuadrantDataChange={setValuationQuadrantData} />
        
        <ValuationScorecard quadrantData={valuationQuadrantData} />

        <ComingUpNext
          stageNumber={4}
          stageLabel="Timing"
          headline={
            <>
              Is the <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>timing</em> right to act?
            </>
          }
          sub="You know the fundamentals and the valuation. Now let's check whether current market conditions are aligned before you make your move."
          previewItems={[
            { label: "Trend", value: "—" },
            { label: "Momentum", value: "—" },
            { label: "Stretch", value: "—" },
          ]}
          onNavigate={onStageChange ? () => onStageChange(4) : undefined}
        />
      </div>
    );
  }

  if (stage === 4) {
    return (
      <div data-testid="stage-4-content">
        <StagePageHeader
          eyebrow="Stage 4 of 6 · Timing"
          headline={
            <>
              Are conditions <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>aligned</em> to act?
            </>
          }
          sub="This isn't about predicting the future — it's about understanding whether current market conditions suggest patience or action."
        />

        <TimingStage 
          ticker={ticker}
          companyName={summaryData?.companyName}
          homepage={summaryData?.metadata?.homepage}
        />

        <ComingUpNext
          stageNumber={5}
          stageLabel="Strategy"
          headline={
            <>
              Build your <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>investment plan</em>
            </>
          }
          sub="You've done the analysis. Now structure your thinking into a clear, personalized investment plan — conviction level, tranche sizing, and your 'I'm wrong if' rules."
          previewItems={[
            { label: "Conviction level", value: "—" },
            { label: "Investment amount", value: "—" },
            { label: "Tranche schedule", value: "—" },
            { label: "Exit conditions", value: "—" },
          ]}
          onNavigate={onStageChange ? () => onStageChange(5) : undefined}
        />
      </div>
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
