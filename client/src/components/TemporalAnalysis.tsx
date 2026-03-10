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

const tileBase = "h-auto py-4 px-3 flex-col items-center rounded-lg border bg-white data-[state=inactive]:border-[var(--border)] hover-elevate";

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
    <div data-testid="temporal-analysis-section">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2.5 h-auto bg-transparent p-0 mb-5">
          {analysis.discontinued.length > 0 && (
            <TabsTrigger
              value="discontinued"
              className={`${tileBase} data-[state=active]:border-red-400 data-[state=active]:bg-red-50`}
              data-testid="stat-discontinued"
            >
              <TrendingDown className="w-4 h-4 text-red-500 mb-1.5" />
              <div className="text-[24px] font-bold leading-none text-red-600 dark:text-red-400 mb-1">
                {analysis.summary.discontinuedCount}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--lp-ink-ghost)' }}>Discontinued</div>
            </TabsTrigger>
          )}
          {analysis.newAndSustained.length > 0 && (
            <TabsTrigger
              value="new"
              className={`${tileBase} data-[state=active]:border-green-400 data-[state=active]:bg-green-50`}
              data-testid="stat-new-sustained"
            >
              <TrendingUp className="w-4 h-4 text-green-500 mb-1.5" />
              <div className="text-[24px] font-bold leading-none text-green-600 dark:text-green-400 mb-1">
                {analysis.summary.newSustainedCount}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--lp-ink-ghost)' }}>New & Sustained</div>
            </TabsTrigger>
          )}
          {analysis.evolved.length > 0 && (
            <TabsTrigger
              value="evolved"
              className={`${tileBase} data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50`}
              data-testid="stat-evolved"
            >
              <ArrowUpRight className="w-4 h-4 text-blue-500 mb-1.5" />
              <div className="text-[24px] font-bold leading-none text-blue-600 dark:text-blue-400 mb-1">
                {analysis.summary.evolvedCount}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--lp-ink-ghost)' }}>Evolved</div>
            </TabsTrigger>
          )}
          {analysis.newProducts.length > 0 && (
            <TabsTrigger
              value="products"
              className={`${tileBase} data-[state=active]:border-purple-400 data-[state=active]:bg-purple-50`}
              data-testid="stat-new-products"
            >
              <Package className="w-4 h-4 text-purple-500 mb-1.5" />
              <div className="text-[24px] font-bold leading-none text-purple-600 dark:text-purple-400 mb-1">
                {analysis.summary.newProductsCount}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--lp-ink-ghost)' }}>New Products</div>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Discontinued Tab */}
        {analysis.discontinued.length > 0 && (
          <TabsContent value="discontinued" className="mt-5 space-y-3" data-testid="content-discontinued">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border" style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--lp-ink-ghost)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                Items that appeared in earlier filings but were later dropped. This could signal
                strategic pivots, unsuccessful initiatives, or markets the company has exited.
              </p>
            </div>
            <div className="grid gap-3">
              {analysis.discontinued.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border"
                  style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)', padding: '14px 16px' }}
                  data-testid={`discontinued-item-${index}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--lp-ink)' }}>{item.item}</h4>
                        <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>{item.context}</p>
                    </div>
                    <div className="text-right space-y-1 min-w-fit flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        Last: {item.lastMentionedYear}
                      </Badge>
                      <div className="text-xs whitespace-nowrap" style={{ color: 'var(--lp-ink-ghost)' }}>
                        Active: {item.yearsActive}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* New & Sustained Tab */}
        {analysis.newAndSustained.length > 0 && (
          <TabsContent value="new" className="mt-5 space-y-3" data-testid="content-new-sustained">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border" style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--lp-ink-ghost)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                Initiatives introduced in recent years that have been consistently reported since.
                These represent the company's newest strategic priorities and growth areas.
              </p>
            </div>
            <div className="grid gap-3">
              {analysis.newAndSustained.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border flex items-start justify-between gap-4"
                  style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)', padding: '14px 16px' }}
                  data-testid={`new-sustained-item-${index}`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--lp-ink)' }}>{item.item}</h4>
                      <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>{item.context}</p>
                  </div>
                  <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                    Since {item.introducedYear}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Evolved Tab */}
        {analysis.evolved.length > 0 && (
          <TabsContent value="evolved" className="mt-5 space-y-3" data-testid="content-evolved">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border" style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--lp-ink-ghost)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                Products, strategies, or descriptions that have meaningfully changed over time.
                Track how the company's language and positioning has evolved.
              </p>
            </div>
            <div className="grid gap-3">
              {analysis.evolved.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border"
                  style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)', padding: '14px 16px' }}
                  data-testid={`evolved-item-${index}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm" style={{ color: 'var(--lp-ink)' }}>{item.item}</h4>
                        <Badge className={CATEGORY_COLORS[item.category] || CATEGORY_COLORS.description}>
                          {item.category}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                        {item.yearRange}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--lp-ink)' }}>{item.changeDescription}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>Before</div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>{item.beforeSnapshot}</p>
                      </div>
                      <div className="p-3 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>After</div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>{item.afterSnapshot}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* New Products Tab */}
        {analysis.newProducts.length > 0 && (
          <TabsContent value="products" className="mt-5 space-y-3" data-testid="content-new-products">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border" style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--lp-ink-ghost)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                New products and offerings introduced during this period. Understanding product
                launches helps investors gauge innovation pace and market expansion.
              </p>
            </div>
            <div className="grid gap-3">
              {analysis.newProducts.map((product, index) => (
                <div
                  key={index}
                  className="rounded-lg border flex items-start gap-4"
                  style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)', padding: '14px 16px' }}
                  data-testid={`new-product-${index}`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.08)' }}>
                    <Package className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <h4 className="font-semibold text-sm" style={{ color: 'var(--lp-ink)' }}>{product.name}</h4>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        Launched {product.introducedYear}
                      </Badge>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--lp-ink-light)' }}>{product.description}</p>
                    <div className="pt-1 pl-3 border-l-2" style={{ borderColor: 'var(--lp-teal-pale)' }}>
                      <p className="text-sm italic" style={{ color: 'var(--lp-ink-mid)' }}>{product.significance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
