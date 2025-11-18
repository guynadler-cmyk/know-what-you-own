import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingDown, TrendingUp, ArrowUpRight, Package, ChevronDown, Calendar, Sparkles } from "lucide-react";
import { TemporalAnalysis as TemporalAnalysisType } from "@shared/schema";
import { useState } from "react";

interface TemporalAnalysisProps {
  analysis: TemporalAnalysisType;
  companyName: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  product: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  strategy: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  market: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
  partnership: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
  initiative: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
  description: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20",
};

export function TemporalAnalysis({ analysis, companyName }: TemporalAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    discontinued: false,
    newAndSustained: false,
    evolved: false,
    newProducts: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasAnyChanges = 
    analysis.summary.discontinuedCount > 0 ||
    analysis.summary.newSustainedCount > 0 ||
    analysis.summary.evolvedCount > 0 ||
    analysis.summary.newProductsCount > 0;

  if (!hasAnyChanges) {
    return null;
  }

  const yearsRange = analysis.summary.yearsAnalyzed.length > 0
    ? `${analysis.summary.yearsAnalyzed[0]} - ${analysis.summary.yearsAnalyzed[analysis.summary.yearsAnalyzed.length - 1]}`
    : "Multiple Years";

  return (
    <div className="w-full max-w-6xl mx-auto mb-16 animate-fade-in" data-testid="temporal-analysis-section">
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {companyName} Through Time
          </CardTitle>
          <p className="text-muted-foreground text-lg mt-2">
            Key changes identified across {analysis.summary.yearsAnalyzed.length} years of SEC filings ({yearsRange})
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timeline Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-background/50 rounded-lg border border-border">
            <div className="text-center space-y-2" data-testid="stat-discontinued">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {analysis.summary.discontinuedCount}
              </div>
              <div className="text-sm text-muted-foreground">Discontinued</div>
            </div>
            <div className="text-center space-y-2" data-testid="stat-new-sustained">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analysis.summary.newSustainedCount}
              </div>
              <div className="text-sm text-muted-foreground">New & Sustained</div>
            </div>
            <div className="text-center space-y-2" data-testid="stat-evolved">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analysis.summary.evolvedCount}
              </div>
              <div className="text-sm text-muted-foreground">Evolved</div>
            </div>
            <div className="text-center space-y-2" data-testid="stat-new-products">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.summary.newProductsCount}
              </div>
              <div className="text-sm text-muted-foreground">New Products</div>
            </div>
          </div>

          {/* Discontinued Items */}
          {analysis.discontinued.length > 0 && (
            <Collapsible
              open={expandedSections.discontinued}
              onOpenChange={() => toggleSection('discontinued')}
              data-testid="section-discontinued"
            >
              <CollapsibleTrigger className="w-full hover-elevate active-elevate-2" data-testid="button-toggle-discontinued">
                <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-lg">Discontinued Items</span>
                    <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-300">
                      {analysis.discontinued.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.discontinued ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {analysis.discontinued.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`discontinued-item-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.context}</p>
                        </div>
                        <div className="text-right space-y-1 min-w-fit">
                          <Badge variant="outline" className="text-xs">
                            Last: {item.lastMentionedYear}
                          </Badge>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {item.yearsActive}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* New & Sustained Items */}
          {analysis.newAndSustained.length > 0 && (
            <Collapsible
              open={expandedSections.newAndSustained}
              onOpenChange={() => toggleSection('newAndSustained')}
              data-testid="section-new-sustained"
            >
              <CollapsibleTrigger className="w-full hover-elevate active-elevate-2" data-testid="button-toggle-new-sustained">
                <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-lg">New & Sustained</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-300">
                      {analysis.newAndSustained.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.newAndSustained ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {analysis.newAndSustained.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`new-sustained-item-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.context}</p>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Since {item.introducedYear}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Evolved Items */}
          {analysis.evolved.length > 0 && (
            <Collapsible
              open={expandedSections.evolved}
              onOpenChange={() => toggleSection('evolved')}
              data-testid="section-evolved"
            >
              <CollapsibleTrigger className="w-full hover-elevate active-elevate-2" data-testid="button-toggle-evolved">
                <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-lg">Evolved Over Time</span>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                      {analysis.evolved.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.evolved ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {analysis.evolved.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`evolved-item-${index}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-base">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {item.yearRange}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">{item.changeDescription}</p>
                        <div className="grid md:grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-muted/30 rounded-md border border-border">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Before</div>
                            <p className="text-sm">{item.beforeSnapshot}</p>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-md border border-border">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">After</div>
                            <p className="text-sm">{item.afterSnapshot}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* New Products */}
          {analysis.newProducts.length > 0 && (
            <Collapsible
              open={expandedSections.newProducts}
              onOpenChange={() => toggleSection('newProducts')}
              data-testid="section-new-products"
            >
              <CollapsibleTrigger className="w-full hover-elevate active-elevate-2" data-testid="button-toggle-new-products">
                <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold text-lg">New Products Introduced</span>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      {analysis.newProducts.length}
                    </Badge>
                  </div>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.newProducts ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {analysis.newProducts.map((product, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`new-product-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h4 className="font-semibold text-base">{product.name}</h4>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              Launched {product.introducedYear}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                          <p className="text-sm font-medium text-foreground pt-1">{product.significance}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
