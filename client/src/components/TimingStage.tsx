import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, TrendingUp, Activity, Gauge, Info, Eye, HelpCircle } from "lucide-react";
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

function getStatusColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green": return "bg-emerald-500";
    case "yellow": return "bg-amber-500";
    case "red": return "bg-rose-500";
  }
}

function getStatusBgColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green": return "bg-green-500/10";
    case "yellow": return "bg-yellow-500/10";
    case "red": return "bg-red-500/10";
  }
}

function getStatusBorderColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green": return "border-green-500/20";
    case "yellow": return "border-yellow-500/20";
    case "red": return "border-red-500/20";
  }
}

function getStatusTextColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green": return "text-green-700 dark:text-green-400";
    case "yellow": return "text-yellow-700 dark:text-yellow-400";
    case "red": return "text-red-700 dark:text-red-400";
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

const HOW_TO_READ: Record<string, string[]> = {
  trend: [
    "X-axis shows whether recent price highs are improving (right) or weakening (left).",
    "Y-axis shows whether recent price lows are improving (top) or weakening (bottom).",
    "The dot shows the current structural state of the stock."
  ],
  momentum: [
    "X-axis shows short-term pressure direction: right means upward, left means downward.",
    "Y-axis shows long-term baseline direction: top means strengthening, bottom means weakening.",
    "When short and long-term align (top-right), momentum is most supportive."
  ],
  stretch: [
    "X-axis shows how far price is from its typical equilibrium: left is near balance, right is stretched.",
    "Y-axis shows direction: top means returning toward balance, bottom means moving away.",
    "Calm conditions (top-left) suggest stability; rising tension (bottom-right) suggests caution."
  ],
};

function AlignmentIndicator({ score }: { score: number }) {
  const normalizedPosition = ((score + 1) / 2) * 100;
  
  return (
    <div className="mt-6" data-testid="alignment-indicator">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Weak</span>
        <span>Strong</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden">
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(to right, #f43f5e 0%, #f59e0b 35%, #f59e0b 50%, #10b981 75%, #10b981 100%)'
          }}
        />
        <div 
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
          }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-neutral-800 dark:border-white shadow-lg transition-all duration-500 flex items-center justify-center"
          style={{ left: `calc(${Math.max(5, Math.min(95, normalizedPosition))}% - 10px)` }}
          data-testid="alignment-marker"
        >
          <div className="w-2 h-2 rounded-full bg-neutral-800 dark:bg-white" />
        </div>
      </div>
      <div className="flex justify-center mt-3">
        <span className="text-xs text-muted-foreground/70 italic">
          Higher alignment means conditions are more supportive
        </span>
      </div>
    </div>
  );
}

function VerdictBanner({ verdict }: { verdict: TimingAnalysis["verdict"] }) {
  return (
    <div 
      className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl p-6 mb-8 border border-border/40"
      data-testid="timing-verdict-banner"
    >
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold text-foreground" data-testid="verdict-message">
          {verdict.message}
        </h2>
        <p className="text-muted-foreground text-sm">
          {verdict.subtitle}
        </p>
        <AlignmentIndicator score={verdict.alignmentScore} />
      </div>
    </div>
  );
}

interface SignalPillProps {
  label: string;
  value: string;
}

function SignalPill({ label, value }: SignalPillProps) {
  const isPositive = value.toLowerCase().includes("improving") || value.toLowerCase().includes("returning") || value.toLowerCase().includes("low");
  const isNegative = value.toLowerCase().includes("weakening") || value.toLowerCase().includes("away") || value.toLowerCase().includes("high");
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium",
        isPositive && "bg-green-500/10 text-green-700 dark:text-green-400",
        isNegative && "bg-red-500/10 text-red-700 dark:text-red-400",
        !isPositive && !isNegative && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      )}
      data-testid="signal-pill"
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

interface TimingCardProps {
  type: "trend" | "momentum" | "stretch";
  icon: typeof TrendingUp;
  signal: TimingAnalysis["trend"]["signal"];
  deepDive: { title: string; explanation: string };
  chartData: TimingAnalysis["trend"]["chartData"] | TimingAnalysis["momentum"]["chartData"] | TimingAnalysis["stretch"]["chartData"];
  guidedView: boolean;
}

function TimingCard({ type, icon: Icon, signal, deepDive, chartData, guidedView }: TimingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = QUADRANT_CONFIGS[type];
  const howToRead = HOW_TO_READ[type];
  
  const position = signal.position || { x: 50, y: 50 };
  const signals = signal.signals || [];
  
  const titleMap = {
    trend: "Structure Quality",
    momentum: "Pressure Balance", 
    stretch: "Distance from Balance"
  };

  return (
    <Card 
      className={cn(
        "border transition-all duration-200",
        getStatusBgColor(signal.status),
        getStatusBorderColor(signal.status)
      )}
      data-testid={`timing-card-${type}`}
    >
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", getStatusBgColor(signal.status))}>
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground capitalize">{type}</h3>
                    <span className="text-xs text-muted-foreground">({titleMap[type]})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(signal.status))} />
                    <span className={cn("text-sm font-semibold", getStatusTextColor(signal.status))}>
                      {signal.label}
                    </span>
                  </div>
                </div>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`help-${type}`}>
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <p className="text-xs font-medium mb-2">How to read this:</p>
                  <ul className="text-xs space-y-1 list-disc pl-3">
                    {howToRead.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {signals.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {signals.map((s, i) => (
                  <SignalPill key={i} label={s.label} value={s.value} />
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {signal.interpretation}
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`expand-${type}`}
            >
              {isExpanded ? (
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
          
          <div className="flex-shrink-0 flex justify-center">
            <TimingQuadrantChart 
              config={{
                ...config,
                position,
                guidedView
              }} 
            />
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-border/40 space-y-4" data-testid={`deep-dive-${type}`}>
            <div className="h-32 w-full">
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
            
            <div>
              <h4 className="font-medium text-foreground mb-2">{deepDive.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {deepDive.explanation}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <CardContent className="pb-12">
        <Skeleton className="h-32 w-full mb-8 rounded-xl" />
        <div className="grid gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card data-testid="timing-error">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Unable to analyze conditions</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export function TimingStage({ ticker, companyName, logoUrl }: TimingStageProps) {
  const [guidedView, setGuidedView] = useState(true);
  
  const { data, isLoading, error } = useQuery<TimingAnalysis>({
    queryKey: [`/api/timing/${ticker}`],
    enabled: !!ticker,
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
    return <ErrorState message={(error as Error)?.message || "Could not load timing data."} />;
  }

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
        
        <VerdictBanner verdict={data.verdict} />

        <div className="grid gap-4">
          <TimingCard
            type="trend"
            icon={TrendingUp}
            signal={data.trend.signal}
            deepDive={data.trend.deepDive}
            chartData={data.trend.chartData}
            guidedView={guidedView}
          />
          
          <TimingCard
            type="momentum"
            icon={Activity}
            signal={data.momentum.signal}
            deepDive={data.momentum.deepDive}
            chartData={data.momentum.chartData}
            guidedView={guidedView}
          />
          
          <TimingCard
            type="stretch"
            icon={Gauge}
            signal={data.stretch.signal}
            deepDive={data.stretch.deepDive}
            chartData={data.stretch.chartData}
            guidedView={guidedView}
          />
        </div>
      </CardContent>
    </Card>
  );
}
