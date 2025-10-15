import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TickerInput } from "@/components/TickerInput";
import { FeatureCard } from "@/components/FeatureCard";
import { SummaryCard } from "@/components/SummaryCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { FileText, Brain, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ViewState = "input" | "loading" | "success" | "error";

// TODO: remove mock functionality - this is for design prototype only
const mockResults = {
  AAPL: {
    companyName: "Apple Inc.",
    ticker: "AAPL",
    filingDate: "November 3, 2023",
    fiscalYear: "2023",
    summary: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The Company's product lineup includes iPhone, Mac, iPad, and wearables like Apple Watch and AirPods. Apple also provides digital content and services through the App Store, Apple Music, iCloud, Apple Pay, and AppleCare. The company operates retail and online stores globally, serving consumers, businesses, and government customers. With a focus on innovation and seamless integration across devices, Apple has established itself as a leader in consumer technology and services.",
    cik: "0000320193"
  },
  TSLA: {
    companyName: "Tesla, Inc.",
    ticker: "TSLA",
    filingDate: "January 29, 2024",
    fiscalYear: "2023",
    summary: "Tesla designs, develops, manufactures, and sells fully electric vehicles, energy generation and storage systems. The company's automotive segment includes Model 3, Model Y, Model S, Model X, and Cybertruck. Tesla also develops autonomous driving technology and operates a network of Supercharger stations. The Energy Generation and Storage segment offers solar panels, Solar Roof, and energy storage products like Powerwall and Megapack. Tesla aims to accelerate the world's transition to sustainable energy through innovative electric vehicles and renewable energy solutions.",
    cik: "0001318605"
  },
  MSFT: {
    companyName: "Microsoft Corporation",
    ticker: "MSFT",
    filingDate: "July 27, 2023",
    fiscalYear: "2023",
    summary: "Microsoft develops, licenses, and supports software products, services, and devices. The company operates through three segments: Productivity and Business Processes (Office, LinkedIn, Dynamics), Intelligent Cloud (Azure, server products, enterprise services), and More Personal Computing (Windows, devices, gaming including Xbox, search advertising). Microsoft is a leader in cloud computing with Azure, offers enterprise software solutions, and has made significant investments in artificial intelligence and cloud-based services to help businesses and individuals achieve more.",
    cik: "0000789019"
  }
};

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>("input");
  const [currentTicker, setCurrentTicker] = useState("");
  const [errorInfo, setErrorInfo] = useState({ title: "", message: "" });

  // TODO: remove mock functionality
  const handleTickerSubmit = (ticker: string) => {
    setCurrentTicker(ticker);
    setViewState("loading");

    // Simulate API call
    setTimeout(() => {
      if (mockResults[ticker as keyof typeof mockResults]) {
        setViewState("success");
      } else {
        setErrorInfo({
          title: "Ticker Not Found",
          message: `We couldn't find a 10-K filing for "${ticker}". Please verify the ticker symbol and try again.`
        });
        setViewState("error");
      }
    }, 2000);
  };

  const handleBack = () => {
    setViewState("input");
    setCurrentTicker("");
  };

  const handleRetry = () => {
    setViewState("input");
  };

  // TODO: remove mock functionality
  const currentResult = mockResults[currentTicker as keyof typeof mockResults];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {viewState === "input" && (
          <>
            <HeroSection />
            
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
              <div className="mb-16">
                <TickerInput onSubmit={handleTickerSubmit} />
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                <FeatureCard
                  icon={FileText}
                  title="SEC 10-K Filings"
                  description="Direct access to official company business descriptions from SEC EDGAR"
                />
                <FeatureCard
                  icon={Brain}
                  title="AI-Powered Analysis"
                  description="Advanced AI summarizes complex filings into clear, concise insights"
                />
                <FeatureCard
                  icon={CheckCircle}
                  title="Plain English"
                  description="Beginner-friendly summaries that help you truly understand what you own"
                />
              </div>
            </div>
          </>
        )}

        {viewState === "loading" && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <LoadingState message={`Analyzing ${currentTicker}'s 10-K filing...`} />
          </div>
        )}

        {viewState === "success" && currentResult && (
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                data-testid="button-back-to-search"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                New Search
              </Button>
            </div>
            <SummaryCard {...currentResult} />
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
