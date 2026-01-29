import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Activity, Info, Eye, 
  AlertOctagon, RefreshCw, Compass, CheckCircle, AlertTriangle, XCircle, HelpCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimingAnalysis, TimingSignalStatus } from "@shared/schema";
import { TimingQuadrantChart, type TimingQuadrantConfig } from "./timing/TimingQuadrantChart";
import { TrendChart } from "./timing/TrendChart";
import { MomentumChart } from "./timing/MomentumChart";
import { StretchChart } from "./timing/StretchChart";

interface TimingStageProps {
  ticker?: string;
  companyName?: string;
  logoUrl?: string;
}

type TimingMetricType = "trend" | "momentum" | "stretch";
type TimingStrength = "strong" | "mixed" | "weak";

function statusToStrength(status: TimingSignalStatus): TimingStrength {
  switch (status) {
    case "green": return "strong";
    case "yellow": return "mixed";
    case "red": return "weak";
  }
}

function getStrengthStyles(strength: TimingStrength) {
  switch (strength) {
    case "strong":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle,
        border: "border-green-500/20",
        dot: "bg-green-500",
      };
    case "mixed":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
        border: "border-yellow-500/20",
        dot: "bg-yellow-500",
      };
    case "weak":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
        border: "border-red-500/20",
        dot: "bg-red-500",
      };
  }
}

const QUADRANT_CONFIGS: Record<string, Omit<TimingQuadrantConfig, 'position' | 'guidedView'>> = {
  trend: {
    id: "trend",
    xLabel: "Highs Progression",
    yLabel: "Lows Progression",
    zones: {
      topRight: { label: "Strengthening", color: "green", tooltip: "Both highs and lows are improving — structure is supportive." },
      topLeft: { label: "Stabilizing", color: "blue", tooltip: "Higher lows forming, but highs not yet improving — early signs of support." },
      bottomRight: { label: "Breakout Attempt", color: "yellow", tooltip: "Higher highs appearing, but lows still weak — momentum without foundation." },
      bottomLeft: { label: "Weakening", color: "red", tooltip: "Both highs and lows are declining — structure is under pressure." },
    },
  },
  momentum: {
    id: "momentum",
    xLabel: "Short-term Pressure",
    yLabel: "Long-term Baseline",
    zones: {
      topRight: { label: "Aligned", color: "green", tooltip: "Short and long-term moving in the same direction — momentum is supportive." },
      topLeft: { label: "Pullback", color: "blue", tooltip: "Short-term pressure against a strong baseline — often absorbed." },
      bottomRight: { label: "Early Recovery", color: "yellow", tooltip: "Short-term improving while long-term still weak — early but unconfirmed." },
      bottomLeft: { label: "Pressure Building", color: "red", tooltip: "Both time frames moving lower — pressure is intensifying." },
    },
  },
  stretch: {
    id: "stretch",
    xLabel: "Distance from Balance",
    yLabel: "Direction",
    zones: {
      topLeft: { label: "Calm", color: "green", tooltip: "Near equilibrium and stable — balanced conditions." },
      topRight: { label: "Tension Easing", color: "blue", tooltip: "Extended but returning toward balance — stretch is cooling." },
      bottomLeft: { label: "Drifting", color: "neutral", tooltip: "Near balance but moving away — low conviction drift." },
      bottomRight: { label: "Tension Rising", color: "red", tooltip: "Extended and moving further — stretch is building." },
    },
  },
};

const METRIC_TITLES: Record<TimingMetricType, string> = {
  trend: "Trend",
  momentum: "Momentum",
  stretch: "Stretch"
};

const METRIC_SIGNALS: Record<TimingMetricType, [string, string]> = {
  trend: ["Recent highs", "Recent lows"],
  momentum: ["Short-term", "Long-term"],
  stretch: ["Distance", "Direction"],
};

