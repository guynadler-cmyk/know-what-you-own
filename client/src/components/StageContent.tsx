import { SummaryCard } from "@/components/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Rocket, Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, Cpu, Brain, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle, Eye, XCircle, Shield, Circle } from "lucide-react";
import { CompanySummary, FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  Smartphone, Laptop, Tablet, Watch, Car, Zap, Battery, Server, 
  Cloud, Gamepad2, Package, Code, Globe, Music, Video, Tv, Search, 
  Brain, Cpu
};

interface StageContentProps {
  stage: number;
  summaryData: CompanySummary | null;
  financialMetrics: FinancialMetrics | null | undefined;
  balanceSheetMetrics: BalanceSheetMetrics | null | undefined;
}

const STAGE_INFO = {
  2: {
    title: "Understand Performance",
    description: "Analyze financial metrics, revenue trends, and operational efficiency to gauge business health."
  },
  3: {
    title: "Evaluate the Stock",
    description: "Assess current valuation and stock price relative to business quality and growth potential."
  },
  4: {
    title: "Plan Your Investment",
    description: "Determine appropriate position sizing and develop your personalized investment strategy."
  },
  5: {
    title: "Time It Sensibly",
    description: "Identify favorable entry points based on market conditions and technical signals."
  },
  6: {
    title: "Protect What's Yours",
    description: "Establish stop losses, exit rules, and risk management protocols to safeguard your capital."
  }
};

