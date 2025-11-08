import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Target, Coins, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { TagWithTooltip } from "@/components/TagWithTooltip";
import { useLocation } from "wouter";

interface InvestmentTag {
  name: string;
  emphasis: "high" | "medium" | "low";
  explanation: string;
}

interface Product {
  name: string;
  description: string;
}

interface ValueProposition {
  headline: string;
  subtext: string;
  proofBadge: string;
  focusArea: "filing-analysis" | "emphasis-scoring" | "four-dimensions";
}

interface CompanyDemo {
  companyName: string;
  ticker: string;
  tagline: string;
  investmentThemes: InvestmentTag[];
  moats: InvestmentTag[];
  marketOpportunity: InvestmentTag[];
  valueCreation: InvestmentTag[];
  investmentThesis: string;
  products: Product[];
  valueProposition: ValueProposition;
}

const demoCompanies: CompanyDemo[] = [
  {
    companyName: "Palantir Technologies Inc.",
    ticker: "PLTR",
    tagline: "Enterprise AI and data analytics platform serving government and commercial clients with mission-critical decision-making software",
    valueProposition: {
      headline: "What hedge funds pay analysts $200K/year to read",
      subtext: "We digest the 100+ page filing—like a Wall Street analyst on demand",
      proofBadge: "Professional-grade filing intelligence",
      focusArea: "filing-analysis",
    },
    investmentThemes: [
      { name: "AI Platform Leader", emphasis: "high" as const, explanation: "Palantir positions its Artificial Intelligence Platform (AIP) as central to its growth strategy" },
      { name: "Government Mission Software", emphasis: "high" as const, explanation: "Deep relationships with US government and allies for defense and intelligence operations" },
      { name: "Commercial Expansion", emphasis: "medium" as const, explanation: "Growing commercial customer base through its Foundry platform" },
    ],
    moats: [
      { name: "Switching Costs", emphasis: "high" as const, explanation: "Platform becomes deeply embedded in critical workflows, making migration extremely difficult" },
      { name: "Network Effects", emphasis: "medium" as const, explanation: "Data integrations and customizations create compounding value as usage grows" },
      { name: "Security Clearances", emphasis: "high" as const, explanation: "Classified government work creates regulatory barriers that limit competition" },
    ],
    marketOpportunity: [
      { name: "Enterprise AI Adoption", emphasis: "high" as const, explanation: "Significant TAM expansion as enterprises rush to implement AI capabilities" },
      { name: "Defense Tech Modernization", emphasis: "high" as const, explanation: "Growing defense budgets globally driving demand for advanced analytics" },
    ],
    valueCreation: [
      { name: "Platform Monetization", emphasis: "high" as const, explanation: "Revenue growth through expanding seats, modules, and data integrations" },
      { name: "Usage-Based Pricing", emphasis: "medium" as const, explanation: "Pricing scales with customer value realization" },
    ],
    investmentThesis: "Palantir's investment thesis centers on becoming the dominant enterprise operating system for AI-driven decision-making across both government and commercial sectors.",
    products: [
      { name: "Foundry", description: "Commercial data integration platform" },
      { name: "Gotham", description: "Government intelligence software" },
      { name: "AIP", description: "AI Platform for enterprises" },
    ],
  },
  {
    companyName: "NVIDIA Corporation",
    ticker: "NVDA",
    tagline: "Leading designer of graphics processing units and AI computing platforms powering data centers, gaming, and autonomous systems worldwide",
    valueProposition: {
      headline: "Stop guessing what matters. We quantify it.",
      subtext: "Analyst-level signal sorting, no Bloomberg terminal required",
      proofBadge: "Institutional-grade emphasis analysis",
      focusArea: "emphasis-scoring",
    },
    investmentThemes: [
      { name: "AI Infrastructure", emphasis: "high" as const, explanation: "NVIDIA's GPUs are the de facto standard for training and running AI models at scale" },
      { name: "Data Center Dominance", emphasis: "high" as const, explanation: "Commanding market share in accelerated computing for cloud and enterprise data centers" },
      { name: "Platform Ecosystem", emphasis: "medium" as const, explanation: "CUDA software platform creates developer lock-in and competitive moat" },
    ],
    moats: [
      { name: "Technology Leadership", emphasis: "high" as const, explanation: "Multi-generational lead in GPU architecture and AI accelerator performance" },
      { name: "Software Ecosystem", emphasis: "high" as const, explanation: "CUDA platform has massive developer base making switching costs prohibitive" },
      { name: "Scale Advantages", emphasis: "medium" as const, explanation: "Manufacturing partnerships and R&D scale enable continued innovation leadership" },
    ],
    marketOpportunity: [
      { name: "AI Computing Demand", emphasis: "high" as const, explanation: "Explosive growth in AI model training and inference driving unprecedented GPU demand" },
      { name: "Sovereign AI", emphasis: "medium" as const, explanation: "Nations building domestic AI infrastructure creating new market segments" },
    ],
    valueCreation: [
      { name: "Premium Pricing Power", emphasis: "high" as const, explanation: "Technology leadership enables significant pricing premiums over competitors" },
      { name: "Installed Base Growth", emphasis: "high" as const, explanation: "Expanding GPU deployments drive software and service revenue expansion" },
    ],
    investmentThesis: "NVIDIA's thesis revolves around being the picks-and-shovels provider for the AI revolution, with its GPU architecture becoming essential infrastructure for modern computing workloads.",
    products: [
      { name: "H100/H200", description: "Data center AI training GPUs" },
      { name: "GeForce RTX", description: "Gaming and creator GPUs" },
      { name: "CUDA Platform", description: "Parallel computing software" },
    ],
  },
  {
    companyName: "SoundHound AI, Inc.",
    ticker: "SOUN",
    tagline: "Voice AI and conversational intelligence platform enabling natural language interactions for automotive, restaurants, and smart devices",
    valueProposition: {
      headline: "The 4-part framework professionals use",
      subtext: "Themes, moats, opportunity, value creation—pulled straight from the 10-K",
      proofBadge: "Professional investment framework—free for retail",
      focusArea: "four-dimensions",
    },
    investmentThemes: [
      { name: "Voice AI Pioneer", emphasis: "high" as const, explanation: "Independent voice AI platform competing against tech giants in conversational interfaces" },
      { name: "Automotive Integration", emphasis: "medium" as const, explanation: "Growing presence in vehicle voice assistants and in-car experiences" },
      { name: "Enterprise Adoption", emphasis: "medium" as const, explanation: "Expanding into restaurant ordering and customer service automation" },
    ],
    moats: [
      { name: "Proprietary Technology", emphasis: "medium" as const, explanation: "Custom-built voice recognition avoiding dependence on big tech platforms" },
      { name: "Domain Expertise", emphasis: "medium" as const, explanation: "Specialized knowledge in voice AI and natural language understanding" },
    ],
    marketOpportunity: [
      { name: "Voice Interface Growth", emphasis: "high" as const, explanation: "Increasing adoption of voice-first interfaces across industries and devices" },
      { name: "AI Assistant Market", emphasis: "medium" as const, explanation: "Enterprises seeking alternatives to Big Tech voice platforms" },
    ],
    valueCreation: [
      { name: "Platform Licensing", emphasis: "medium" as const, explanation: "Recurring revenue from OEM partnerships and enterprise deployments" },
      { name: "Usage-Based Model", emphasis: "medium" as const, explanation: "Revenue scales with voice query volumes and active users" },
    ],
    investmentThesis: "SoundHound positions itself as the independent voice AI alternative, betting that enterprises and OEMs will prefer a neutral platform over Big Tech-controlled assistants.",
    products: [
      { name: "Houndify", description: "Voice AI platform and SDK" },
      { name: "Smart Answering", description: "Restaurant phone ordering AI" },
      { name: "Auto Voice", description: "In-vehicle voice assistant" },
    ],
  },
];

