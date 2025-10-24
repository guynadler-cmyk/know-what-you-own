import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TickerInput } from "@/components/TickerInput";
import { SummaryCard } from "@/components/SummaryCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CompanySummary } from "@shared/schema";

type ViewState = "input" | "loading" | "success" | "error";

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, 
  Brain, Cpu
};

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [currentTicker, setCurrentTicker] = useState("");
  const [summaryData, setSummaryData] = useState<CompanySummary | null>(null);
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });

  const { refetch, isFetching } = useQuery({
    queryKey: ["/api/analyze", currentTicker],
    enabled: false,
    retry: false,
  });

  const handleTickerSubmit = async (ticker: string) => {
    setCurrentTicker(ticker);
    setViewState("loading");

    try {
      const response = await fetch(`/api/analyze/${ticker}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Analysis failed");
      }

      setSummaryData(data);
      setViewState("success");
    } catch (error: any) {
      setErrorInfo({
        title: error.message?.includes("not found") ? "Ticker Not Found" : "Analysis Failed",
        message: error.message || `We couldn't analyze "${ticker}". Please try again.`
      });
      setViewState("error");
    }
  };

  const handleBack = () => {
    setViewState("input");
    setCurrentTicker("");
    setSummaryData(null);
  };

  const handleRetry = () => {
    if (currentTicker) {
      handleTickerSubmit(currentTicker);
    } else {
      setViewState("input");
    }
  };

  const preparedSummary = summaryData ? {
    ...summaryData,
    products: summaryData.products.map(p => ({
      ...p,
      icon: iconMap[p.icon] || Package
    }))
  } : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {viewState === "input" && (
          <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
            <HeroSection />
            <div className="mt-16">
              <TickerInput onSubmit={handleTickerSubmit} isLoading={isFetching} />
            </div>
          </div>
        )}

        {viewState === "loading" && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <LoadingState message={`Analyzing ${currentTicker}'s 10-K filing...`} />
          </div>
        )}

        {viewState === "success" && preparedSummary && (
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
            <SummaryCard {...preparedSummary} />
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
