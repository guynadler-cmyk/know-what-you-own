import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { TickerContextCard } from "@/components/TickerContextCard";
import { StageNavigation } from "@/components/StageNavigation";
import { StickyTickerBar } from "@/components/StickyTickerBar";
import { StageContent } from "@/components/StageContent";
import { EmailPaywall } from "@/components/EmailPaywall";
import { InlineEmailCapture } from "@/components/InlineEmailCapture";
import { MobileGateSheet } from "@/components/MobileGateSheet";
import { MobileAnalysisPaywall } from "@/components/MobileAnalysisPaywall";
import { TickerFollowPrompt } from "@/components/TickerFollowPrompt";
import { Button } from "@/components/ui/button";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics, WatchlistSnapshot } from "@shared/schema";

import { useNavContext } from "@/contexts/NavContext";
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

type ViewState = "loading" | "success" | "error";

export default function StockPage() {
  const params = useParams<{ ticker: string }>();
  const ticker = (params.ticker ?? "").toUpperCase();
  const [, navigate] = useLocation();
  const { setAnalysisState } = useNavContext();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [currentStage, setCurrentStage] = useState(1);
  const [summaryData, setSummaryData] = useState<CompanySummary | null>(null);
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetrics | null>(null);

  const [paywallState, setPaywallState] = useState<PaywallState>("locked");
  const [showFloatingModal, setShowFloatingModal] = useState(false);
  const [lastSkippedStage, setLastSkippedStage] = useState<number | null>(null);
  const [tickerFollowed, setTickerFollowed] = useState(true);
  const [isFirstAnalysis, setIsFirstAnalysis] = useState(false);
  const [showMobileGate, setShowMobileGate] = useState(false);
  const [showAnalysisPaywall, setShowAnalysisPaywall] = useState<3 | 4 | null>(null);

  const stage3SubSectionsClickedRef = useRef<Set<string>>(new Set());
  const stage4SubSectionsClickedRef = useRef<Set<string>>(new Set());
  const analysisPaywallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAnalysisPaywallSkipped = (stage: 3 | 4): boolean => {
    return sessionStorage.getItem(`analysis_paywall_skipped_stage_${stage}`) === "true";
  };
  const markAnalysisPaywallSkipped = (stage: 3 | 4): void => {
    sessionStorage.setItem(`analysis_paywall_skipped_stage_${stage}`, "true");
  };
  const isAnalysisPaywallFired = (stage: 3 | 4): boolean => {
    return sessionStorage.getItem(`analysis_paywall_fired_stage_${stage}`) === "true";
  };
  const markAnalysisPaywallFired = (stage: 3 | 4): void => {
    sessionStorage.setItem(`analysis_paywall_fired_stage_${stage}`, "true");
  };

  useEffect(() => {
    if (viewState !== "loading") {
      setIsFirstAnalysis(false);
      return;
    }
    const timer = setTimeout(() => setIsFirstAnalysis(true), 5000);
    return () => clearTimeout(timer);
  }, [viewState]);

  useEffect(() => {
    if (!ticker) return;
    const tickerAtStart = ticker;
    setIsFirstAnalysis(false);
    setTickerFollowed(true);
    const localState = getPaywallState(ticker);
    if (localState === "unlocked") {
      setPaywallState("unlocked");
      const storedEmail = getStoredEmail();
      if (storedEmail) {
        fetch(`/api/waitlist/check-ticker?email=${encodeURIComponent(storedEmail)}&ticker=${encodeURIComponent(ticker)}`)
          .then(r => r.json())
          .then(data => {
            if (tickerAtStart !== ticker) return;
            setTickerFollowed(!!data.followed);
          })
          .catch(() => {});
      }
      return;
    }
    if (localState === "skipped") {
      const persisted = getSkippedStage(ticker);
      if (persisted !== null) setLastSkippedStage(persisted);
    }
    const storedEmail = getStoredEmail();
    if (storedEmail) {
      fetch(`/api/waitlist/check?email=${encodeURIComponent(storedEmail)}`)
        .then(r => r.json())
        .then(data => {
          if (tickerAtStart !== ticker) return;
          if (data.exists) {
            unlockPaywall(tickerAtStart);
            setPaywallState("unlocked");
            fetch(`/api/waitlist/check-ticker?email=${encodeURIComponent(storedEmail!)}&ticker=${encodeURIComponent(tickerAtStart)}`)
              .then(r => r.json())
              .then(d => {
                if (tickerAtStart !== ticker) return;
                setTickerFollowed(!!d.followed);
              })
              .catch(() => {});
          } else {
            setPaywallState(localState);
          }
        })
        .catch(() => {
          if (tickerAtStart !== ticker) return;
          setPaywallState(localState);
        });
    } else {
      setPaywallState(localState);
    }
  }, [ticker]);

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
    if (!ticker) return;
    skipPaywall(ticker, currentStage);
    setPaywallState("skipped");
    setLastSkippedStage(currentStage);
    setShowFloatingModal(false);
  };

  useEffect(() => {
    setShowMobileGate(false);
    setShowAnalysisPaywall(null);
    stage3SubSectionsClickedRef.current = new Set();
    stage4SubSectionsClickedRef.current = new Set();
    if (analysisPaywallTimerRef.current) {
      clearTimeout(analysisPaywallTimerRef.current);
      analysisPaywallTimerRef.current = null;
    }
  }, [ticker]);

  const mobileGateDismissedRef = useRef(false);

  const handleMobileScroll = useCallback(() => {
    if (window.innerWidth >= 768) return;
    if (paywallState === "unlocked") return;
    if (getStoredEmail()) return;
    if (mobileGateDismissedRef.current) return;
    setShowMobileGate(true);
  }, [paywallState]);

  const handleMobileGateDismissed = useCallback(() => {
    mobileGateDismissedRef.current = true;
    setShowMobileGate(false);
  }, []);

  const handleStage3SubSectionClick = useCallback((subsectionId: string) => {
    if (paywallState === "unlocked") return;
    if (isAnalysisPaywallFired(3) || isAnalysisPaywallSkipped(3)) return;
    const clicked = stage3SubSectionsClickedRef.current;
    clicked.add(subsectionId);
    if (clicked.size >= 2 && !analysisPaywallTimerRef.current) {
      analysisPaywallTimerRef.current = setTimeout(() => {
        analysisPaywallTimerRef.current = null;
        if (!isAnalysisPaywallFired(3) && !isAnalysisPaywallSkipped(3)) {
          markAnalysisPaywallFired(3);
          setShowAnalysisPaywall(3);
        }
      }, 5000);
    }
  }, [paywallState]);

  const handleStage4SubSectionClick = useCallback((subsectionId: string) => {
    if (paywallState === "unlocked") return;
    if (isAnalysisPaywallFired(4) || isAnalysisPaywallSkipped(4)) return;
    const clicked = stage4SubSectionsClickedRef.current;
    clicked.add(subsectionId);
    if (clicked.size >= 2 && !analysisPaywallTimerRef.current) {
      analysisPaywallTimerRef.current = setTimeout(() => {
        analysisPaywallTimerRef.current = null;
        if (!isAnalysisPaywallFired(4) && !isAnalysisPaywallSkipped(4)) {
          markAnalysisPaywallFired(4);
          setShowAnalysisPaywall(4);
        }
      }, 4000);
    }
  }, [paywallState]);

  const handleAnalysisPaywallSkip = useCallback(() => {
    if (showAnalysisPaywall !== null) {
      markAnalysisPaywallSkipped(showAnalysisPaywall);
    }
    setShowAnalysisPaywall(null);
  }, [showAnalysisPaywall]);

  const handleAnalysisPaywallSignup = useCallback(async () => {
    setShowAnalysisPaywall(null);
    const { signInWithGoogle } = await import("@/lib/firebase");
    signInWithGoogle().catch(console.error);
  }, []);

  const fetchFinancialMetrics = async (t: string) => {
    const requestedTicker = t.toUpperCase();
    setFinancialMetrics(null);
    setBalanceSheetMetrics(null);

    try {
      const response = await fetch(`/api/financials/${requestedTicker}`);
      const data = await response.json();

      if (!response.ok) {
        console.warn(`Financial metrics not available for ${requestedTicker}:`, data.message);
        return;
      }

      const { balanceSheet, ...incomeMetrics } = data;
      setFinancialMetrics(incomeMetrics);
      if (balanceSheet) {
        setBalanceSheetMetrics(balanceSheet);
      }
    } catch (error) {
      console.warn(`Failed to fetch financial metrics for ${requestedTicker}:`, error);
    }
  };

  const handleTickerSubmit = async (t: string) => {
    analytics.trackTickerSearch(t);
    analytics.trackAnalysisStarted(t);

    try {
      const response = await fetch(`/api/analyze/${t}`);
      const data = await response.json();

      if (!response.ok) {
        const errorData = {
          error: data.error || "Analysis Failed",
          message: data.message || "Something went wrong. Please try again."
        };
        throw { errorData };
      }

      setSummaryData(data);
      setViewState("success");

      analytics.trackAnalysisCompleted(t);

      if (data.competitors && Array.isArray(data.competitors)) {
        data.competitors.forEach((competitor: any) => {
          if (competitor.ticker) {
            queryClient.prefetchQuery({
              queryKey: ['/api/analyze', competitor.ticker],
              queryFn: async () => {
                const res = await fetch(`/api/analyze/${competitor.ticker}`);
                if (!res.ok) throw new Error('Failed to fetch competitor data');
                return res.json();
              },
              staleTime: 1000 * 60 * 60,
            });
          }
        });
      }

      fetchFinancialMetrics(t);
    } catch (error: any) {
      const errorTitle = error.errorData?.error || "Analysis Failed";
      const errorMessage = error.errorData?.message ||
        `We couldn't analyze "${t}". Please try again.`;

      setErrorInfo({
        title: errorTitle,
        message: errorMessage
      });
      setViewState("error");

      analytics.trackAnalysisError(t, errorMessage);
    }
  };

  useEffect(() => {
    if (!ticker) return;
    handleTickerSubmit(ticker);
  }, [ticker]);

  const STAGE_NAMES = ['Business', 'Performance', 'Valuation', 'Strategy', 'Timing', 'Protection'];

  const handleStageChange = (stage: number) => {
    if (analysisPaywallTimerRef.current) {
      clearTimeout(analysisPaywallTimerRef.current);
      analysisPaywallTimerRef.current = null;
    }
    if (currentStage === 3 && stage !== 3) {
      stage3SubSectionsClickedRef.current = new Set();
    }
    if (currentStage === 4 && stage !== 4) {
      stage4SubSectionsClickedRef.current = new Set();
    }
    setCurrentStage(stage);
    window.scrollTo(0, 0);
    analytics.trackStageViewed(stage, STAGE_NAMES[stage - 1] || 'Unknown', ticker);

    if (stage === 2 && ticker && !financialMetrics) {
      fetchFinancialMetrics(ticker);
    }

    if (stage === 2 && ticker) {
      queryClient.prefetchQuery({
        queryKey: [`/api/valuation/${ticker}`],
      });
      const tf = (typeof window !== 'undefined' && localStorage.getItem('timing-timeframe') === 'daily') ? 'daily' : 'weekly';
      queryClient.prefetchQuery({
        queryKey: ['/api/timing', ticker, tf],
        queryFn: async () => {
          const res = await fetch(`/api/timing/${ticker}?timeframe=${tf}`);
          if (!res.ok) throw new Error('Prefetch failed');
          return res.json();
        },
      });
    }
  };

  const handlePreviousStage = () => {
    if (currentStage > 1) handleStageChange(currentStage - 1);
  };

  const handleRetry = () => {
    setViewState("loading");
    handleTickerSubmit(ticker);
  };

  const handleBack = () => {
    navigate("/app");
  };

  const showPreviousStageButton = currentStage > 1;

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

    const valuationData = queryClient.getQueryData([`/api/valuation/${ticker}`]) as any;
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
    const timingData = queryClient.getQueryData(['/api/timing', ticker, tf]) as any;
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

    const strategyKey = `strategyPlan:${ticker}`;
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

  const getWatchlistSnapshotRef = useRef(getWatchlistSnapshot);
  getWatchlistSnapshotRef.current = getWatchlistSnapshot;

  useEffect(() => {
    if (viewState === "success" && summaryData) {
      setAnalysisState({
        ticker,
        companyName: summaryData.companyName,
        getSnapshot: () => getWatchlistSnapshotRef.current(),
      });
    } else {
      setAnalysisState(null);
    }
    return () => setAnalysisState(null);
  }, [viewState, ticker, summaryData?.companyName]);

  return (
    <div className="flex min-h-screen flex-col max-w-[100vw] overflow-x-hidden">
      <Helmet>
        <title>{ticker} — Investment Thesis & Analysis | restnvest</title>
      </Helmet>
      <Header />

      <main className="flex-1">
        {viewState === "loading" && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" data-testid="analysis-loading">
            <LoadingState message={`Analyzing ${ticker}'s 10-K filing...`} ticker={ticker} isFirstAnalysis={isFirstAnalysis} />
          </div>
        )}

        {viewState === "success" && summaryData && (
          <div className="mx-auto max-w-7xl px-4 py-4 sm:py-12 sm:px-6 lg:px-8" data-active-ticker={ticker}>
            <TickerContextCard ticker={ticker} />
            <div className="sm:sticky sm:top-0 sm:z-50 mb-8 sm:bg-background sm:-mx-6 sm:px-6 sm:py-2 lg:-mx-8 lg:px-8">
              <StickyTickerBar
                ticker={ticker}
                companyName={summaryData.companyName}
                homepage={summaryData.metadata?.homepage}
              />
              <StageNavigation
                currentStage={currentStage}
                onStageChange={handleStageChange}
              />
            </div>

            {(() => {
              const isGated = shouldShowPaywall(currentStage);
              const isUnlocked = paywallState === "unlocked";

              const stageContentProps = {
                stage: currentStage,
                summaryData: summaryData,
                financialMetrics: financialMetrics ?? undefined,
                balanceSheetMetrics: balanceSheetMetrics ?? undefined,
                ticker: ticker,
                onStageChange: handleStageChange,
                onMobileScroll: currentStage === 1 ? handleMobileScroll : undefined,
                onSubSectionClick: currentStage === 3 ? handleStage3SubSectionClick : currentStage === 4 ? handleStage4SubSectionClick : undefined,
              };

              if (!isGated || isUnlocked) {
                const showFollowPrompt = isGated && isUnlocked && !tickerFollowed;
                return (
                  <>
                    {showFollowPrompt && (
                      <TickerFollowPrompt
                        ticker={ticker}
                        onFollowed={() => setTickerFollowed(true)}
                      />
                    )}
                    <StageContent {...stageContentProps} />
                    {showMobileGate && currentStage === 1 && paywallState !== "unlocked" && (
                      <MobileGateSheet
                        ticker={ticker}
                        onUnlocked={handlePaywallUnlocked}
                        onDismissed={handleMobileGateDismissed}
                      />
                    )}
                  </>
                );
              }

              if (paywallState === "skipped" && !showFloatingModal) {
                return (
                  <>
                    <InlineEmailCapture
                      ticker={ticker}
                      onUnlocked={handlePaywallUnlocked}
                    />
                    <StageContent {...stageContentProps} />
                    {showMobileGate && currentStage === 1 && (
                      <MobileGateSheet
                        ticker={ticker}
                        onUnlocked={handlePaywallUnlocked}
                        onDismissed={handleMobileGateDismissed}
                      />
                    )}
                  </>
                );
              }

              return (
                <>
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
                          ticker={ticker}
                          onUnlocked={handlePaywallUnlocked}
                          onSkipped={currentStage < 5 ? handlePaywallSkipped : undefined}
                          mode={currentStage < 5 ? "friday_report" : "action_gate"}
                        />
                      </div>
                    </div>
                  </div>
                  {showMobileGate && currentStage === 1 && (
                    <MobileGateSheet
                      ticker={ticker}
                      onUnlocked={handlePaywallUnlocked}
                      onDismissed={handleMobileGateDismissed}
                    />
                  )}
                </>
              );
            })()}

            <MobileAnalysisPaywall
              isOpen={showAnalysisPaywall !== null && paywallState !== "unlocked"}
              onSkip={handleAnalysisPaywallSkip}
              onSignup={handleAnalysisPaywallSignup}
            />

            {showPreviousStageButton && (!shouldShowPaywall(currentStage) || paywallState === "unlocked") && (
              <div className="mt-8">
                <Button
                  variant="outline"
                  onClick={handlePreviousStage}
                  className="h-12 px-8"
                  data-testid="button-previous-stage"
                >
                  ← Previous Stage
                </Button>
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
