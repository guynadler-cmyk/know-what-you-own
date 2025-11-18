import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, TrendingUp, ArrowUpRight, Package, Calendar, Info } from "lucide-react";
import { TemporalAnalysis as TemporalAnalysisType } from "@shared/schema";

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
  const hasAnyChanges = 
    analysis.summary.discontinuedCount > 0 ||
    analysis.summary.newSustainedCount > 0 ||
    analysis.summary.evolvedCount > 0 ||
    analysis.summary.newProductsCount > 0;

  if (!hasAnyChanges) {
    return null;
  }

  const yearsRange = analysis.summary.yearsAnalyzed.length > 0
    ? `${analysis.summary.yearsAnalyzed[0]}–${analysis.summary.yearsAnalyzed[analysis.summary.yearsAnalyzed.length - 1]}`
    : "Multiple Years";

  const defaultTab = 
    analysis.discontinued.length > 0 ? "discontinued" :
    analysis.newAndSustained.length > 0 ? "new" :
    analysis.evolved.length > 0 ? "evolved" :
    "products";

  return (
    <Card className="w-full" data-testid="temporal-analysis-section">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">Changes Over Time</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed max-w-3xl">
              Track how {companyName} has evolved across {analysis.summary.yearsAnalyzed.length} years 
              of filings ({yearsRange}). See what strategies were abandoned, what new initiatives took hold, 
              and how the business narrative has shifted.
            </CardDescription>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          {analysis.summary.discontinuedCount > 0 && (
            <div className="flex flex-col items-center p-4 bg-red-500/5 rounded-lg border border-red-500/10" data-testid="stat-discontinued">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {analysis.summary.discontinuedCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Discontinued</div>
            </div>
          )}
          {analysis.summary.newSustainedCount > 0 && (
            <div className="flex flex-col items-center p-4 bg-green-500/5 rounded-lg border border-green-500/10" data-testid="stat-new-sustained">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analysis.summary.newSustainedCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">New & Sustained</div>
            </div>
          )}
          {analysis.summary.evolvedCount > 0 && (
            <div className="flex flex-col items-center p-4 bg-blue-500/5 rounded-lg border border-blue-500/10" data-testid="stat-evolved">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analysis.summary.evolvedCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Evolved</div>
            </div>
          )}
          {analysis.summary.newProductsCount > 0 && (
            <div className="flex flex-col items-center p-4 bg-purple-500/5 rounded-lg border border-purple-500/10" data-testid="stat-new-products">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.summary.newProductsCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">New Products</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0">
            {analysis.discontinued.length > 0 && (
              <TabsTrigger 
                value="discontinued" 
                className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300 flex items-center gap-2"
                data-testid="tab-discontinued"
              >
                <TrendingDown className="w-4 h-4" />
                <span className="hidden sm:inline">Discontinued</span>
                <Badge variant="secondary" className="ml-auto">{analysis.discontinued.length}</Badge>
              </TabsTrigger>
            )}
            {analysis.newAndSustained.length > 0 && (
              <TabsTrigger 
                value="new" 
                className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300 flex items-center gap-2"
                data-testid="tab-new-sustained"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
                <Badge variant="secondary" className="ml-auto">{analysis.newAndSustained.length}</Badge>
              </TabsTrigger>
            )}
            {analysis.evolved.length > 0 && (
              <TabsTrigger 
                value="evolved" 
                className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 flex items-center gap-2"
                data-testid="tab-evolved"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">Evolved</span>
                <Badge variant="secondary" className="ml-auto">{analysis.evolved.length}</Badge>
              </TabsTrigger>
            )}
            {analysis.newProducts.length > 0 && (
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 flex items-center gap-2"
                data-testid="tab-new-products"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Products</span>
                <Badge variant="secondary" className="ml-auto">{analysis.newProducts.length}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Discontinued Tab */}
          {analysis.discontinued.length > 0 && (
            <TabsContent value="discontinued" className="mt-6 space-y-4" data-testid="content-discontinued">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Items that appeared in earlier filings but were later dropped. This could signal 
                  strategic pivots, unsuccessful initiatives, or markets the company has exited.
                </p>
              </div>
              <div className="grid gap-4">
                {analysis.discontinued.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`discontinued-item-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-lg">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-base text-muted-foreground leading-relaxed">{item.context}</p>
                        </div>
                        <div className="text-right space-y-2 min-w-fit">
                          <Badge variant="outline" className="text-xs">
                            Last: {item.lastMentionedYear}
                          </Badge>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            Active: {item.yearsActive}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* New & Sustained Tab */}
          {analysis.newAndSustained.length > 0 && (
            <TabsContent value="new" className="mt-6 space-y-4" data-testid="content-new-sustained">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Initiatives introduced in recent years that have been consistently reported since. 
                  These represent the company's newest strategic priorities and growth areas.
                </p>
              </div>
              <div className="grid gap-4">
                {analysis.newAndSustained.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`new-sustained-item-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-lg">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <p className="text-base text-muted-foreground leading-relaxed">{item.context}</p>
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          Since {item.introducedYear}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Evolved Tab */}
          {analysis.evolved.length > 0 && (
            <TabsContent value="evolved" className="mt-6 space-y-4" data-testid="content-evolved">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Products, strategies, or descriptions that have meaningfully changed over time. 
                  Track how the company's language and positioning has evolved.
                </p>
              </div>
              <div className="grid gap-4">
                {analysis.evolved.map((item, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`evolved-item-${index}`}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-lg">{item.item}</h4>
                            <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                              {item.category}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {item.yearRange}
                          </Badge>
                        </div>
                        <p className="text-base font-medium text-foreground">{item.changeDescription}</p>
                        <div className="grid md:grid-cols-2 gap-4 pt-2">
                          <div className="p-4 bg-muted/40 rounded-lg border border-border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Before</div>
                            <p className="text-sm leading-relaxed">{item.beforeSnapshot}</p>
                          </div>
                          <div className="p-4 bg-muted/40 rounded-lg border border-border">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">After</div>
                            <p className="text-sm leading-relaxed">{item.afterSnapshot}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* New Products Tab */}
          {analysis.newProducts.length > 0 && (
            <TabsContent value="products" className="mt-6 space-y-4" data-testid="content-new-products">
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  New products and offerings introduced during this period. Understanding product 
                  launches helps investors gauge innovation pace and market expansion.
                </p>
              </div>
              <div className="grid gap-4">
                {analysis.newProducts.map((product, index) => (
                  <Card key={index} className="hover-elevate" data-testid={`new-product-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <h4 className="font-semibold text-lg">{product.name}</h4>
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              Launched {product.introducedYear}
                            </Badge>
                          </div>
                          <p className="text-base text-muted-foreground">{product.description}</p>
                          <div className="pt-2 pl-4 border-l-2 border-primary/30">
                            <p className="text-sm font-medium text-foreground italic">{product.significance}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
