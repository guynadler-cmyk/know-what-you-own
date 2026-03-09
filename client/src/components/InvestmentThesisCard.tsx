import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Shield, Target, Coins, ChevronDown } from "lucide-react";
import { TagWithTooltip } from "@/components/TagWithTooltip";
import { InvestmentTheme, Moat, MarketOpportunity, ValueCreation } from "@shared/schema";

export interface InvestmentThesisCardProps {
  investmentThesis: string;
  investmentThemes: InvestmentTheme[];
  moats: Moat[];
  marketOpportunity: MarketOpportunity[];
  valueCreation: ValueCreation[];
}

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

export function InvestmentThesisCard({
  investmentThesis,
  investmentThemes,
  moats,
  marketOpportunity,
  valueCreation,
}: InvestmentThesisCardProps) {
  return (
    <div className="border-2 border-primary/20 rounded-2xl bg-primary/5">
      <div className="bg-primary px-8 py-4 border-b-2 border-primary">
        <h2 className="text-2xl font-bold text-center uppercase tracking-wide text-primary-foreground">
          Investment Thesis
        </h2>
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
            {investmentThemes && investmentThemes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Strategic Themes</h3>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="hero-investment-themes">
                  {investmentThemes.map((theme, index) => (
                    <TagWithTooltip
                      key={index}
                      name={theme.name}
                      emphasis={theme.emphasis}
                      explanation={theme.explanation}
                      testId={`hero-theme-${theme.emphasis}-${index}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}

            {moats && moats.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Competitive Moats</h3>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="hero-moats">
                  {moats.map((moat, index) => (
                    <TagWithTooltip
                      key={index}
                      name={moat.name}
                      emphasis={moat.emphasis}
                      explanation={moat.explanation}
                      testId={`hero-moat-${moat.emphasis}-${index}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}

            {marketOpportunity && marketOpportunity.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Market Opportunity</h3>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="hero-market-opportunity">
                  {marketOpportunity.map((opportunity, index) => (
                    <TagWithTooltip
                      key={index}
                      name={opportunity.name}
                      emphasis={opportunity.emphasis}
                      explanation={opportunity.explanation}
                      testId={`hero-opportunity-${opportunity.emphasis}-${index}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}

            {valueCreation && valueCreation.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Value Creation</h3>
                </div>
                <div className="flex flex-wrap gap-2" data-testid="hero-value-creation">
                  {valueCreation.map((value, index) => (
                    <TagWithTooltip
                      key={index}
                      name={value.name}
                      emphasis={value.emphasis}
                      explanation={value.explanation}
                      testId={`hero-value-${value.emphasis}-${index}`}
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
                  data-testid="hero-button-toggle-thesis"
                >
                  <span>Read Full Thesis</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="space-y-6 pt-6">
                {investmentThesis.split("\n\n").map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-lg leading-relaxed"
                    data-testid={`hero-thesis-p${index + 1}`}
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
  );
}
