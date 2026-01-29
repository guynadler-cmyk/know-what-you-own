import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Activity, Info, Eye, AlertOctagon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimingAnalysis, TimingSignalStatus } from "@shared/schema";
import { TimingQuadrantChart, type TimingQuadrantConfig } from "./timing/TimingQuadrantChart";
import { TrendChart } from "./timing/TrendChart";
import { MomentumChart } from "./timing/MomentumChart";
import { StretchChart } from "./timing/StretchChart";
import { 
  StageSummaryCard, 
  StageDetailPanel, 
  StageScoreSummary,
  type SignalStrength,
  type SignalTagInfo,
  type SignalColor,
} from "./shared/StageComponents";

interface TimingStageProps {
  ticker?: string;
  companyName?: string;
  logoUrl?: string;
}

type TimingMetricType = "trend" | "momentum" | "stretch";

function statusToStrength(status: TimingSignalStatus): SignalStrength {
  switch (status) {
    case "green": return "sensible";
    case "yellow": return "caution";
    case "red": return "risky";
  }
}

function statusToColor(status: TimingSignalStatus): SignalColor {
  switch (status) {
    case "green": return "green";
    case "yellow": return "yellow";
    case "red": return "red";
  }
}

const QUADRANT_CONFIGS: Record<string, Omit<TimingQuadrantConfig, 'position' | 'guidedView'>> = {
  trend: {
    id: "trend",
    xLabel: "Highs Progression",
    yLabel: "Lows Progression",
    zones: {
      topRight: { 
        label: "Strengthening", 
        color: "green",
        tooltip: "Both highs and lows are improving — structure is supportive."
      },
      topLeft: { 
        label: "Stabilizing", 
        color: "blue",
        tooltip: "Higher lows forming, but highs not yet improving — early signs of support."
      },
      bottomRight: { 
        label: "Breakout Attempt", 
        color: "yellow",
        tooltip: "Higher highs appearing, but lows still weak — momentum without foundation."
      },
      bottomLeft: { 
        label: "Weakening", 
        color: "red",
        tooltip: "Both highs and lows are declining — structure is under pressure."
      },
    },
  },
  momentum: {
    id: "momentum",
    xLabel: "Short-term Pressure",
    yLabel: "Long-term Baseline",
    zones: {
      topRight: { 
        label: "Aligned", 
        color: "green",
        tooltip: "Short and long-term moving in the same direction — momentum is supportive."
      },
      topLeft: { 
        label: "Pullback", 
        color: "blue",
        tooltip: "Short-term pressure against a strong baseline — often absorbed."
      },
      bottomRight: { 
        label: "Early Recovery", 
        color: "yellow",
        tooltip: "Short-term improving while long-term still weak — early but unconfirmed."
      },
      bottomLeft: { 
        label: "Pressure Building", 
        color: "red",
        tooltip: "Both time frames moving lower — pressure is intensifying."
      },
    },
  },
  stretch: {
    id: "stretch",
    xLabel: "Distance from Balance",
    yLabel: "Direction",
    zones: {
      topLeft: { 
        label: "Calm", 
        color: "green",
        tooltip: "Near equilibrium and stable — balanced conditions."
      },
      topRight: { 
        label: "Tension Easing", 
        color: "blue",
        tooltip: "Extended but returning toward balance — stretch is cooling."
      },
      bottomLeft: { 
        label: "Drifting", 
        color: "neutral",
        tooltip: "Near balance but moving away — low conviction drift."
      },
      bottomRight: { 
        label: "Tension Rising", 
        color: "red",
        tooltip: "Extended and moving further — stretch is building."
      },
    },
  },
};

const METRIC_TITLES: Record<TimingMetricType, string> = {
  trend: "Trend",
  momentum: "Momentum",
  stretch: "Stretch"
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
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 flex-1 min-w-[140px] rounded-xl" />
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

interface TimingDetailContentProps {
  type: TimingMetricType;
  signal: TimingAnalysis["trend"]["signal"];
  deepDive: { title: string; explanation: string };
  chartData: TimingAnalysis["trend"]["chartData"] | TimingAnalysis["momentum"]["chartData"] | TimingAnalysis["stretch"]["chartData"];
  guidedView: boolean;
}

function TimingDetailContent({ type, signal, deepDive, chartData, guidedView }: TimingDetailContentProps) {
  const config = QUADRANT_CONFIGS[type];
  const position = signal.position || { x: 50, y: 50 };
  
  const apiSignals = signal.signals || [];
  const mappedSignals: SignalTagInfo[] = apiSignals.map(s => {
    const isPositive = s.value.toLowerCase().includes("improving") || s.value.toLowerCase().includes("returning") || s.value.toLowerCase().includes("low");
    const isNegative = s.value.toLowerCase().includes("weakening") || s.value.toLowerCase().includes("away") || s.value.toLowerCase().includes("high");
    
    return {
      label: s.label,
      color: isPositive ? "green" : isNegative ? "red" : "yellow" as SignalColor,
      direction: isPositive ? "up" : isNegative ? "down" : "neutral" as "up" | "down" | "neutral",
      value: s.value,
    };
  });

  const quadrantChart = (
    <TimingQuadrantChart 
      config={{
        ...config,
        position,
        guidedView
      }} 
    />
  );

  const goDeeper = (
    <>
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
    </>
  );

  return (
    <StageDetailPanel
      title={METRIC_TITLES[type]}
      verdict={signal.label}
      strength={statusToStrength(signal.status)}
      signals={mappedSignals}
      insight={signal.interpretation}
      whyMattersContent={deepDive.explanation}
      quadrantChart={quadrantChart}
      goDeeper={goDeeper}
    />
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

  const metrics: { id: TimingMetricType; signal: TimingAnalysis["trend"]["signal"] }[] = [
    { id: "trend", signal: data.trend.signal },
    { id: "momentum", signal: data.momentum.signal },
    { id: "stretch", signal: data.stretch.signal },
  ];

  const selectedSignal = data[selectedMetric].signal;
  const selectedDeepDive = data[selectedMetric].deepDive;
  const selectedChartData = data[selectedMetric].chartData;

  const supportiveCount = metrics.filter(m => m.signal.status === "green").length;
  const getScoreLabel = () => {
    if (supportiveCount === 3) return "supportive";
    if (supportiveCount >= 2) return "mostly supportive";
    if (supportiveCount === 1) return "mixed";
    return "challenging";
  };

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
          <div className="flex flex-wrap gap-3" data-testid="timing-summary-card-row">
            {metrics.map(({ id, signal }) => (
              <StageSummaryCard
                key={id}
                id={id}
                title={METRIC_TITLES[id]}
                label={signal.label}
                strength={statusToStrength(signal.status)}
                isSelected={selectedMetric === id}
                onClick={() => setSelectedMetric(id)}
              />
            ))}
          </div>
          
          <TimingDetailContent
            key={selectedMetric}
            type={selectedMetric}
            signal={selectedSignal}
            deepDive={selectedDeepDive}
            chartData={selectedChartData}
            guidedView={guidedView}
          />
          
          <StageScoreSummary
            title="Timing Score"
            icon={<Activity className="w-5 h-5 text-primary" />}
            scoreText={`${supportiveCount} of ${metrics.length} signals ${getScoreLabel()}`}
            bars={metrics.map(m => statusToStrength(m.signal.status))}
            tiles={metrics.map(({ id, signal }) => ({
              id,
              title: METRIC_TITLES[id],
              label: signal.label,
              strength: statusToStrength(signal.status),
            }))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
