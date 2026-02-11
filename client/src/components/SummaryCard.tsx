import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Building2, MapPin, Users, TrendingUp, Briefcase, Award, DollarSign, ExternalLink, Globe, ChevronDown, Shield, Target, Coins } from "lucide-react";
import { LucideIcon } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { InvestmentTheme, Moat, MarketOpportunity, ValueCreation, TemporalAnalysis as TemporalAnalysisType, FinePrintAnalysis as FinePrintAnalysisType } from "@shared/schema";
import { TagWithTooltip } from "@/components/TagWithTooltip";
import { CompanyLogo } from "@/components/CompanyLogo";
import { TemporalAnalysis } from "@/components/TemporalAnalysis";
import { FinePrintAnalysis } from "@/components/FinePrintAnalysis";

interface Product {
  name: string;
  icon: LucideIcon;
  description: string;
}

interface Competitor {
  name: string;
  ticker?: string;
  focus: string;
}

interface SalesChannel {
  name: string;
  explanation: string;
}

interface Metric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
}


interface SummaryCardProps {
  companyName: string;
  ticker: string;
  filingDate: string;
  fiscalYear: string;
  tagline: string;
  investmentThesis: string;
  investmentThemes: InvestmentTheme[];
  moats: Moat[];
  marketOpportunity: MarketOpportunity[];
  valueCreation: ValueCreation[];
  
  products: Product[];
  
  operations: {
    regions: string[];
    channels: SalesChannel[];
    scale: string;
  };
  
  competitors: Competitor[];
  metrics: Metric[];
  
  metadata: {
    homepage: string;
    investorRelations?: string;
  };
  
  cik?: string;
  temporalAnalysis?: TemporalAnalysisType;
}

