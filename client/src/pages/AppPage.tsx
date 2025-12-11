import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";
import { analytics } from "@/lib/analytics";

type ViewState = "input" | "loading" | "success" | "error";

export default function AppPage() {
  const [location] = useLocation();
  const [viewState, setViewState] = useState<ViewState>("input");
  const [currentTicker, setCurrentTicker] = useState("");
  const [currentStage, setCurrentStage] = useState(1);
  const [summaryData, setSummaryData] = useState<CompanySummary | null>(null);
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [balanceSheetMetrics, setBalanceSheetMetrics] = useState<BalanceSheetMetrics | null>(null);

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

  const handleTickerSubmit = async (ticker: string, targetStage?: number) => {
    setCurrentTicker(ticker);
    setViewState("loading");
    
    // Update URL immediately so GA4 captures the ticker in page path
    const stageToUse = targetStage !== undefined ? targetStage : currentStage;
    const params = new URLSearchParams();
    params.set('ticker', ticker);
    params.set('stage', stageToUse.toString());
    window.history.pushState({}, '', `?${params.toString()}`);
    
    analytics.trackTickerSearch(ticker);
    analytics.trackAnalysisStarted(ticker);

    try {
      const response = await fetch(`/api/analyze/${ticker}`);
      const data = await response.json();

      if (!response.ok) {
        // Store the error data for better error messaging
        const errorData = {
          error: data.error || "Analysis Failed",
          message: data.message || "Something went wrong. Please try again."
        };
        throw { errorData };
      }

      setSummaryData(data);
      setViewState("success");
      
      analytics.trackAnalysisCompleted(ticker);

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
      
      // Preload Stage 2 financial metrics in the background
      fetchFinancialMetrics(ticker);
    } catch (error: any) {
      // Extract error information from thrown error or fallback to generic message
      const errorTitle = error.errorData?.error || "Analysis Failed";
      const errorMessage = error.errorData?.message || 
        `We couldn't analyze "${ticker}". Please try again.`;
      
      setErrorInfo({
        title: errorTitle,
        message: errorMessage
      });
      setViewState("error");
      
      analytics.trackAnalysisError(ticker, errorMessage);
    }
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

  return (
    <div className="flex min-h-screen flex-col">
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
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <LoadingState message={`Analyzing ${currentTicker}'s 10-K filing...`} />
          </div>
        )}

        {viewState === "success" && summaryData && (
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="h-12 px-8 rounded-full"
                data-testid="button-back-to-search"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Search
              </Button>
            </div>
            
            <JourneyNarrative />
            <StageNavigation 
              currentStage={currentStage} 
              onStageChange={handleStageChange} 
            />
            <StageContent 
              stage={currentStage} 
              summaryData={summaryData}
              financialMetrics={financialMetrics}
              balanceSheetMetrics={balanceSheetMetrics}
            />
            
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
