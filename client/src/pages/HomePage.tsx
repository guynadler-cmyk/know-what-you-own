import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { TickerInput } from "@/components/TickerInput";
import { FeatureCard } from "@/components/FeatureCard";
import { SummaryCard } from "@/components/SummaryCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { FileText, Brain, CheckCircle, Package, Zap, Globe, TrendingUp, Users, Target, Cpu, Shield } from "lucide-react";
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
    sections: [
      {
        icon: <Package className="h-4 w-4" />,
        title: "Products",
        items: [
          "iPhone smartphones",
          "Mac computers & laptops",
          "iPad tablets",
          "Apple Watch & AirPods"
        ]
      },
      {
        icon: <Zap className="h-4 w-4" />,
        title: "Services",
        items: [
          "App Store ecosystem",
          "Apple Music streaming",
          "iCloud storage",
          "Apple Pay & AppleCare"
        ]
      },
      {
        icon: <Globe className="h-4 w-4" />,
        title: "Market Reach",
        items: [
          "Global retail presence",
          "Online store platform",
          "Consumer & enterprise",
          "150+ countries"
        ]
      },
      {
        icon: <TrendingUp className="h-4 w-4" />,
        title: "Business Model",
        items: [
          "Hardware sales revenue",
          "Subscription services",
          "Ecosystem integration",
          "Premium positioning"
        ]
      },
      {
        icon: <Users className="h-4 w-4" />,
        title: "Competitive Edge",
        items: [
          "Brand loyalty & premium",
          "Seamless device integration",
          "Innovation focus",
          "Privacy & security first"
        ]
      },
      {
        icon: <Target className="h-4 w-4" />,
        title: "Strategy",
        items: [
          "Expand services revenue",
          "Sustainable innovation",
          "AR/VR technologies",
          "Emerging markets growth"
        ]
      }
    ],
    cik: "0000320193"
  },
  TSLA: {
    companyName: "Tesla, Inc.",
    ticker: "TSLA",
    filingDate: "January 29, 2024",
    fiscalYear: "2023",
    tagline: "Electric vehicles and sustainable energy solutions",
    sections: [
      {
        icon: <Package className="h-4 w-4" />,
        title: "Vehicles",
        items: [
          "Model 3 & Model Y",
          "Model S & Model X",
          "Cybertruck",
          "Semi & Roadster (upcoming)"
        ]
      },
      {
        icon: <Zap className="h-4 w-4" />,
        title: "Energy",
        items: [
          "Solar panels & Solar Roof",
          "Powerwall home battery",
          "Megapack grid storage",
          "Supercharger network"
        ]
      },
      {
        icon: <Cpu className="h-4 w-4" />,
        title: "Technology",
        items: [
          "Full Self-Driving (FSD)",
          "Battery innovation",
          "Manufacturing automation",
          "AI & neural networks"
        ]
      },
      {
        icon: <Globe className="h-4 w-4" />,
        title: "Manufacturing",
        items: [
          "Gigafactory network",
          "Vertical integration",
          "US, China, Germany plants",
          "Rapid scaling capacity"
        ]
      },
      {
        icon: <Target className="h-4 w-4" />,
        title: "Mission",
        items: [
          "Accelerate sustainable energy",
          "Mass market EVs",
          "Renewable energy transition",
          "Reduce carbon footprint"
        ]
      },
      {
        icon: <TrendingUp className="h-4 w-4" />,
        title: "Growth Focus",
        items: [
          "Scale production globally",
          "Autonomous driving revenue",
          "Energy storage expansion",
          "Cost reduction innovation"
        ]
      }
    ],
    cik: "0001318605"
  },
  MSFT: {
    companyName: "Microsoft Corporation",
    ticker: "MSFT",
    filingDate: "July 27, 2023",
    fiscalYear: "2023",
    tagline: "Cloud computing and enterprise software leader",
    sections: [
      {
        icon: <Package className="h-4 w-4" />,
        title: "Productivity",
        items: [
          "Microsoft 365 suite",
          "Office applications",
          "LinkedIn platform",
          "Dynamics 365 CRM"
        ]
      },
      {
        icon: <Zap className="h-4 w-4" />,
        title: "Cloud",
        items: [
          "Azure infrastructure",
          "Server products",
          "Enterprise services",
          "AI & OpenAI partnership"
        ]
      },
      {
        icon: <Users className="h-4 w-4" />,
        title: "Personal Computing",
        items: [
          "Windows OS",
          "Surface devices",
          "Xbox gaming ecosystem",
          "Bing search & ads"
        ]
      },
      {
        icon: <Shield className="h-4 w-4" />,
        title: "Security",
        items: [
          "Cloud security solutions",
          "Identity management",
          "Threat protection",
          "Compliance tools"
        ]
      },
      {
        icon: <Cpu className="h-4 w-4" />,
        title: "Innovation",
        items: [
          "AI integration across products",
          "Copilot assistants",
          "Quantum computing",
          "Mixed reality (HoloLens)"
        ]
      },
      {
        icon: <Target className="h-4 w-4" />,
        title: "Strategy",
        items: [
          "Cloud-first transformation",
          "AI democratization",
          "Platform ecosystem",
          "Enterprise partnerships"
        ]
      }
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
