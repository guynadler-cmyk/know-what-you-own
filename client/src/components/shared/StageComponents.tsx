import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, HelpCircle, CheckCircle, AlertTriangle, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type SignalStrength = "sensible" | "caution" | "risky";
export type SignalColor = "green" | "red" | "yellow" | "neutral";

export function getStrengthStyles(strength: SignalStrength) {
  switch (strength) {
    case "sensible":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle,
        border: "border-green-500/20",
        label: "Sensible",
        dot: "bg-green-500",
      };
    case "caution":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
        border: "border-yellow-500/20",
        label: "Caution",
        dot: "bg-yellow-500",
      };
    case "risky":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
        border: "border-red-500/20",
        label: "Risky",
        dot: "bg-red-500",
      };
  }
}

export function getSignalStyles(color: SignalColor) {
  switch (color) {
    case "green":
      return {
        bg: "bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        icon: TrendingUp,
      };
    case "red":
      return {
        bg: "bg-red-500/10",
        text: "text-red-700 dark:text-red-400",
        icon: TrendingDown,
      };
    case "yellow":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: AlertTriangle,
      };
    case "neutral":
      return {
        bg: "bg-neutral-500/10",
        text: "text-neutral-600 dark:text-neutral-400",
        icon: Minus,
      };
  }
}

export interface StageSummaryCardProps {
  id: string;
  title: string;
  label: string;
  strength: SignalStrength;
  isSelected: boolean;
  onClick: () => void;
}

export function StageSummaryCard({ id, title, label, strength, isSelected, onClick }: StageSummaryCardProps) {
  const styles = getStrengthStyles(strength);
  const Icon = styles.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 min-w-[140px] p-4 rounded-xl border text-left transition-all",
        isSelected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border hover-elevate",
        styles.bg
      )}
      data-testid={`stage-summary-card-${id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Icon className={cn("w-4 h-4", styles.text)} />
      </div>
      <div className={cn("text-xs font-semibold", styles.text)}>
        {label}
      </div>
    </button>
  );
}

export interface SignalTagInfo {
  label: string;
  color: SignalColor;
  direction: "up" | "down" | "neutral";
  value?: string;
  tooltip?: string;
}

export function SignalTag({ signal, definitions }: { signal: SignalTagInfo; definitions?: Record<string, string> }) {
  const styles = getSignalStyles(signal.color);
  const Icon = styles.icon;
  
  const tooltipText = signal.tooltip || (definitions && definitions[signal.label]);

  const content = (
    <div 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
        styles.bg,
        styles.text
      )}
      data-testid="signal-tag"
    >
      <Icon className="w-4 h-4" />
      <span className="inline-flex items-center gap-1">
        {signal.label}
        {signal.value && (
          <span className="font-bold ml-1">{signal.value}</span>
        )}
        {tooltipText && <HelpCircle className="w-3 h-3 opacity-60" />}
      </span>
    </div>
  );

  if (tooltipText) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span className="cursor-help">{content}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-sm">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export interface StageDetailPanelProps {
  title: string;
  verdict: string;
  strength: SignalStrength;
  signals: SignalTagInfo[];
  insight: string;
  insightHighlight?: string;
  whyMattersContent?: string;
  quadrantChart: React.ReactNode;
  goDeeper?: React.ReactNode;
  definitions?: Record<string, string>;
}

export function StageDetailPanel({
  title,
  verdict,
  strength,
  signals,
  insight,
  insightHighlight,
  whyMattersContent,
  quadrantChart,
  goDeeper,
  definitions,
}: StageDetailPanelProps) {
  const [showWhyMatters, setShowWhyMatters] = useState(false);
  const [showGoDeeper, setShowGoDeeper] = useState(false);
  const styles = getStrengthStyles(strength);

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-2 gap-0">
        <div className="p-6 lg:p-8 flex items-center justify-center bg-muted/30">
          {quadrantChart}
        </div>
        
        <div className="p-6 lg:p-8 flex flex-col justify-center space-y-5 border-t lg:border-t-0 lg:border-l border-border">
          <div>
            <h3 className="text-2xl font-bold mb-2" data-testid="stage-detail-title">
              {title}
            </h3>
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              styles.bg
            )}>
              <span className={cn("w-2.5 h-2.5 rounded-full", styles.dot)} />
              <span className={cn("text-sm font-semibold", styles.text)} data-testid="stage-detail-verdict">
                {verdict}
              </span>
            </div>
          </div>
          
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {signals.map((signal, idx) => (
                <SignalTag key={idx} signal={signal} definitions={definitions} />
              ))}
            </div>
          )}
          
          <div 
            className="bg-primary/5 rounded-lg p-4 border border-primary/10"
            data-testid="stage-detail-insight"
          >
            <p className="text-foreground leading-relaxed text-base">
              {insightHighlight && insight.includes(insightHighlight) ? (
                <>
                  {insight.split(insightHighlight)[0]}
                  <span className="font-semibold text-primary">
                    {insightHighlight}
                  </span>
                  {insight.split(insightHighlight)[1] || ''}
                </>
              ) : (
                insight
              )}
            </p>
            
            {whyMattersContent && (
              <>
                <button
                  onClick={() => setShowWhyMatters(!showWhyMatters)}
                  className="flex items-center gap-1 text-xs text-muted-foreground mt-3"
                  data-testid="why-matters-toggle"
                >
                  {showWhyMatters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Why this matters
                </button>
                
                {showWhyMatters && (
                  <p className="text-xs text-muted-foreground mt-2 pl-4 border-l-2 border-border/40 leading-relaxed animate-in fade-in-50">
                    {whyMattersContent}
                  </p>
                )}
              </>
            )}
          </div>
          
          {goDeeper && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground"
              onClick={() => setShowGoDeeper(!showGoDeeper)}
              data-testid="go-deeper-toggle"
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
          )}
        </div>
      </div>
      
      {goDeeper && showGoDeeper && (
        <div className="border-t border-border p-6 space-y-4 animate-in fade-in-50" data-testid="go-deeper-content">
          {goDeeper}
        </div>
      )}
    </Card>
  );
}

export interface StageScoreSummaryProps {
  title: string;
  icon: React.ReactNode;
  scoreText: string;
  bars: SignalStrength[];
  tiles: Array<{
    id: string;
    title: string;
    label: string;
    strength: SignalStrength;
  }>;
}

export function StageScoreSummary({ title, icon, scoreText, bars, tiles }: StageScoreSummaryProps) {
  return (
    <div className="space-y-4" data-testid="stage-score-summary">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold text-foreground">
          {title}: {scoreText}
        </span>
      </div>
      
      <div className="flex gap-1">
        {bars.map((strength, i) => {
          const styles = getStrengthStyles(strength);
          return (
            <div 
              key={i}
              className={cn(
                "flex-1 h-2 rounded-full transition-all",
                strength === "sensible" && "bg-green-500",
                strength === "caution" && "bg-yellow-500",
                strength === "risky" && "bg-neutral-300 dark:bg-neutral-600"
              )}
            />
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => {
          const styles = getStrengthStyles(tile.strength);
          const Icon = styles.icon;
          
          return (
            <div 
              key={tile.id}
              className={cn("p-4 rounded-xl", styles.bg)}
              data-testid={`score-tile-${tile.id}`}
            >
              <div className="text-sm font-medium text-foreground mb-1">{tile.title}</div>
              <div className={cn("text-xs font-semibold flex items-center gap-1", styles.text)}>
                <Icon className="w-3 h-3" />
                {tile.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