function TimingIntroBlock() {
  return (
    <div 
      className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-5 mb-8 border border-border/40"
      data-testid="timing-intro-block"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-foreground leading-relaxed">
            Before deciding how to invest, let's check if conditions are aligned.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This isn't about predicting the future — it's about understanding whether current market conditions suggest patience or action.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <Card data-testid="timing-loading">
      <CardHeader className="text-center pb-6">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </CardHeader>
      <CardContent className="pb-12 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function ErrorState({ message, onRetry, isRetrying }: { message: string; onRetry?: () => void; isRetrying?: boolean }) {
  const isRateLimitError = message?.toLowerCase().includes('rate limit');
  
  return (
    <Card className="p-8" data-testid="timing-error">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <AlertOctagon className="w-12 h-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {isRateLimitError ? 'Temporarily Unavailable' : 'Unable to Load Timing Data'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mb-4">
            {isRateLimitError 
              ? 'The market data service is busy. Wait a moment and try again.'
              : message || 'We couldn\'t retrieve the timing metrics for this company.'}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isRetrying}
              data-testid="button-retry-timing"
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface SummaryCardRowProps {
  selectedId: TimingMetricType;
  onSelect: (id: TimingMetricType) => void;
  metrics: Array<{ id: TimingMetricType; signal: TimingAnalysis["trend"]["signal"] }>;
}

function SummaryCardRow({ selectedId, onSelect, metrics }: SummaryCardRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3" data-testid="timing-summary-card-row">
      {metrics.map(({ id, signal }) => {
        const isSelected = selectedId === id;
        const strength = statusToStrength(signal.status);
        const styles = getStrengthStyles(strength);
        const signals = METRIC_SIGNALS[id];
        const apiSignals = signal.signals || [];
        
        const signalDirections = apiSignals.map(s => {
          const val = s.value.toLowerCase();
          return val.includes("improving") || val.includes("returning") || val.includes("low") || val.includes("calm");
        });
        
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "text-left p-4 rounded-xl border-2 transition-all duration-200",
              "bg-card hover-elevate active-elevate-2",
              isSelected 
                ? "border-primary shadow-lg ring-1 ring-primary/20" 
                : "border-border/40 hover:border-border"
            )}
            data-testid={`timing-card-${id}`}
          >
            <h3 className="font-semibold text-sm mb-1">
              {METRIC_TITLES[id]}
            </h3>
            <p className={cn(
              "text-xs font-medium mb-2",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}>
              {signal.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {signals.map((signalLabel, idx) => {
                const isPositive = signalDirections[idx] ?? (signal.status === "green");
                return (
                  <span 
                    key={idx} 
                    className={cn(
                      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                      isPositive 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {signalLabel}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface TimingInsightTagProps {
  signal: TimingAnalysis["trend"]["signal"];
  deepDive: { title: string; explanation: string };
}

function TimingInsightTag({ signal, deepDive }: TimingInsightTagProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const strength = statusToStrength(signal.status);
  const styles = getStrengthStyles(strength);
  
  const tier1 = signal.interpretation;
  const tier2 = deepDive.explanation;
  const showExpandSection = tier2 && tier2 !== tier1;

  return (
    <div 
      className={cn(
        "rounded-lg p-4 border",
        styles.bg,
        styles.border
      )}
      data-testid="timing-insight-tag"
    >
      <div className="flex items-start gap-3">
        <Compass className={cn("w-5 h-5 mt-0.5 shrink-0", styles.text)} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
            <span className={cn("font-semibold text-sm", styles.text)} data-testid="timing-insight-label">
              {signal.label}
            </span>
          </div>
          <p className="text-sm text-foreground leading-snug" data-testid="timing-insight-summary">
            {tier1}
          </p>
          
          {showExpandSection && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover-elevate px-2 py-1 -ml-2 rounded-md transition-colors"
                data-testid="button-expand-timing-details"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Why this matters</span>
                  </>
                )}
              </button>
              
              {isExpanded && (
                <div 
                  className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-current/10"
                  data-testid="timing-insight-details"
                >
                  {tier2}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface SignalTagProps {
  label: string;
  value: string;
}

function SignalTag({ label, value }: SignalTagProps) {
  const isPositive = value.toLowerCase().includes("improving") || 
                     value.toLowerCase().includes("returning") || 
                     value.toLowerCase().includes("low") ||
                     value.toLowerCase().includes("calm");
  const isNegative = value.toLowerCase().includes("weakening") || 
                     value.toLowerCase().includes("away") || 
                     value.toLowerCase().includes("high") ||
                     value.toLowerCase().includes("rising");
  
  const color = isPositive ? "green" : isNegative ? "red" : "yellow";
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : AlertTriangle;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-help",
            color === "green" && "bg-green-500/10 text-green-700 dark:text-green-400",
            color === "red" && "bg-red-500/10 text-red-700 dark:text-red-400",
            color === "yellow" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          )}
          data-testid="timing-signal-tag"
        >
          <Icon className="w-4 h-4" />
          <span className="inline-flex items-center gap-1">
            {label}
            <span className="font-bold ml-1">{value}</span>
            <HelpCircle className="w-3 h-3 opacity-60" />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        {label}: {value}
      </TooltipContent>
    </Tooltip>
  );
}

interface TimingDetailPanelProps {
  type: TimingMetricType;
  signal: TimingAnalysis["trend"]["signal"];
  deepDive: { title: string; explanation: string };
  chartData: TimingAnalysis["trend"]["chartData"] | TimingAnalysis["momentum"]["chartData"] | TimingAnalysis["stretch"]["chartData"];
  guidedView: boolean;
}

function TimingDetailPanel({ type, signal, deepDive, chartData, guidedView }: TimingDetailPanelProps) {
  const [showGoDeeper, setShowGoDeeper] = useState(false);
  const config = QUADRANT_CONFIGS[type];
  const position = signal.position || { x: 50, y: 50 };
  const apiSignals = signal.signals || [];

  return (
    <Card className="overflow-hidden" data-testid={`timing-detail-panel-${type}`}>
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="p-6 lg:p-8 flex items-center justify-center bg-muted/30">
          <TimingQuadrantChart 
            config={{
              ...config,
              position,
              guidedView
            }} 
          />
        </div>
        
        <div className="p-6 lg:p-8 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border">
          <div>
            <h3 className="text-2xl font-bold mb-2" data-testid="timing-detail-title">
              {METRIC_TITLES[type]}
            </h3>
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              getStrengthStyles(statusToStrength(signal.status)).bg
            )}>
              <span className={cn("w-2.5 h-2.5 rounded-full", getStrengthStyles(statusToStrength(signal.status)).dot)} />
              <span className={cn("text-sm font-semibold", getStrengthStyles(statusToStrength(signal.status)).text)} data-testid="timing-detail-verdict">
                {signal.label}
              </span>
            </div>
          </div>
          
          {apiSignals.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {apiSignals.map((s, idx) => (
                <SignalTag key={idx} label={s.label} value={s.value} />
              ))}
            </div>
          )}
          
          <TimingInsightTag signal={signal} deepDive={deepDive} />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-muted-foreground"
            onClick={() => setShowGoDeeper(!showGoDeeper)}
            data-testid={`expand-${type}`}
          >
            {showGoDeeper ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Less detail
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Go deeper
              </>
            )}
          </Button>
        </div>
      </div>
      
      {showGoDeeper && (
        <div className="border-t border-border p-6 space-y-4 animate-in fade-in-50" data-testid={`deep-dive-${type}`}>
          <div className="h-40 w-full bg-muted/30 rounded-lg p-4">
            {type === "trend" && (
              <TrendChart data={chartData as TimingAnalysis["trend"]["chartData"]} status={signal.status} timeHorizon="~6 months" />
            )}
            {type === "momentum" && (
              <MomentumChart data={chartData as TimingAnalysis["momentum"]["chartData"]} status={signal.status} showOverlay={false} />
            )}
            {type === "stretch" && (
              <StretchChart data={chartData as TimingAnalysis["stretch"]["chartData"]} status={signal.status} showOverlay={false} />
            )}
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">{deepDive.title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {deepDive.explanation}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

function ProgressBar({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex gap-1.5 w-full max-w-xs">
      {Array.from({ length: total }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "h-2 flex-1 rounded-full transition-colors",
            idx < count
              ? "bg-green-500"
              : "bg-neutral-200 dark:bg-neutral-700"
          )}
          data-testid={`timing-progress-segment-${idx}`}
        />
      ))}
    </div>
  );
}

interface SignalCardProps {
  id: string;
  title: string;
  verdict: string;
  strength: TimingStrength;
}

function SignalCard({ id, title, verdict, strength }: SignalCardProps) {
  const styles = getStrengthStyles(strength);
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        styles.bg,
        styles.border
      )}
      data-testid={`timing-signal-card-${id}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className={cn("flex items-center gap-2", styles.text)}>
          <Icon className="w-4 h-4" />
          <span className="text-sm font-semibold">{verdict}</span>
        </div>
      </div>
    </div>
  );
}

function getVerdict(strongCount: number, total: number) {
  if (strongCount === total) {
    return {
      summary: "Timing conditions are aligned. Market structure looks supportive for patient investors.",
      tone: "positive" as const,
    };
  } else if (strongCount >= total / 2) {
    return {
      summary: "Mixed timing signals. Some conditions are supportive, others suggest caution.",
      tone: "mixed" as const,
    };
  } else {
    return {
      summary: "Timing conditions are challenging. Unless you have strong conviction, patience may be warranted.",
      tone: "negative" as const,
    };
  }
}

interface TimingScorecardProps {
  metrics: Array<{ id: TimingMetricType; signal: TimingAnalysis["trend"]["signal"] }>;
}

function TimingScorecard({ metrics }: TimingScorecardProps) {
  const strongCount = metrics.filter(m => m.signal.status === "green").length;
  const total = metrics.length;
  const verdict = getVerdict(strongCount, total);

  return (
    <div className="mt-10 space-y-6" data-testid="timing-scorecard">
      <Card className="bg-neutral-50 dark:bg-neutral-900/50 border-border/60">
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg" data-testid="timing-score-title">
                  Timing Score: {strongCount} out of {total} signals supportive
                </h3>
              </div>
            </div>
            <ProgressBar count={strongCount} total={total} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.map(({ id, signal }) => (
              <SignalCard
                key={id}
                id={id}
                title={METRIC_TITLES[id]}
                verdict={signal.label}
                strength={statusToStrength(signal.status)}
              />
            ))}
          </div>

          <div
            className={cn(
              "p-5 rounded-xl",
              verdict.tone === "positive" && "bg-green-500/5 border border-green-500/20",
              verdict.tone === "mixed" && "bg-yellow-500/5 border border-yellow-500/20",
              verdict.tone === "negative" && "bg-red-500/5 border border-red-500/20"
            )}
            data-testid="timing-verdict-block"
          >
            <p className="text-foreground leading-relaxed font-medium">
              {verdict.summary}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TimingStage({ ticker, companyName, logoUrl }: TimingStageProps) {
  const [guidedView, setGuidedView] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<TimingMetricType>("trend");
  
  const { data, isLoading, error, refetch, isFetching } = useQuery<TimingAnalysis>({
    queryKey: [`/api/timing/${ticker}`],
    enabled: !!ticker,
    retry: false,
  });

  if (!ticker) {
    return (
      <Card data-testid="timing-no-ticker">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Select a company to view timing analysis.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return (
      <ErrorState 
        message={(error as Error)?.message || "Could not load timing data."} 
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const metrics: Array<{ id: TimingMetricType; signal: TimingAnalysis["trend"]["signal"] }> = [
    { id: "trend", signal: data.trend.signal },
    { id: "momentum", signal: data.momentum.signal },
    { id: "stretch", signal: data.stretch.signal },
  ];

  const selectedSignal = data[selectedMetric].signal;
  const selectedDeepDive = data[selectedMetric].deepDive;
  const selectedChartData = data[selectedMetric].chartData;

  return (
    <Card data-testid="timing-stage-content">
      <CardHeader className="text-center pb-6">
        {(companyName || logoUrl) && (
          <div className="flex items-center justify-center gap-4 mb-6">
            {logoUrl && (
              <div className="relative">
                <img 
                  src={logoUrl}
                  alt={`${companyName || ticker} logo`}
                  className="w-16 h-16 rounded-lg object-contain bg-white p-2 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="hidden w-16 h-16 rounded-lg bg-primary/10 items-center justify-center shadow-sm">
                  <span className="text-2xl font-bold text-primary">{ticker?.charAt(0)}</span>
                </div>
              </div>
            )}
            {!logoUrl && (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                <span className="text-2xl font-bold text-primary">{ticker?.charAt(0)}</span>
              </div>
            )}
            <div className="text-left">
              <h2 className="text-2xl font-bold">{companyName || data.companyName}</h2>
              <p className="text-sm text-muted-foreground">{ticker}</p>
            </div>
          </div>
        )}
        <CardTitle className="text-2xl">Assess Timing Conditions</CardTitle>
      </CardHeader>
      <CardContent className="pb-12">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Guided view</span>
          </div>
          <Switch
            checked={guidedView}
            onCheckedChange={setGuidedView}
            className="data-[state=checked]:bg-primary"
            data-testid="switch-guided-view"
          />
        </div>

        <TimingIntroBlock />

        <div className="space-y-6">
          <SummaryCardRow 
            selectedId={selectedMetric}
            onSelect={setSelectedMetric}
            metrics={metrics}
          />
          
          <TimingDetailPanel
            key={selectedMetric}
            type={selectedMetric}
            signal={selectedSignal}
            deepDive={selectedDeepDive}
            chartData={selectedChartData}
            guidedView={guidedView}
          />
        </div>
        
        <TimingScorecard metrics={metrics} />
      </CardContent>
    </Card>
  );
}
