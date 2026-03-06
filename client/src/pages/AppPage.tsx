import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TickerInput } from "@/components/TickerInput";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { JourneyNarrative } from "@/components/JourneyNarrative";
import { StageNavigation } from "@/components/StageNavigation";
import { StageContent } from "@/components/StageContent";
import { EmailPaywall } from "@/components/EmailPaywall";
import { InlineEmailCapture } from "@/components/InlineEmailCapture";
import { TickerFollowPrompt } from "@/components/TickerFollowPrompt";
import { SaveToWatchlist } from "@/components/SaveToWatchlist";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics, WatchlistSnapshot } from "@shared/schema";
import { analytics } from "@/lib/analytics";
import {
  type PaywallState,
  getPaywallState,
  getStoredEmail,
  unlockPaywall,
  skipPaywall,
  getSkippedStage,
  shouldShowPaywall,
} from "@/lib/abTest";

type ViewState = "input" | "loading" | "success" | "error";

export default function AppPage() {
  const [location, setLocation] = useLocation();
  const [viewState, setViewState] = useState<ViewState>("input");
  const [currentTicker, setCurrentTicker] = useState("");
  const [currentStage, setCurrentStage] = useState(1);
  const [summaryData, setSummaryData] = useState<CompanySummary | null>(null);
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetrics | null>(null);

  const [paywallState, setPaywallState] = useState<PaywallState>("locked");
  const [showFloatingModal, setShowFloatingModal] = useState(false);
  const [lastSkippedStage, setLastSkippedStage] = useState<number | null>(null);
  const [tickerFollowed, setTickerFollowed] = useState(true);

  useEffect(() => {
    if (!currentTicker) return;
    const tickerAtStart = currentTicker;
    setTickerFollowed(true);
    const localState = getPaywallState(currentTicker);
    if (localState === "unlocked") {
      setPaywallState("unlocked");
      const storedEmail = getStoredEmail();
      if (storedEmail) {
        fetch(`/api/waitlist/check-ticker?email=${encodeURIComponent(storedEmail)}&ticker=${encodeURIComponent(currentTicker)}`)
          .then(r => r.json())
          .then(data => {
            if (tickerAtStart !== currentTicker) return;
            setTickerFollowed(!!data.followed);
          })
          .catch(() => {});
      }
      return;
    }
    if (localState === "skipped") {
      const persisted = getSkippedStage(currentTicker);
      if (persisted !== null) setLastSkippedStage(persisted);
    }
    const storedEmail = getStoredEmail();
    if (storedEmail) {
      fetch(`/api/waitlist/check?email=${encodeURIComponent(storedEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (tickerAtStart !== currentTicker) return;
          if (data.exists) {
            unlockPaywall(tickerAtStart);
            setPaywallState("unlocked");
            fetch(`/api/waitlist/check-ticker?email=${encodeURIComponent(storedEmail!)}&ticker=${encodeURIComponent(tickerAtStart)}`)
              .then(r => r.json())
              .then(d => {
                if (tickerAtStart !== currentTicker) return;
                setTickerFollowed(!!d.followed);
              })
              .catch(() => {});
          } else {
            setPaywallState(localState);
          }
        })
        .catch(() => {
          if (tickerAtStart !== currentTicker) return;
          setPaywallState(localState);
        });
    } else {
      setPaywallState(localState);
    }
  }, [currentTicker]);

  useEffect(() => {
    if (!shouldShowPaywall(currentStage)) { setShowFloatingModal(false); return; }
    if (paywallState === "unlocked") { setShowFloatingModal(false); return; }
    if (paywallState === "locked") { setShowFloatingModal(true); return; }
    if (paywallState === "skipped") {
      if (lastSkippedStage !== null && currentStage <= lastSkippedStage) {
        setShowFloatingModal(false);
      } else {
        setShowFloatingModal(true);
      }
    }
  }, [currentStage, paywallState, lastSkippedStage]);

  const handlePaywallUnlocked = () => {
    setPaywallState("unlocked");
    setShowFloatingModal(false);
  };

  const handlePaywallSkipped = () => {
    if (!currentTicker) return;
    skipPaywall(currentTicker, currentStage);
    setPaywallState("skipped");
    setLastSkippedStage(currentStage);
    setShowFloatingModal(false);
  };

  const fetchFinancialMetrics = async (ticker: string) => {
    const requestedTicker = ticker.toUpperCase();
    // Clear existing data to show loading state
    setFinancialMetrics(null);
    setBalanceSheetMetrics(null);

    try {
      const response = await fetch(`/api/financials/${requestedTicker}`);
      const data = await response.json();

      if (!response.ok) {
        console.warn(`Financial metrics not available for ${requestedTicker}:`, data.message);
        return;
      }

      // Set the financial metrics from the response
      const { balanceSheet, ...incomeMetrics } = data;
      setFinancialMetrics(incomeMetrics);
      if (balanceSheet) {
        setBalanceSheetMetrics(balanceSheet);
      }
    } catch (error) {
      console.warn(`Failed to fetch financial metrics for ${requestedTicker}:`, error);
    }
  };
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tickerParam = params.get('ticker');
    const stageParam = params.get('stage');
    
    if (tickerParam && !currentTicker) {
      let initialStage = 1;
      if (stageParam) {
        const parsedStage = parseInt(stageParam, 10);
        if (parsedStage >= 1 && parsedStage <= 6) {
          initialStage = parsedStage;
          setCurrentStage(parsedStage);
        }
      }
      
      handleTickerSubmit(tickerParam, initialStage);
    }
  }, []);

  const handleTickerSubmit = (ticker: string, targetStage?: number) => {
    analytics.trackTickerSearch(ticker);
    const stage = targetStage && targetStage > 1 ? targetStage : null;
    setLocation(stage ? `/stocks/${ticker}?stage=${stage}` : `/stocks/${ticker}`);
  };

  const handleBack = () => {
    setViewState("input");
    setCurrentTicker("");
    setSummaryData(null);
    setFinancialMetrics(null);       // ADD THIS LINE
    setBalanceSheetMetrics(null);    // ADD THIS LINE
    setCurrentStage(1);

    window.history.pushState({}, '', window.location.pathname);
  };

  const STAGE_NAMES = ['Business', 'Performance', 'Valuation', 'Strategy', 'Timing', 'Protection'];
  
  const handleStageChange = (stage: number) => {
    setCurrentStage(stage);
    
    // Scroll to top when changing stages
    window.scrollTo(0, 0);
    
    analytics.trackStageViewed(stage, STAGE_NAMES[stage - 1] || 'Unknown', currentTicker);

    // Update URL with stage
    const params = new URLSearchParams();
    params.set('ticker', currentTicker);
    params.set('stage', stage.toString());
    window.history.pushState({}, '', `?${params.toString()}`);

    // Fetch financial metrics when going to Stage 2 (only if not already loaded)
    if (stage === 2 && currentTicker && !financialMetrics) {
      fetchFinancialMetrics(currentTicker);
    }

    if (stage === 2 && currentTicker) {
      queryClient.prefetchQuery({
        queryKey: [`/api/valuation/${currentTicker}`],
      });
      const tf = (typeof window !== 'undefined' && localStorage.getItem('timing-timeframe') === 'daily') ? 'daily' : 'weekly';
      queryClient.prefetchQuery({
        queryKey: ['/api/timing', currentTicker, tf],
        queryFn: async () => {
          const res = await fetch(`/api/timing/${currentTicker}?timeframe=${tf}`);
          if (!res.ok) throw new Error('Prefetch failed');
          return res.json();
        },
      });
    }
  };

  const handleNextStage = () => {
    if (currentStage < 6) {
      handleStageChange(currentStage + 1);
    }
  };

  const handlePreviousStage = () => {
    if (currentStage > 1) {
      handleStageChange(currentStage - 1);
    }
  };

  const handleRetry = () => {
    if (currentTicker) {
      handleTickerSubmit(currentTicker);
    } else {
      setViewState("input");
    }
  };

  const getStageButtonText = () => {
    if (currentStage === 1) {
      return {
        next: "I like this business - let's check performance →",
        previous: null
      };
    }
    return {
      next: currentStage < 6 ? "Continue to Next Stage →" : null,
      previous: "← Previous Stage"
    };
  };

  const buttonText = getStageButtonText();

  const getWatchlistSnapshot = (): WatchlistSnapshot => {
    const snapshot: WatchlistSnapshot = {};

    if (financialMetrics) {
      snapshot.performance = {
        fundamentalsScore: undefined,
        revenueGrowth: financialMetrics.revenueGrowth,
        earningsGrowth: financialMetrics.earningsGrowth,
        revenueChangePercent: financialMetrics.revenueChangePercent,
        earningsChangePercent: financialMetrics.earningsChangePercent,
      };
    }

    const valuationData = queryClient.getQueryData([`/api/valuation/${currentTicker}`]) as any;
    if (valuationData) {
      const sensibleCount = valuationData.quadrants?.filter((q: any) => q.strength === "sensible").length ?? 0;
      const totalQuadrants = valuationData.quadrants?.length ?? 0;
      snapshot.valuation = {
        sensibleCount,
        totalQuadrants,
        earningsYieldFormatted: valuationData.earningsYieldFormatted,
        returnOnCapitalFormatted: valuationData.returnOnCapitalFormatted,
        verdict: valuationData.verdict,
      };
    }

    const tf = (typeof window !== 'undefined' && localStorage.getItem('timing-timeframe') === 'daily') ? 'daily' : 'weekly';
    const timingData = queryClient.getQueryData(['/api/timing', currentTicker, tf]) as any;
    if (timingData) {
      const modules = timingData.modules || {};
      let supportive = 0;
      let total = 0;
      Object.values(modules).forEach((m: any) => {
        if (m?.quadrant) {
          total++;
          if (["bullish", "improving", "bounce_setup", "momentum_aligning"].includes(m.quadrant)) supportive++;
        }
      });
      snapshot.timing = {
        supportiveCount: supportive,
        totalSignals: total,
        trendLabel: modules.trend?.label,
        momentumLabel: modules.momentum?.label,
      };
    }

    const strategyKey = `strategyPlan:${currentTicker}`;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(strategyKey);
        if (saved) {
          const plan = JSON.parse(saved);
          snapshot.strategy = {
            convictionValue: plan.convictionValue,
            convictionLabel: plan.convictionLabel,
            totalAmount: plan.totalAmount,
            tranches: plan.tranches,
            imWrongIf: plan.imWrongIf,
          };
        }
      } catch {}
    }

    return snapshot;
  };

  const pageTitle = summaryData 
    ? `${summaryData.companyName} (${currentTicker}) Analysis | Restnvest`
    : "Analyze Stocks | Restnvest";
  
  const pageDescription = summaryData
    ? `AI-powered analysis of ${summaryData.companyName}'s SEC 10-K filing. Understand the business, financials, and investment thesis.`
    : "Get plain-English summaries of SEC 10-K filings. Understand the businesses you invest in with AI-powered analysis.";

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${currentTicker ? `https://restnvest.com/stocks/${currentTicker}` : 'https://restnvest.com/app'}`} />
        <meta property="og:image" content="https://restnvest.com/icons/icon-512x512.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <link rel="canonical" href={`${currentTicker ? `https://restnvest.com/stocks/${currentTicker}` : 'https://restnvest.com/app'}`} />
      </Helmet>
      <Header />
      
      <main className="flex-1">
        {viewState === "input" && (
          <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
            <HeroSection />
            <div className="mt-8">
              <TickerInput onSubmit={handleTickerSubmit} isLoading={false} />
            </div>
          </div>
        )}

        {viewState === "loading" && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" data-testid="analysis-loading">
            <LoadingState message={`Analyzing ${currentTicker}'s 10-K filing...`} />
          </div>
        )}

        {viewState === "success" && summaryData && (
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" data-active-ticker={currentTicker}>
            <div className="mb-12 flex items-center justify-center gap-3 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="h-12 px-8 rounded-full"
                data-testid="button-back-to-search"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Search
              </Button>
              <SaveToWatchlist
                ticker={currentTicker}
                companyName={summaryData.companyName}
                getSnapshot={getWatchlistSnapshot}
              />
            </div>
            
            <JourneyNarrative />
            <StageNavigation 
              currentStage={currentStage} 
              onStageChange={handleStageChange} 
            />

            {(() => {
              const isGated = shouldShowPaywall(currentStage);
              const isUnlocked = paywallState === "unlocked";

              const stageContentProps = {
                stage: currentStage,
                summaryData: summaryData,
                financialMetrics: financialMetrics ?? undefined,
                balanceSheetMetrics: balanceSheetMetrics ?? undefined,
                ticker: currentTicker,
                onStageChange: handleStageChange,
              };

              if (!isGated || isUnlocked) {
                const showFollowPrompt = isGated && isUnlocked && !tickerFollowed;
                return (
                  <>
                    {showFollowPrompt && (
                      <TickerFollowPrompt
                        ticker={currentTicker}
                        onFollowed={() => setTickerFollowed(true)}
                      />
                    )}
                    <StageContent {...stageContentProps} />
                  </>
                );
              }

              if (paywallState === "skipped" && !showFloatingModal) {
                return (
                  <>
                    <InlineEmailCapture
                      ticker={currentTicker}
                      onUnlocked={handlePaywallUnlocked}
                    />
                    <StageContent {...stageContentProps} />
                  </>
                );
              }

              return (
                <div className="relative" style={{ display: "grid" }}>
                  <div
                    className="select-none"
                    style={{ gridArea: "1 / 1", filter: "blur(5px)", pointerEvents: "none" }}
                    aria-hidden="true"
                  >
                    <StageContent {...stageContentProps} />
                  </div>
                  <div
                    className="pointer-events-none"
                    style={{ gridArea: "1 / 1", position: "sticky", top: "25vh", zIndex: 40, height: 0 }}
                  >
                    <div className="pointer-events-auto mx-auto max-w-lg">
                      <EmailPaywall
                        ticker={currentTicker}
                        onUnlocked={handlePaywallUnlocked}
                        onSkipped={currentStage < 5 ? handlePaywallSkipped : undefined}
                        mode={currentStage < 5 ? "friday_report" : "action_gate"}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {(!shouldShowPaywall(currentStage) || paywallState === "unlocked") && (
              <div className="mt-8 flex items-center justify-between gap-4">
                {buttonText.previous && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStage}
                    className="h-12 px-8"
                    data-testid="button-previous-stage"
                  >
                    {buttonText.previous}
                  </Button>
                )}
                <div className="flex-1" />
                {buttonText.next && (
                  <Button
                    onClick={handleNextStage}
                    className="h-12 px-8"
                    data-testid="button-next-stage"
                  >
                    {buttonText.next}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {viewState === "error" && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <ErrorState
              title={errorInfo.title}
              message={errorInfo.message}
              onBack={handleBack}
              onRetry={handleRetry}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
