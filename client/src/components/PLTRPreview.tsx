import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Target, Coins, ArrowRight, Building2 } from "lucide-react";
import { TagWithTooltip } from "@/components/TagWithTooltip";
import { useLocation } from "wouter";
import type { InvestmentTheme, Moat, MarketOpportunity, ValueCreation } from "@shared/schema";

const pltrData = {
  companyName: "Palantir Technologies Inc.",
  ticker: "PLTR",
  tagline: "Enterprise AI and data analytics platform serving government and commercial clients with mission-critical decision-making software",
  
  investmentThemes: [
    { name: "AI Platform Leader", emphasis: "high" as const, explanation: "Palantir positions its Artificial Intelligence Platform (AIP) as central to its growth strategy, heavily emphasizing AI-driven software solutions" },
    { name: "Government Mission Software", emphasis: "high" as const, explanation: "Deep relationships with US government and allies for defense and intelligence operations are core to the business model" },
    { name: "Commercial Expansion", emphasis: "medium" as const, explanation: "Growing commercial customer base through its Foundry platform, though still smaller than government segment" },
  ],
  
  moats: [
    { name: "Switching Costs", emphasis: "high" as const, explanation: "Platform becomes deeply embedded in critical workflows, making migration extremely difficult and costly" },
    { name: "Network Effects", emphasis: "medium" as const, explanation: "Data integrations and customizations create compounding value as usage grows within organizations" },
    { name: "Security Clearances", emphasis: "high" as const, explanation: "Classified government work creates regulatory barriers that limit competition in core markets" },
  ],
  
  marketOpportunity: [
    { name: "Enterprise AI Adoption", emphasis: "high" as const, explanation: "Significant TAM expansion as enterprises rush to implement AI capabilities across operations" },
    { name: "Defense Tech Modernization", emphasis: "high" as const, explanation: "Growing defense budgets globally driving demand for advanced analytics and decision systems" },
  ],
  
  valueCreation: [
    { name: "Platform Monetization", emphasis: "high" as const, explanation: "Revenue growth through expanding seats, modules, and data integrations within existing customers" },
    { name: "Usage-Based Pricing", emphasis: "medium" as const, explanation: "Pricing scales with customer value realization, creating natural expansion dynamics" },
  ],
  
  investmentThesis: "Palantir's investment thesis centers on becoming the dominant enterprise operating system for AI-driven decision-making across both government and commercial sectors. The company leverages its decade-plus head start in complex data integration to build an AI platform (AIP) that management believes will drive the next wave of productivity gains. Their government relationships provide a stable revenue base with high switching costs and security clearances creating durable moats. The commercial opportunity, while earlier stage, positions them to capture enterprise AI spending as organizations seek to operationalize large language models and advanced analytics. Value creation comes through land-and-expand dynamics where initial deployments grow into organization-wide platforms, with pricing that scales alongside customer usage and realized value.",
  
  products: [
    { name: "Foundry", icon: Building2, description: "Commercial data integration and analytics platform" },
    { name: "Gotham", icon: Shield, description: "Government intelligence and defense software" },
    { name: "AIP", icon: TrendingUp, description: "Artificial Intelligence Platform for enterprises" },
  ],
};

export function PLTRPreview() {
  const [, setLocation] = useLocation();

  const handleViewFullAnalysis = () => {
    setLocation('/app?ticker=PLTR');
  };

  return (
    <Card className="max-w-5xl mx-auto shadow-xl border-primary/20">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">{pltrData.companyName}</h3>
              <Badge variant="outline" className="font-mono text-sm">
                {pltrData.ticker}
              </Badge>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              {pltrData.tagline}
            </p>
          </div>
        </div>

        {/* Investment Tags - Four Dimensions */}
        <div className="space-y-4 pt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strategic Themes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <TrendingUp className="w-4 h-4" />
                <span>Strategic Themes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pltrData.investmentThemes.map((theme) => (
                  <TagWithTooltip
                    key={theme.name}
                    name={theme.name}
                    emphasis={theme.emphasis}
                    explanation={theme.explanation}
                  />
                ))}
              </div>
            </div>

            {/* Competitive Moats */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Shield className="w-4 h-4" />
                <span>Competitive Moats</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pltrData.moats.map((moat) => (
                  <TagWithTooltip
                    key={moat.name}
                    name={moat.name}
                    emphasis={moat.emphasis}
                    explanation={moat.explanation}
                  />
                ))}
              </div>
            </div>

            {/* Market Opportunity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Target className="w-4 h-4" />
                <span>Market Opportunity</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pltrData.marketOpportunity.map((opp) => (
                  <TagWithTooltip
                    key={opp.name}
                    name={opp.name}
                    emphasis={opp.emphasis}
                    explanation={opp.explanation}
                  />
                ))}
              </div>
            </div>

            {/* Value Creation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Coins className="w-4 h-4" />
                <span>Value Creation</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pltrData.valueCreation.map((vc) => (
                  <TagWithTooltip
                    key={vc.name}
                    name={vc.name}
                    emphasis={vc.emphasis}
                    explanation={vc.explanation}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Investment Thesis Preview */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Investment Thesis</h4>
          <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
            {pltrData.investmentThesis}
          </p>
        </div>

        {/* Products Preview */}
        <div className="space-y-3">
          <h4 className="text-lg font-semibold">Key Products</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            {pltrData.products.map((product) => (
              <div
                key={product.name}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <product.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 flex justify-center">
          <Button
            size="lg"
            onClick={handleViewFullAnalysis}
            className="gap-2"
            data-testid="button-view-full-pltr"
          >
            View Full Analysis
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