function CompetitorQuickSummary({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/analyze', ticker],
    enabled: !!ticker,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-muted rounded w-full mb-2"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border text-muted-foreground">
        <p>Unable to load competitor summary</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 bg-background/50 rounded-lg border border-border space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Summary</p>
        <p className="text-base leading-relaxed">{data.tagline}</p>
      </div>

      {data.products && data.products.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Products</p>
          <div className="flex flex-wrap gap-2">
            {data.products.slice(0, 4).map((product: Product, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {product.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Metrics</p>
          <div className="grid grid-cols-2 gap-3">
            {data.metrics.slice(0, 4).map((metric: Metric, i: number) => (
              <div key={i} className="text-sm">
                <span className="text-muted-foreground">{metric.label}:</span>{" "}
                <span className="font-semibold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() => window.open(`/?ticker=${ticker}`, '_blank')}
        data-testid={`button-dive-deeper-${ticker}`}
      >
        Dive Deeper
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export function SummaryCard({ 
  companyName, 
  ticker, 
  filingDate, 
  fiscalYear,
  tagline,
  investmentThesis,
  investmentThemes,
  moats,
  marketOpportunity,
  valueCreation,
  products,
  operations,
  competitors,
  metrics,
  metadata,
  cik,
  temporalAnalysis
}: SummaryCardProps) {
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  // Fetch fine print analysis - custom queryFn to handle 404s gracefully
  const { data: finePrintAnalysis } = useQuery<FinePrintAnalysisType | null>({
    queryKey: ['/api/analyze', ticker, 'fine-print'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/analyze/${ticker}/fine-print`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch (error) {
        console.warn('Fine print analysis failed:', error);
        return null;
      }
    },
    enabled: !!ticker,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  // Get badge classes based on emphasis level
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
    <TooltipProvider>
    <div className="w-full max-w-6xl mx-auto space-y-16 pb-16 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-6 py-8 border-b-2 border-border pb-12">
        {/* Company Logo */}
        <div className="flex justify-center mb-6">
          <CompanyLogo
            homepage={metadata.homepage}
            companyName={companyName}
            ticker={ticker}
            size="lg"
          />
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">{companyName}</h1>
        <p className="text-2xl sm:text-3xl text-muted-foreground font-light max-w-4xl mx-auto leading-relaxed">
          {tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          <Badge variant="outline" className="font-mono text-lg px-4 py-2" data-testid="text-ticker">
            {ticker}
          </Badge>
          <span className="text-muted-foreground">•</span>
          <p className="text-muted-foreground" data-testid="text-filing-date">
            {filingDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          <a 
            href={metadata.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-base"
            data-testid="link-homepage"
          >
            <Globe className="h-4 w-4" />
            Website
          </a>
          {metadata.investorRelations && (
            <>
              <span className="text-muted-foreground">•</span>
              <a 
                href={metadata.investorRelations}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-base"
                data-testid="link-investor-relations"
              >
                <DollarSign className="h-4 w-4" />
                Investors
              </a>
            </>
          )}
        </div>
      </div>

      {/* INVESTMENT THESIS SECTION */}
      <div className="border-2 border-primary/20 rounded-2xl bg-primary/5">
        <div className="bg-primary px-8 py-4 border-b-2 border-primary">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide text-primary-foreground">Investment Thesis</h2>
        </div>
        <div className="p-8 sm:p-12">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Legend */}
            <div className="flex items-center justify-end gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-primary" />
                <span className="text-muted-foreground">Strong emphasis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-primary/70" />
                <span className="text-muted-foreground">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <span className="text-muted-foreground">Mentioned</span>
              </div>
            </div>

            {/* Tag Categories Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Strategic Themes */}
              {investmentThemes && investmentThemes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Strategic Themes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="investment-themes">
                    {investmentThemes.map((theme, index) => (
                      <TagWithTooltip
                        key={index}
                        name={theme.name}
                        emphasis={theme.emphasis}
                        explanation={theme.explanation}
                        testId={`theme-${theme.emphasis}-${index}`}
                        getThemeBadgeClasses={getThemeBadgeClasses}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Moats */}
              {moats && moats.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Competitive Moats</h3>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="moats">
                    {moats.map((moat, index) => (
                      <TagWithTooltip
                        key={index}
                        name={moat.name}
                        emphasis={moat.emphasis}
                        explanation={moat.explanation}
                        testId={`moat-${moat.emphasis}-${index}`}
                        getThemeBadgeClasses={getThemeBadgeClasses}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Market Opportunity */}
              {marketOpportunity && marketOpportunity.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Market Opportunity</h3>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="market-opportunity">
                    {marketOpportunity.map((opportunity, index) => (
                      <TagWithTooltip
                        key={index}
                        name={opportunity.name}
                        emphasis={opportunity.emphasis}
                        explanation={opportunity.explanation}
                        testId={`opportunity-${opportunity.emphasis}-${index}`}
                        getThemeBadgeClasses={getThemeBadgeClasses}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Value Creation */}
              {valueCreation && valueCreation.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Value Creation</h3>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="value-creation">
                    {valueCreation.map((value, index) => (
                      <TagWithTooltip
                        key={index}
                        name={value.name}
                        emphasis={value.emphasis}
                        explanation={value.explanation}
                        testId={`value-${value.emphasis}-${index}`}
                        getThemeBadgeClasses={getThemeBadgeClasses}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Thesis Paragraphs - Collapsible */}
            <Collapsible>
              <div className="flex justify-center pt-4">
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    data-testid="button-toggle-thesis"
                  >
                    <span>Read Full Thesis</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent>
                <div className="space-y-6 pt-6">
                  {investmentThesis.split('\n\n').map((paragraph, index) => (
                    <p 
                      key={index} 
                      className="text-lg leading-relaxed" 
                      data-testid={`text-investment-thesis-p${index + 1}`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* BUSINESS OVERVIEW CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Business Overview</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12 space-y-12">
          {/* What They Do */}
          <section className="space-y-8">
            <h3 className="text-3xl font-bold text-center">What they do</h3>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center text-center space-y-4 p-6"
                >
                  <product.icon className="h-12 w-12 text-foreground stroke-[1.5]" />
                  <h4 className="text-xl font-semibold">{product.name}</h4>
                  <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="w-full h-0.5 bg-border" />

          {/* Where & How */}
          <section className="space-y-8">
            <h3 className="text-3xl font-bold text-center">Where & how</h3>
            <div className="grid gap-12 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Global Reach</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {operations.regions.map((region, i) => (
                    <Badge key={i} variant="secondary" className="text-sm px-4 py-1.5">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Sales Channels</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {operations.channels.map((channel, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge 
                            variant="secondary" 
                            className="text-sm px-4 py-1.5 cursor-help"
                            data-testid={`badge-channel-${i}`}
                          >
                            {channel.name}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{channel.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Scale</h4>
                <p className="text-base text-muted-foreground">{operations.scale}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* TEMPORAL ANALYSIS SECTION */}
      {temporalAnalysis && (
        <TemporalAnalysis analysis={temporalAnalysis} companyName={companyName} />
      )}

      {/* FINE PRINT ANALYSIS SECTION */}
      {finePrintAnalysis && (
        <FinePrintAnalysis analysis={finePrintAnalysis} companyName={companyName} />
      )}

      {/* PERFORMANCE CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Performance</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">{metric.label}</p>
                <p className="text-4xl font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MARKET CONTEXT CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Market Context</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12">
          <div className="max-w-5xl mx-auto">
            {/* Competition */}
            <section className="space-y-6">
              <h3 className="text-2xl font-bold pb-3 border-b border-border">Competition</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {competitors.map((competitor, index) => (
                  competitor.ticker ? (
                    <Collapsible
                      key={index}
                      open={expandedCompetitor === competitor.ticker}
                      onOpenChange={(open) => setExpandedCompetitor(open ? competitor.ticker! : null)}
                    >
                      <div className="rounded-lg border border-border hover-elevate">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="w-full cursor-pointer p-4 space-y-1"
                            data-testid={`competitor-${index}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-lg text-primary">
                                  {competitor.name}
                                </p>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {competitor.ticker}
                                </Badge>
                              </div>
                              <ChevronDown 
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  expandedCompetitor === competitor.ticker ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <p className="text-base text-muted-foreground text-left">{competitor.focus}</p>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <CompetitorQuickSummary ticker={competitor.ticker} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : (
                    <div 
                      key={index} 
                      className="space-y-1 py-3"
                      data-testid={`competitor-${index}`}
                    >
                      <p className="font-semibold text-lg">{competitor.name}</p>
                      <p className="text-base text-muted-foreground">{competitor.focus}</p>
                    </div>
                  )
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>


      {/* Footer */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Source: Official company report
        </p>
      </div>
    </div>
    </TooltipProvider>
  );
}
