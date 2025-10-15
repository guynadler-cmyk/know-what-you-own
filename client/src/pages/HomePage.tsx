import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TickerInput } from "@/components/TickerInput";
import { FeatureCard } from "@/components/FeatureCard";
import { SummaryCard } from "@/components/SummaryCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { FileText, Brain, CheckCircle, Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2 } from "lucide-react";
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
    tagline: "Consumer electronics and digital services leader",
    products: [
      { name: "iPhone", icon: Smartphone, description: "Flagship smartphone line" },
      { name: "Mac", icon: Laptop, description: "Computers & laptops" },
      { name: "iPad", icon: Tablet, description: "Tablet devices" },
      { name: "Wearables", icon: Watch, description: "Watch & AirPods" }
    ],
    operations: {
      regions: ["Americas", "Europe", "Greater China", "Japan", "Rest of Asia Pacific"],
      channels: ["Retail Stores", "Online Store", "Direct Sales", "Third-Party Resellers"],
      scale: "Global presence in 150+ countries with 500+ retail stores"
    },
    competitors: [
      { name: "Samsung", focus: "Smartphones & consumer electronics" },
      { name: "Google", focus: "Software, services & Pixel devices" },
      { name: "Microsoft", focus: "Software, cloud services & Surface" },
      { name: "Amazon", focus: "E-commerce & cloud services" }
    ],
    leaders: [
      { name: "Tim Cook", role: "Chief Executive Officer", initials: "TC" },
      { name: "Luca Maestri", role: "Chief Financial Officer", initials: "LM" },
      { name: "Jeff Williams", role: "Chief Operating Officer", initials: "JW" },
      { name: "Katherine Adams", role: "General Counsel", initials: "KA" }
    ],
    metrics: [
      { label: "Annual Revenue", value: "$383B", trend: "up" as const },
      { label: "Net Income", value: "$97B", trend: "up" as const },
      { label: "Employees", value: "161K" },
      { label: "R&D Spending", value: "$30B", trend: "up" as const }
    ],
    cik: "0000320193"
  },
  TSLA: {
    companyName: "Tesla, Inc.",
    ticker: "TSLA",
    filingDate: "January 29, 2024",
    fiscalYear: "2023",
    tagline: "Electric vehicles and sustainable energy solutions",
    products: [
      { name: "Model 3 & Y", icon: Car, description: "Mass market EVs" },
      { name: "Model S & X", icon: Car, description: "Premium EVs" },
      { name: "Energy Storage", icon: Battery, description: "Powerwall & Megapack" },
      { name: "Solar", icon: Zap, description: "Solar panels & roofs" }
    ],
    operations: {
      regions: ["North America", "Europe", "China", "Other Markets"],
      channels: ["Direct Sales", "Online Orders", "Tesla Stores", "Delivery Centers"],
      scale: "Gigafactories in Texas, Nevada, California, Shanghai, and Berlin"
    },
    competitors: [
      { name: "Traditional Automakers", focus: "Ford, GM transitioning to EVs" },
      { name: "EV Startups", focus: "Rivian, Lucid Motors" },
      { name: "Chinese EVs", focus: "BYD, NIO, XPeng" },
      { name: "Energy Companies", focus: "Solar & storage providers" }
    ],
    leaders: [
      { name: "Elon Musk", role: "Chief Executive Officer", initials: "EM" },
      { name: "Vaibhav Taneja", role: "Chief Financial Officer", initials: "VT" },
      { name: "Andrew Baglino", role: "SVP Powertrain & Energy", initials: "AB" },
      { name: "Franz von Holzhausen", role: "Chief Designer", initials: "FH" }
    ],
    metrics: [
      { label: "Annual Revenue", value: "$96B", trend: "up" as const },
      { label: "Vehicles Delivered", value: "1.8M", trend: "up" as const },
      { label: "Employees", value: "140K" },
      { label: "Production Capacity", value: "2M+/yr", trend: "up" as const }
    ],
    cik: "0001318605"
  },
  MSFT: {
    companyName: "Microsoft Corporation",
    ticker: "MSFT",
    filingDate: "July 27, 2023",
    fiscalYear: "2023",
    tagline: "Cloud computing and enterprise software leader",
    products: [
      { name: "Azure", icon: Cloud, description: "Cloud platform" },
      { name: "Microsoft 365", icon: Laptop, description: "Productivity suite" },
      { name: "Windows", icon: Server, description: "Operating system" },
      { name: "Xbox", icon: Gamepad2, description: "Gaming platform" }
    ],
    operations: {
      regions: ["United States", "Europe", "Asia Pacific", "Other Americas"],
      channels: ["Cloud Services", "Enterprise Licensing", "OEM Partners", "Consumer Retail"],
      scale: "Operates in 190+ countries with major data centers worldwide"
    },
    competitors: [
      { name: "Amazon (AWS)", focus: "Cloud infrastructure leader" },
      { name: "Google Cloud", focus: "Cloud & AI services" },
      { name: "Salesforce", focus: "CRM and business apps" },
      { name: "Oracle", focus: "Database & enterprise software" }
    ],
    leaders: [
      { name: "Satya Nadella", role: "Chief Executive Officer", initials: "SN" },
      { name: "Amy Hood", role: "Chief Financial Officer", initials: "AH" },
      { name: "Brad Smith", role: "President & Vice Chair", initials: "BS" },
      { name: "Judson Althoff", role: "EVP & Chief Commercial Officer", initials: "JA" }
    ],
    metrics: [
      { label: "Annual Revenue", value: "$212B", trend: "up" as const },
      { label: "Cloud Revenue", value: "$111B", trend: "up" as const },
      { label: "Employees", value: "221K" },
      { label: "R&D Investment", value: "$27B", trend: "up" as const }
    ],
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