export function DemoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const getThemeBadgeClasses = (emphasis: "high" | "medium" | "low") => {
    switch (emphasis) {
      case "high":
        return "bg-primary text-primary-foreground border-primary";
      case "medium":
        return "bg-primary/70 text-primary-foreground border-primary/70";
      case "low":
        return "bg-primary/40 text-primary-foreground border-primary/40";
    }
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Mobile Frame Container */}
      <div className="relative flex items-center justify-center py-8">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex"
          data-testid="button-carousel-prev"
          aria-label="Previous company"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Carousel */}
        <div className="overflow-hidden w-full max-w-md mx-12" ref={emblaRef}>
          <div className="flex">
            {demoCompanies.map((company, index) => (
              <div key={company.ticker} className="flex-[0_0_100%] min-w-0">
                {/* Marketing Headline */}
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold">
                    {company.valueProposition.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    {company.valueProposition.subtext}
                  </p>
                  <div className="inline-block">
                    <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                      {company.valueProposition.proofBadge}
                    </Badge>
                  </div>
                </div>

                {/* Mobile Phone Frame */}
                <div className="mx-auto w-full max-w-sm">
                  {/* Phone outer shell */}
                  <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-8 border-gray-900">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
                    
                    {/* Screen */}
                    <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio: "9/16" }}>
                      {/* Screen Content - Unique per slide */}
                      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {/* PLTR: Split-screen filing analysis */}
                        {company.valueProposition.focusArea === "filing-analysis" && (
                          <div className="h-full flex flex-col">
                            {/* Dense 10-K excerpt (left side simulation) */}
                            <div className="bg-muted/30 p-3 border-b-2 border-primary/20">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-mono text-muted-foreground">10-K Filing (Page 87)</p>
                                  <Badge variant="outline" className="text-xs">{company.ticker}</Badge>
                                </div>
                                <p className="text-xs font-mono leading-tight text-muted-foreground/70 line-clamp-4">
                                  Item 1. Business. Palantir Technologies Inc. ("Palantir," "we," "us," or "our") builds and deploys software platforms for the intelligence community and defense sector in the United States, institutional investors, commercial enterprises, and government agencies around the world. Our software is used to integrate, manage, and secure data...
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="h-1 flex-1 bg-primary/20 rounded-full">
                                    <div className="h-1 w-3/4 bg-primary rounded-full"></div>
                                  </div>
                                  <span className="text-xs text-primary font-semibold">AI Extracting...</span>
                                </div>
                              </div>
                            </div>

                            {/* AI-extracted summary (right side simulation) */}
                            <div className="flex-1 p-4 bg-background">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold">AI Analysis</p>
                                    <p className="text-xs text-muted-foreground">Strategic Themes</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {company.investmentThemes.slice(0, 3).map((theme) => (
                                    <Badge
                                      key={theme.name}
                                      className={getThemeBadgeClasses(theme.emphasis) + " text-xs"}
                                    >
                                      {theme.name}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {company.investmentThesis.slice(0, 120)}...
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => setLocation(`/app?ticker=${company.ticker}`)}
                                  className="w-full gap-2 text-xs mt-4"
                                  data-testid={`button-view-${company.ticker.toLowerCase()}`}
                                >
                                  See Full Analysis
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* NVDA: Zoomed-in emphasis scoring */}
                        {company.valueProposition.focusArea === "emphasis-scoring" && (
                          <div className="h-full flex flex-col p-4">
                            {/* Before: Unstructured paragraph */}
                            <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-muted">
                              <p className="text-xs font-semibold mb-2 text-muted-foreground">Before: Raw filing text</p>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-mono">
                                NVIDIA's AI computing platform is experiencing unprecedented demand across data centers globally. Our GPU architecture has become essential infrastructure for AI model training and inference, with CUDA software creating significant developer ecosystem advantages...
                              </p>
                            </div>

                            {/* After: Color-coded emphasis tags (STAR of the show) */}
                            <div className="flex-1">
                              <p className="text-xs font-semibold mb-3">After: AI-ranked by emphasis</p>
                              
                              {/* Zoomed emphasis tags */}
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">High Emphasis</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {company.investmentThemes.filter(t => t.emphasis === "high").map((theme) => (
                                      <div key={theme.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                        <Badge className={getThemeBadgeClasses(theme.emphasis) + " text-xs flex-1"}>
                                          {theme.name}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary/70" />
                                    <span className="text-xs font-semibold uppercase text-muted-foreground">Medium Emphasis</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {company.investmentThemes.filter(t => t.emphasis === "medium").map((theme) => (
                                      <div key={theme.name} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary/70"></div>
                                        <Badge className={getThemeBadgeClasses(theme.emphasis) + " text-xs flex-1"}>
                                          {theme.name}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Emphasis Legend */}
                              <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-xs font-semibold mb-2">Emphasis Analysis</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  We analyze frequency, depth of discussion, and strategic importance across the entire filing to rank what management emphasizes most.
                                </p>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => setLocation(`/app?ticker=${company.ticker}`)}
                                className="w-full gap-2 text-xs mt-4"
                                data-testid={`button-view-${company.ticker.toLowerCase()}`}
                              >
                                Analyze Any Stock
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* SOUN: 2x2 grid of 4 dimensions */}
                        {company.valueProposition.focusArea === "four-dimensions" && (
                          <div className="h-full flex flex-col p-4">
                            <div className="text-center mb-4">
                              <Badge variant="outline" className="font-mono text-xs mb-2">
                                {company.ticker}
                              </Badge>
                              <p className="text-sm font-bold">{company.companyName}</p>
                            </div>

                            {/* 2x2 Grid Layout */}
                            <div className="grid grid-cols-2 gap-3 flex-1">
                              {/* Strategy (Themes) */}
                              <Card className="p-3 hover-elevate">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold">Strategy</span>
                                </div>
                                <div className="space-y-1">
                                  {company.investmentThemes.slice(0, 2).map((theme) => (
                                    <Badge
                                      key={theme.name}
                                      className={getThemeBadgeClasses(theme.emphasis) + " text-xs w-full justify-start"}
                                    >
                                      {theme.name}
                                    </Badge>
                                  ))}
                                </div>
                              </Card>

                              {/* Defense (Moats) */}
                              <Card className="p-3 hover-elevate">
                                <div className="flex items-center gap-2 mb-2">
                                  <Shield className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold">Defense</span>
                                </div>
                                <div className="space-y-1">
                                  {company.moats.slice(0, 2).map((moat) => (
                                    <Badge
                                      key={moat.name}
                                      className={getThemeBadgeClasses(moat.emphasis) + " text-xs w-full justify-start"}
                                    >
                                      {moat.name}
                                    </Badge>
                                  ))}
                                </div>
                              </Card>

                              {/* Growth (Opportunity) */}
                              <Card className="p-3 hover-elevate">
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold">Growth</span>
                                </div>
                                <div className="space-y-1">
                                  {company.marketOpportunity.slice(0, 2).map((opp) => (
                                    <Badge
                                      key={opp.name}
                                      className={getThemeBadgeClasses(opp.emphasis) + " text-xs w-full justify-start"}
                                    >
                                      {opp.name}
                                    </Badge>
                                  ))}
                                </div>
                              </Card>

                              {/* Profit (Value Creation) */}
                              <Card className="p-3 hover-elevate">
                                <div className="flex items-center gap-2 mb-2">
                                  <Coins className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold">Profit</span>
                                </div>
                                <div className="space-y-1">
                                  {company.valueCreation.slice(0, 2).map((value) => (
                                    <Badge
                                      key={value.name}
                                      className={getThemeBadgeClasses(value.emphasis) + " text-xs w-full justify-start"}
                                    >
                                      {value.name}
                                    </Badge>
                                  ))}
                                </div>
                              </Card>
                            </div>

                            {/* Framework Explanation */}
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <p className="text-xs font-semibold mb-1">The Professional Framework</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Wall Street analysts use this 4-part structure to build investment conviction. Now you can too.
                              </p>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => setLocation(`/app?ticker=${company.ticker}`)}
                              className="w-full gap-2 text-xs mt-3"
                              data-testid={`button-view-${company.ticker.toLowerCase()}`}
                            >
                              Try Your Own Stock
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex"
          data-testid="button-carousel-next"
          aria-label="Next company"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {demoCompanies.map((company, index) => (
          <button
            key={company.ticker}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover-elevate"
            }`}
            aria-label={`View ${company.companyName} preview`}
            data-testid={`dot-${company.ticker.toLowerCase()}`}
          />
        ))}
      </div>

      {/* Swipe Hint */}
      <p className="text-center text-sm text-muted-foreground mt-4 sm:hidden">
        Swipe to explore different companies
      </p>
    </div>
  );
}
