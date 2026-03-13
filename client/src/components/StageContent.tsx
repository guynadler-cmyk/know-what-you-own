import { lazy, Suspense, useMemo, useState } from "react";
import { SummaryCard } from "@/components/SummaryCard";
import { ComingSoonStage } from "@/components/ComingSoonStage";
import { generateQuadrantData } from "@/lib/quadrantData";
import { VALUATION_QUADRANT_DATA, type ValuationQuadrantData } from "@/lib/valuationData";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, FileX2 } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

const ManageStage = lazy(() => import("@/components/ManageStage").then(m => ({ default: m.ManageStage })));
const TimingStage = lazy(() => import("@/components/TimingStage").then(m => ({ default: m.TimingStage })));
const StrategyStage = lazy(() => import("@/components/StrategyStage").then(m => ({ default: m.StrategyStage })));
const QuadrantExplorer = lazy(() => import("@/components/QuadrantExplorer").then(m => ({ default: m.QuadrantExplorer })));
const FinancialScorecard = lazy(() => import("@/components/FinancialScorecard").then(m => ({ default: m.FinancialScorecard })));
const ValuationExplorer = lazy(() => import("@/components/ValuationExplorer").then(m => ({ default: m.ValuationExplorer })));
const ValuationScorecard = lazy(() => import("@/components/ValuationScorecard").then(m => ({ default: m.ValuationScorecard })));

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu
};

function StageFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

interface StageContentProps {
  stage: number;
  summaryData: CompanySummary | null;
  financialMetrics?: FinancialMetrics;
  balanceSheetMetrics?: BalanceSheetMetrics;
  ticker?: string;
  onStageChange?: (stage: number) => void;
  onMobileScroll?: () => void;
  onSubSectionClick?: (subsectionId: string) => void;
}

