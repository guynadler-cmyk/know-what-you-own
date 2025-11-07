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
}

const demoCompanies: CompanyDemo[] = [
  {
    companyName: "Palantir Technologies Inc.",
    ticker: "PLTR",
    tagline: "Enterprise AI and data analytics platform serving government and commercial clients with mission-critical decision-making software",
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
                {/* Mobile Phone Frame */}
                <div className="mx-auto w-full max-w-sm">
                  {/* Phone outer shell */}
                  <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-3 shadow-2xl border-8 border-gray-900">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>
                    
                    {/* Screen */}
                    <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio: "9/16" }}>
                      {/* Screen Content - Scrollable */}
                      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        <Card className="border-0 rounded-none shadow-none">
                          <CardHeader className="space-y-3 pb-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-bold leading-tight">{company.companyName}</h3>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {company.ticker}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-snug">
                                {company.tagline}
                              </p>
                            </div>

                            {/* Investment Tags - Compact */}
                            <div className="space-y-3 pt-2">
                              {/* Strategic Themes */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Themes</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {company.investmentThemes.map((theme) => (
                                    <TagWithTooltip
                                      key={theme.name}
                                      name={theme.name}
                                      emphasis={theme.emphasis}
                                      explanation={theme.explanation}
                                      getThemeBadgeClasses={getThemeBadgeClasses}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Moats */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  <Shield className="w-3 h-3" />
                                  <span>Moats</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {company.moats.map((moat) => (
                                    <TagWithTooltip
                                      key={moat.name}
                                      name={moat.name}
                                      emphasis={moat.emphasis}
                                      explanation={moat.explanation}
                                      getThemeBadgeClasses={getThemeBadgeClasses}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4 pt-0">
                            {/* Thesis Preview */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Investment Thesis</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {company.investmentThesis}
                              </p>
                            </div>

                            {/* Products - Compact */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold">Key Products</h4>
                              <div className="space-y-2">
                                {company.products.slice(0, 2).map((product) => (
                                  <div
                                    key={product.name}
                                    className="flex items-start gap-2 p-2 rounded-lg border border-border bg-background/50"
                                  >
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                      <p className="font-semibold text-xs">{product.name}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {product.description}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* CTA */}
                            <div className="pt-2">
                              <Button
                                size="sm"
                                onClick={() => setLocation(`/app?ticker=${company.ticker}`)}
                                className="w-full gap-2 text-xs"
                                data-testid={`button-view-${company.ticker.toLowerCase()}`}
                              >
                                View Full Analysis
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
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
