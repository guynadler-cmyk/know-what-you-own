import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, TrendingUp, Activity, Gauge, Info, Eye } from "lucide-react";
import type { TimingAnalysis, TimingSignalStatus } from "@shared/schema";
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
    case "green":
      return "bg-emerald-500";
    case "yellow":
      return "bg-amber-500";
    case "red":
      return "bg-rose-500";
  }
}

function getStatusBgColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "bg-emerald-50 dark:bg-emerald-950/30";
    case "yellow":
      return "bg-amber-50 dark:bg-amber-950/30";
    case "red":
      return "bg-rose-50 dark:bg-rose-950/30";
  }
}

function getStatusBorderColor(status: TimingSignalStatus): string {
  switch (status) {
    case "green":
      return "border-emerald-200 dark:border-emerald-800";
    case "yellow":
      return "border-amber-200 dark:border-amber-800";
    case "red":
      return "border-rose-200 dark:border-rose-800";
  }
}

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

const GUIDED_QUESTIONS = {
  Trend: "Are structural highs and lows improving, deteriorating, or unresolved?",
  Momentum: "Is short-term pressure forcing change, or being absorbed by the long-term?",
  Stretch: "How far from balance are we — and are we moving toward it or away?"
};

interface SignalCardProps {
  title: string;
  icon: typeof TrendingUp;
  signal: {
    status: TimingSignalStatus;
    label: string;
    interpretation: string;
  };
  deepDive: {
    title: string;
    explanation: string;
  };
  chartComponent: React.ReactNode;
  showOverlayToggle?: boolean;
  showOverlay?: boolean;
  onToggleOverlay?: () => void;
  guidedView?: boolean;
}

function SignalCard({ title, icon: Icon, signal, deepDive, chartComponent, showOverlayToggle, showOverlay, onToggleOverlay, guidedView = true }: SignalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guidedQuestion = GUIDED_QUESTIONS[title as keyof typeof GUIDED_QUESTIONS];

  return (
    <Card 
      className={`${getStatusBgColor(signal.status)} ${getStatusBorderColor(signal.status)} border transition-all duration-200`}
      data-testid={`signal-card-${title.toLowerCase()}`}
    >
      <CardContent className="p-5">
        <div 
          className="transition-all duration-300 ease-out"
          style={{ 
            height: guidedView && guidedQuestion ? 'auto' : '0px',
            opacity: guidedView && guidedQuestion ? 1 : 0,
            visibility: guidedView && guidedQuestion ? 'visible' : 'hidden',
            marginBottom: guidedView && guidedQuestion ? '12px' : '0px'
          }}
          data-testid={`guided-container-${title.toLowerCase()}`}
        >
          <div className="bg-primary/5 dark:bg-primary/10 rounded-lg px-4 py-3 border border-primary/10">
            <p className="text-sm text-foreground/80 italic leading-relaxed" data-testid={`guided-question-${title.toLowerCase()}`}>
              {guidedQuestion}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getStatusBgColor(signal.status)} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(signal.status)}`} />
                <span className="text-sm font-medium text-foreground">{signal.label}</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          {signal.interpretation}
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`expand-${title.toLowerCase()}`}
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

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/40 space-y-4" data-testid={`deep-dive-${title.toLowerCase()}`}>
            <div className={title === "Trend" ? "h-36 w-full" : "h-32 w-full"}>
              {chartComponent}
            </div>
            
            {showOverlayToggle && (
              <div 
                className="flex items-center gap-3 py-2 transition-all duration-300"
                data-testid={`overlay-toggle-${title.toLowerCase()}`}
              >
                <Switch
                  checked={showOverlay}
                  onCheckedChange={onToggleOverlay}
                  className="data-[state=checked]:bg-primary/70"
                  data-testid={`switch-overlay-${title.toLowerCase()}`}
                />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Show supportive conditions</span>
                </div>
              </div>
            )}
            
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
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
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
  const [showMomentumOverlay, setShowMomentumOverlay] = useState(false);
  const [showStretchOverlay, setShowStretchOverlay] = useState(false);
  
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
          <SignalCard
            title="Trend"
            icon={TrendingUp}
            signal={data.trend.signal}
            deepDive={data.trend.deepDive}
            chartComponent={<TrendChart data={data.trend.chartData} status={data.trend.signal.status} timeHorizon="~6 months" />}
            guidedView={guidedView}
          />
          
          <SignalCard
            title="Momentum"
            icon={Activity}
            signal={data.momentum.signal}
            deepDive={data.momentum.deepDive}
            chartComponent={
              <MomentumChart 
                data={data.momentum.chartData} 
                status={data.momentum.signal.status}
                showOverlay={showMomentumOverlay}
              />
            }
            showOverlayToggle={true}
            showOverlay={showMomentumOverlay}
            onToggleOverlay={() => setShowMomentumOverlay(!showMomentumOverlay)}
            guidedView={guidedView}
          />
          
          <SignalCard
            title="Stretch"
            icon={Gauge}
            signal={data.stretch.signal}
            deepDive={data.stretch.deepDive}
            chartComponent={
              <StretchChart 
                data={data.stretch.chartData} 
                status={data.stretch.signal.status}
                showOverlay={showStretchOverlay}
              />
            }
            showOverlayToggle={true}
            showOverlay={showStretchOverlay}
            onToggleOverlay={() => setShowStretchOverlay(!showStretchOverlay)}
            guidedView={guidedView}
          />
        </div>
      </CardContent>
    </Card>
  );
}