function FinancialStrengthSection({ metrics }: { metrics: BalanceSheetMetrics | null }) {
  if (!metrics) {
    return (
      <div className="text-center py-8" data-testid="balance-sheet-loading">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span>Loading balance sheet data...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: 'strong' | 'caution' | 'weak') => {
    switch (status) {
      case 'strong':
        return <Circle className="w-5 h-5 fill-green-500 text-green-500" />;
      case 'caution':
        return <Circle className="w-5 h-5 fill-yellow-500 text-yellow-500" />;
      case 'weak':
        return <Circle className="w-5 h-5 fill-red-500 text-red-500" />;
    }
  };

  const checks = [
    { id: 'liquidity', data: metrics.checks.liquidity },
    { id: 'debt-burden', data: metrics.checks.debtBurden },
    { id: 'equity-growth', data: metrics.checks.equityGrowth },
  ];

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Financial Strength</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Three key balance sheet health checks
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2" data-testid="balance-sheet-checks">
          {checks.map(({ id, data }) => (
            <details 
              key={id} 
              className="group border border-border rounded-md overflow-hidden hover-elevate"
              data-testid={`balance-check-${id}`}
            >
              <summary 
                className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none"
                data-testid={`check-trigger-${id}`}
              >
                <span data-testid={`status-icon-${id}-${data.status}`}>
                  {getStatusIcon(data.status)}
                </span>
                <span className="font-medium flex-1" data-testid={`check-title-${id}`}>
                  {data.title}
                </span>
                <svg 
                  className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-2 border-t border-border/50" data-testid={`check-content-${id}`}>
                <p 
                  className="text-sm leading-relaxed mb-3" 
                  data-testid={`check-summary-${id}`}
                >
                  {data.summary}
                </p>
                <p 
                  className="text-sm leading-relaxed text-muted-foreground" 
                  data-testid={`check-details-${id}`}
                  dangerouslySetInnerHTML={{ __html: data.details }}
                />
              </div>
            </details>
          ))}
        </div>
        <div className="bg-muted/50 rounded-lg p-3 mt-4">
          <p className="text-xs text-muted-foreground text-center">
            Data from fiscal year {metrics.fiscalYear} balance sheet. Source: Alpha Vantage
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialMetricsMatrix({ metrics }: { metrics: FinancialMetrics | null }) {
  if (!metrics) {
    return (
      <div className="text-center py-12" data-testid="financial-metrics-loading">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          <span>Loading financial metrics...</span>
        </div>
      </div>
    );
  }

  const quadrants = [
    {
      id: 'declining-growing',
      icon: Eye,
      title: 'Efficient or Eating Itself?',
      subtitle: 'Profits are up but sales are shrinking. Is this sustainable or just cost-cutting?',
      revenue: 'declining' as const,
      earnings: 'growing' as const,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      inactiveBgColor: 'bg-blue-400/40',
    },
    {
      id: 'growing-growing',
      icon: CheckCircle,
      title: 'Healthy Compounder',
      subtitle: 'Growing sales and profits. Classic long-term compounder. Worth a look.',
      revenue: 'growing' as const,
      earnings: 'growing' as const,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      inactiveBgColor: 'bg-green-400/40',
    },
    {
      id: 'declining-declining',
      icon: XCircle,
      title: 'Value Trap Risk',
      subtitle: 'Both are declining — not a good sign. Likely not a business to own long term.',
      revenue: 'declining' as const,
      earnings: 'declining' as const,
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      inactiveBgColor: 'bg-orange-400/40',
    },
    {
      id: 'growing-declining',
      icon: AlertTriangle,
      title: 'Scaling or Struggling?',
      subtitle: 'Sales are rising, but profits are falling. Is it investing for growth or losing control?',
      revenue: 'growing' as const,
      earnings: 'declining' as const,
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      inactiveBgColor: 'bg-blue-500/40',
    },
  ];

  const activeQuadrant = quadrants.find(
    q => q.revenue === metrics.revenueGrowth && q.earnings === metrics.earningsGrowth
  );

  return (
    <div className="space-y-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border-2 border-primary/20">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {activeQuadrant?.title || 'Classification'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-0 border-4 border-background rounded-lg overflow-hidden shadow-2xl">
          {quadrants.map((quadrant) => {
            const isActive = quadrant === activeQuadrant;
            return (
              <div 
                key={quadrant.id}
                className={cn(
                  "relative transition-all duration-300 border-4",
                  isActive ? [quadrant.bgColor, "border-white shadow-[0_0_0_6px_rgba(0,0,0,0.3)]", "ring-4 ring-white/50"] : [quadrant.inactiveBgColor, "border-transparent"],
                  quadrant.textColor
                )}
                data-testid={`quadrant-${quadrant.id}`}
              >
                <div className="p-12 flex flex-col items-center justify-center text-center min-h-[280px] space-y-4">
                  <div className={cn(
                    "mb-2 transition-transform",
                    isActive && "scale-125"
                  )}>
                    <quadrant.icon className="w-16 h-16" />
                  </div>
                  <h3 className={cn(
                    "font-bold text-xl transition-all",
                    isActive ? "text-white" : "text-white/70"
                  )}>
                    {quadrant.title}
                  </h3>
                  <p className={cn(
                    "text-sm leading-relaxed max-w-xs transition-all",
                    isActive ? "text-white/95" : "text-white/60"
                  )}>
                    {quadrant.subtitle}
                  </p>

                  {isActive && (
                    <div className="mt-6 pt-6 border-t border-white/30 w-full max-w-xs">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Revenue YoY:</span>
                          <span className="font-bold text-lg">
                            {metrics.revenueChangePercent > 0 ? '+' : ''}{metrics.revenueChangePercent}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Earnings YoY:</span>
                          <span className="font-bold text-lg">
                            {metrics.earningsChangePercent > 0 ? '+' : ''}{metrics.earningsChangePercent}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card data-testid="revenue-metrics">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Revenue (Year-over-Year)
                {metrics.revenueGrowth === 'growing' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{metrics.fiscalYear}</span>
                <span className="text-lg font-semibold" data-testid="current-revenue">
                  {metrics.currentRevenue}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{metrics.previousFiscalYear}</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.previousRevenue}
                </span>
              </div>
              <div className="pt-2 border-t">
                <span 
                  className={cn(
                    "text-sm font-medium",
                    metrics.revenueChangePercent > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                  data-testid="revenue-change"
                >
                  {metrics.revenueChangePercent > 0 ? '+' : ''}{metrics.revenueChangePercent}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="earnings-metrics">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Net Income (Year-over-Year)
                {metrics.earningsGrowth === 'growing' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{metrics.fiscalYear}</span>
                <span className="text-lg font-semibold" data-testid="current-earnings">
                  {metrics.currentEarnings}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">{metrics.previousFiscalYear}</span>
                <span className="text-sm text-muted-foreground">
                  {metrics.previousEarnings}
                </span>
              </div>
              <div className="pt-2 border-t">
                <span 
                  className={cn(
                    "text-sm font-medium",
                    metrics.earningsChangePercent > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                  data-testid="earnings-change"
                >
                  {metrics.earningsChangePercent > 0 ? '+' : ''}{metrics.earningsChangePercent}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground text-center">
            Data compares most recent fiscal year ({metrics.fiscalYear}) vs. one year prior ({metrics.previousFiscalYear}). 
            Source: Alpha Vantage
          </p>
        </div>
      </div>
    </div>
  );
}

export function StageContent({ stage, summaryData, financialMetrics, balanceSheetMetrics }: StageContentProps) {
  if (stage === 1 && summaryData) {
    const preparedSummary = {
      ...summaryData,
      products: summaryData.products.map(p => ({
        ...p,
        icon: iconMap[p.icon] || Package
      }))
    };
    return <SummaryCard {...preparedSummary} />;
  }

  if (stage === 2) {
    const getLogoUrl = (homepage: string) => {
      try {
        const url = new URL(homepage);
        return `https://logo.clearbit.com/${url.hostname}`;
      } catch {
        return null;
      }
    };
    const logoUrl = summaryData?.metadata?.homepage ? getLogoUrl(summaryData.metadata.homepage) : null;

    return (
      <Card data-testid="stage-2-content">
        <CardHeader className="text-center pb-8">
          {summaryData && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                {logoUrl ? (
                  <img 
                    src={logoUrl}
                    alt={`${summaryData.companyName} logo`}
                    className="w-16 h-16 rounded-lg object-contain bg-white p-2 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${logoUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-lg bg-primary/10 items-center justify-center shadow-sm`}>
                  <span className="text-2xl font-bold text-primary">{summaryData.ticker.charAt(0)}</span>
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-bold">{summaryData.companyName}</h2>
                <p className="text-sm text-muted-foreground">{summaryData.ticker}</p>
              </div>
            </div>
          )}
          <CardTitle className="text-2xl">Understand Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-12 space-y-12">
          <div>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
              Analyze financial metrics, revenue trends, and operational efficiency to gauge business health.
            </p>
            <FinancialMetricsMatrix metrics={financialMetrics ?? null} />
          </div>

          <div className="pt-8 border-t">
            <FinancialStrengthSection metrics={balanceSheetMetrics ?? null} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const stageInfo = STAGE_INFO[stage as keyof typeof STAGE_INFO];

  if (!stageInfo) {
    return null;
  }

  const getLogoUrlForStage = (homepage: string) => {
    try {
      const url = new URL(homepage);
      return `https://logo.clearbit.com/${url.hostname}`;
    } catch {
      return null;
    }
  };
  const stageLogoUrl = summaryData?.metadata?.homepage ? getLogoUrlForStage(summaryData.metadata.homepage) : null;

  return (
    <Card data-testid={`stage-${stage}-content`}>
      <CardHeader className="text-center pb-8">
        {summaryData && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              {stageLogoUrl ? (
                <img 
                  src={stageLogoUrl}
                  alt={`${summaryData.companyName} logo`}
                  className="w-16 h-16 rounded-lg object-contain bg-white p-2 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${stageLogoUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-lg bg-primary/10 items-center justify-center shadow-sm`}>
                <span className="text-2xl font-bold text-primary">{summaryData.ticker.charAt(0)}</span>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">{summaryData.companyName}</h2>
              <p className="text-sm text-muted-foreground">{summaryData.ticker}</p>
            </div>
          </div>
        )}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">{stageInfo.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center pb-12">
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          {stageInfo.description}
        </p>
        <div className="bg-muted/50 rounded-lg p-8 max-w-lg mx-auto">
          <p className="text-sm font-medium text-foreground mb-2">
            Coming Soon
          </p>
          <p className="text-xs text-muted-foreground">
            We're building this stage to help you make better investment decisions. 
            Check back soon for comprehensive tools and guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}