const COMING_SOON_STAGES = {
  6: {
    stageTitle: "Manage",
    icon: "shield",
    hook: "Stay honest with yourself.",
    summary: "The research is done. Now build the habit of checking in — so you act on facts, not feelings.",
    cta: "Set your check-in cadence and position rules. Join the waitlist for early access."
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
        className="text-2xl sm:text-3xl font-bold mb-3 leading-tight"
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
  completedStageNumber: number;
  nextStageNumber: number;
  nextStageLabel: string;
  previewHeadline: React.ReactNode;
  previewSub: string;
  previewItems: Array<{ label: string; value: string }>;
  bannerCompleteLabel: string;
  bannerHeadline: React.ReactNode;
  bannerSub: string;
  bannerButtonLabel: string;
  onNavigate?: () => void;
}

const tealDeep = "#0d4a47";

function ComingUpNext({
  completedStageNumber,
  nextStageNumber,
  nextStageLabel,
  previewHeadline,
  previewSub,
  previewItems,
  bannerCompleteLabel,
  bannerHeadline,
  bannerSub,
  bannerButtonLabel,
  onNavigate,
}: ComingUpNextProps) {
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
          className="text-xl sm:text-2xl font-bold mb-2 leading-snug"
          style={{ fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)" }}
        >
          {previewHeadline}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
          {previewSub}
        </p>
      </div>

      <div className="rounded-md border border-border overflow-hidden opacity-80">
        <div
          className="px-5 py-2.5 flex items-center justify-between gap-4"
          style={{ background: "var(--lp-teal-deep)" }}
        >
          <span className="text-white/50 text-[10px] font-mono uppercase tracking-widest">
            Stage {nextStageNumber} · {nextStageLabel}
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

      <div
        className="mt-6 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-xl px-5 sm:px-7 py-5 overflow-hidden"
        style={{ background: tealDeep }}
        data-testid={`banner-stage-${completedStageNumber}-complete`}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 80% at 100% 50%, rgba(77,184,176,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          <p
            className="text-[9px] font-medium uppercase tracking-widest mb-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {bannerCompleteLabel}
          </p>
          <p
            className="text-[17px] font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {bannerHeadline}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            {bannerSub}
          </p>
        </div>
        {onNavigate && (
          <button
            className="relative z-10 flex items-center justify-center gap-2 rounded-lg text-[12px] font-medium w-full sm:w-auto min-h-[44px] px-5 py-2.5 sm:flex-shrink-0 sm:ml-6 transition-opacity hover:opacity-90"
            style={{ background: "white", color: tealDeep, fontFamily: "'DM Sans', sans-serif" }}
            data-testid={`button-next-stage-${nextStageNumber}`}
            onClick={onNavigate}
          >
            {bannerButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function StageContent({ stage, summaryData, financialMetrics, balanceSheetMetrics, ticker, onStageChange, onMobileScroll, onSubSectionClick }: StageContentProps) {
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
      <Suspense fallback={<StageFallback />}>
        <StrategyStage 
          ticker={ticker}
          companyName={summaryData?.companyName}
          homepage={summaryData?.metadata?.homepage}
          fundamentalsScore={fundamentalsScore}
          valuationLabel={valuationLabel}
          onStageChange={onStageChange}
        />
      </Suspense>
    );
  }

  if (stage === 6) {
    const strongCount = quadrantData.filter(q => q.strength === "strong").length;
    const fundamentalsScore = quadrantData.length > 0
      ? `${strongCount}/${quadrantData.length} strong`
      : undefined;

    return (
      <Suspense fallback={<StageFallback />}>
        <ManageStage
          ticker={ticker}
          companyName={summaryData?.companyName}
          fundamentalsScore={fundamentalsScore}
        />
      </Suspense>
    );
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
                {summaryData.companyName} doesn't file a 10-K with the SEC — it may be a foreign company (which files a 20-F instead) or a fund. Business analysis isn't available, but Performance, Valuation, Timing, Strategy and Manage are all fully accessible using market data.
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
    return <SummaryCard {...preparedSummary} onStageChange={onStageChange} onMobileScroll={onMobileScroll} />;
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

        <Suspense fallback={<StageFallback />}>
          <QuadrantExplorer 
            financialMetrics={financialMetrics}
            balanceSheetMetrics={balanceSheetMetrics}
            ticker={ticker}
          />
        </Suspense>
        
        <Suspense fallback={<StageFallback />}>
          <FinancialScorecard quadrantData={quadrantData} />
        </Suspense>

        <ComingUpNext
          completedStageNumber={2}
          nextStageNumber={3}
          nextStageLabel="Valuation"
          previewHeadline={
            <>
              What are you actually <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>paying</em> for this?
            </>
          }
          previewSub="Now that you've seen the financial picture, let's look at whether the current price makes sense — relative to earnings, history, and future potential."
          previewItems={[
            { label: "Price Discipline", value: "—" },
            { label: "Price Tag", value: "—" },
            { label: "Capital Discipline", value: "—" },
            { label: "Doubling Potential", value: "—" },
          ]}
          bannerCompleteLabel="Stage 2 complete"
          bannerHeadline={
            <>
              You know the financials.{" "}
              <em className="italic" style={{ color: "var(--lp-teal-light)" }}>Is the price worth it?</em>
            </>
          }
          bannerSub="Next: P/E ratio, earnings yield, price history, and return potential — all scored."
          bannerButtonLabel="Check Valuation →"
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

        <Suspense fallback={<StageFallback />}>
          <ValuationExplorer ticker={ticker} onQuadrantDataChange={setValuationQuadrantData} onSubSectionClick={onSubSectionClick} />
        </Suspense>
        
        <Suspense fallback={<StageFallback />}>
          <ValuationScorecard quadrantData={valuationQuadrantData} />
        </Suspense>

        <ComingUpNext
          completedStageNumber={3}
          nextStageNumber={4}
          nextStageLabel="Timing"
          previewHeadline={
            <>
              Is the <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>timing</em> right to act?
            </>
          }
          previewSub="You know the fundamentals and the valuation. Now let's check whether current market conditions are aligned before you make your move."
          previewItems={[
            { label: "Trend", value: "—" },
            { label: "Momentum", value: "—" },
            { label: "Stretch", value: "—" },
          ]}
          bannerCompleteLabel="Stage 3 complete"
          bannerHeadline={
            <>
              You know the valuation.{" "}
              <em className="italic" style={{ color: "var(--lp-teal-light)" }}>Is the timing right?</em>
            </>
          }
          bannerSub="Next: trend, momentum, and stretch — market signals before you pull the trigger."
          bannerButtonLabel="Check Timing →"
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

        <Suspense fallback={<StageFallback />}>
          <TimingStage 
            ticker={ticker}
            companyName={summaryData?.companyName}
            homepage={summaryData?.metadata?.homepage}
            onSubSectionClick={onSubSectionClick}
          />
        </Suspense>

        <ComingUpNext
          completedStageNumber={4}
          nextStageNumber={5}
          nextStageLabel="Strategy"
          previewHeadline={
            <>
              Build your <em style={{ color: "var(--lp-teal-deep)", fontStyle: "italic" }}>investment plan</em>
            </>
          }
          previewSub="You've done the analysis. Now structure your thinking into a clear, personalized investment plan — conviction level, tranche sizing, and your 'I'm wrong if' rules."
          previewItems={[
            { label: "Conviction level", value: "—" },
            { label: "Investment amount", value: "—" },
            { label: "Tranche schedule", value: "—" },
            { label: "Exit conditions", value: "—" },
          ]}
          bannerCompleteLabel="Stage 4 complete"
          bannerHeadline={
            <>
              You've read the signals.{" "}
              <em className="italic" style={{ color: "var(--lp-teal-light)" }}>Time to build your plan.</em>
            </>
          }
          bannerSub="Next: conviction level, tranche sizing, and your personal 'I'm wrong if' rules."
          bannerButtonLabel="Build Your Strategy →"
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
