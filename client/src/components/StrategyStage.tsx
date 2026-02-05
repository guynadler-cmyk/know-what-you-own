import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Save, Mail, AlertCircle, 
  Loader2, ChevronDown, BarChart3, DollarSign, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface StrategyStageProps {
  ticker?: string;
  companyName?: string;
  logoUrl?: string;
  fundamentalsScore?: string;
  valuationLabel?: string;
  timingVerdict?: string;
}

interface TrancheData {
  index: number;
  amount: number;
  trigger: string;
}

interface StrategyPlan {
  ticker: string;
  convictionValue: number;
  convictionLabel: string;
  trancheCount: number;
  totalAmount: number;
  tranches: TrancheData[];
  imWrongIf: string;
  snapshot: {
    fundamentals: string;
    valuation: string;
    timing: string;
  };
  createdAt: string;
}

const TRIGGER_OPTIONS = [
  { value: "now", label: "Now / soon" },
  { value: "earnings", label: "After next earnings" },
  { value: "30days", label: "In 30 days" },
  { value: "recheck", label: "After I re-check fundamentals" },
  { value: "manual", label: "Manual / I'll decide" },
];

function getConvictionLabel(value: number): string {
  if (value <= 33) return "Exploring";
  if (value <= 66) return "Interested";
  return "High conviction";
}

function getTrancheCount(value: number): number {
  if (value <= 33) return 5;
  if (value <= 66) return 3;
  return 2;
}

function buildTranches(total: number, count: number): TrancheData[] {
  const baseAmount = Math.floor(total / count);
  const remainder = total - (baseAmount * count);
  
  return Array.from({ length: count }, (_, i) => ({
    index: i + 1,
    amount: i === 0 ? baseAmount + remainder : baseAmount,
    trigger: i === 0 ? "now" : "recheck",
  }));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

type TakeawayTone = "positive" | "mixed" | "negative";

interface TakeawayData {
  title: string;
  score: string;
  summary: string;
  tone: TakeawayTone;
  icon: typeof BarChart3;
}

function getPerformanceTakeaway(strongCount: number): TakeawayData {
  const tone: TakeawayTone = strongCount === 4 ? "positive" : strongCount >= 2 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "Financially strong. Likely a solid foundation for a long-term investment.",
    mixed: "Mixed signals. Worth considering with caution or deeper conviction.",
    negative: "Financial picture is weak. Unless you have strong conviction, this may not be the right fit.",
  };
  return {
    title: "Performance",
    score: `${strongCount}/4 strong`,
    summary: summaries[tone],
    tone,
    icon: BarChart3,
  };
}

function getValuationTakeaway(sensibleCount: number): TakeawayData {
  const tone: TakeawayTone = sensibleCount === 4 ? "positive" : sensibleCount >= 2 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "All valuation signals look sensible. You're not obviously overpaying.",
    mixed: "Mixed signals. The valuation looks reasonable in some areas, but a few signals are worth a closer look.",
    negative: "Multiple valuation signals suggest caution. Consider waiting for a better entry point.",
  };
  return {
    title: "Valuation",
    score: `${sensibleCount}/4 sensible`,
    summary: summaries[tone],
    tone,
    icon: DollarSign,
  };
}

function getTimingTakeaway(supportiveCount: number, total: number): TakeawayData {
  const ratio = total > 0 ? supportiveCount / total : 0;
  const tone: TakeawayTone = ratio >= 0.8 ? "positive" : ratio >= 0.4 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "Timing conditions are aligned. Market structure looks supportive for patient investors.",
    mixed: "Mixed timing signals. Some conditions are supportive, others suggest caution.",
    negative: "Timing conditions are challenging. Unless you have strong conviction, patience may be warranted.",
  };
  return {
    title: "Timing",
    score: `${supportiveCount}/${total} supportive`,
    summary: summaries[tone],
    tone,
    icon: Activity,
  };
}

function TakeawayBlock({ takeaway }: { takeaway: TakeawayData }) {
  const Icon = takeaway.icon;
  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        takeaway.tone === "positive" && "bg-green-500/5 border-green-500/20",
        takeaway.tone === "mixed" && "bg-yellow-500/5 border-yellow-500/20",
        takeaway.tone === "negative" && "bg-red-500/5 border-red-500/20"
      )}
      data-testid={`takeaway-${takeaway.title.toLowerCase()}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-sm">{takeaway.title}</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {takeaway.score}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {takeaway.summary}
      </p>
    </div>
  );
}

function ReadOnlyTakeaways({ 
  performanceStrong,
  valuationSensible,
  timingSupported,
  timingTotal,
  isLoading,
}: { 
  performanceStrong: number;
  valuationSensible: number;
  timingSupported: number;
  timingTotal: number;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const performanceTakeaway = getPerformanceTakeaway(performanceStrong);
  const valuationTakeaway = getValuationTakeaway(valuationSensible);
  const timingTakeaway = getTimingTakeaway(timingSupported, timingTotal);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2 h-auto py-3"
          data-testid="button-takeaways-toggle"
        >
          <span className="text-sm font-medium">Read-only takeaways from prior stages</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <TakeawayBlock takeaway={performanceTakeaway} />
            <TakeawayBlock takeaway={valuationTakeaway} />
            <TakeawayBlock takeaway={timingTakeaway} />
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-4">
          These takeaways are read-only. Your strategy choices won't change these results.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TrancheCard({ 
  tranche, 
  onTriggerChange 
}: { 
  tranche: TrancheData;
  onTriggerChange: (trigger: string) => void;
}) {
  return (
    <div 
      className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50"
      data-testid={`tranche-card-${tranche.index}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{tranche.index}</span>
        </div>
        <div>
          <p className="font-medium">Tranche {tranche.index}</p>
          <p className="text-lg font-semibold text-primary">{formatCurrency(tranche.amount)}</p>
        </div>
      </div>
      <div className="flex-shrink-0 w-48">
        <Select value={tranche.trigger} onValueChange={onTriggerChange}>
          <SelectTrigger className="h-9" data-testid={`select-trigger-${tranche.index}`}>
            <SelectValue placeholder="Check-in trigger" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface TimingSignal {
  status: "green" | "yellow" | "red";
}

interface TimingAnalysisResponse {
  verdict?: {
    message: string;
  };
  trend?: { signal: TimingSignal };
  momentum?: { signal: TimingSignal };
  stretch?: { signal: TimingSignal };
}

interface ValuationQuadrantItem {
  id: string;
  verdict: string;
  strength: "sensible" | "caution" | "risky";
}

interface ValuationMetricsResponse {
  quadrants?: ValuationQuadrantItem[];
  summaryVerdict?: string;
  overallStrength?: "sensible" | "caution" | "risky";
}

export function StrategyStage({ 
  ticker = "", 
  companyName,
  logoUrl,
  fundamentalsScore,
  valuationLabel: valuationLabelProp,
  timingVerdict: timingVerdictProp,
}: StrategyStageProps) {
  const { toast } = useToast();
  const [convictionValue, setConvictionValue] = useState(50);
  const [amountInput, setAmountInput] = useState("10000");
  const [tranches, setTranches] = useState<TrancheData[]>([]);
  const [imWrongIf, setImWrongIf] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState("");

  const { data: timingData, isLoading: timingLoading } = useQuery<TimingAnalysisResponse>({
    queryKey: [`/api/timing/${ticker}`],
    enabled: !!ticker,
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery<ValuationMetricsResponse>({
    queryKey: [`/api/valuation/${ticker}`],
    enabled: !!ticker,
  });

  const takeawaysLoading = timingLoading || valuationLoading;

  const performanceStrong = useMemo(() => {
    if (!fundamentalsScore) return 0;
    const match = fundamentalsScore.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }, [fundamentalsScore]);

  const valuationSensible = useMemo(() => {
    if (!valuationData?.quadrants?.length) return 0;
    return valuationData.quadrants.filter(q => q.strength === "sensible").length;
  }, [valuationData]);

  const { timingSupported, timingTotal } = useMemo(() => {
    if (!timingData) return { timingSupported: 0, timingTotal: 3 };
    const signals = [
      timingData.trend?.signal,
      timingData.momentum?.signal,
      timingData.stretch?.signal,
    ].filter(Boolean);
    const supportive = signals.filter(s => s?.status === "green").length;
    return { timingSupported: supportive, timingTotal: signals.length || 3 };
  }, [timingData]);

  const totalAmount = useMemo(() => parseCurrencyInput(amountInput) || 10000, [amountInput]);
  const convictionLabel = useMemo(() => getConvictionLabel(convictionValue), [convictionValue]);
  const trancheCount = useMemo(() => getTrancheCount(convictionValue), [convictionValue]);

  useEffect(() => {
    const newTranches = buildTranches(totalAmount, trancheCount);
    setTranches((prev) => {
      return newTranches.map((t, i) => ({
        ...t,
        trigger: prev[i]?.trigger || t.trigger,
      }));
    });
  }, [totalAmount, trancheCount]);

  useEffect(() => {
    if (ticker) {
      const saved = localStorage.getItem(`strategyPlan:${ticker}`);
      if (saved) {
        try {
          const plan: StrategyPlan = JSON.parse(saved);
          setConvictionValue(plan.convictionValue);
          setAmountInput(plan.totalAmount.toString());
          setImWrongIf(plan.imWrongIf);
          if (plan.tranches?.length) {
            setTranches(plan.tranches);
          }
        } catch (e) {
          console.error("Failed to load saved strategy:", e);
        }
      }
    }
  }, [ticker]);

  const handleTriggerChange = (index: number, trigger: string) => {
    setTranches((prev) =>
      prev.map((t) => (t.index === index ? { ...t, trigger } : t))
    );
  };

  const buildStrategyPlan = (): StrategyPlan => ({
    ticker,
    convictionValue,
    convictionLabel,
    trancheCount,
    totalAmount,
    tranches,
    imWrongIf,
    snapshot: {
      fundamentals: fundamentalsScore || "—",
      valuation: `${valuationSensible}/4 sensible`,
      timing: `${timingSupported}/${timingTotal} supportive`,
    },
    createdAt: new Date().toISOString(),
  });

  const handleSave = () => {
    const plan = buildStrategyPlan();
    localStorage.setItem(`strategyPlan:${ticker}`, JSON.stringify(plan));
    toast({
      title: "Strategy saved",
      description: "Your strategy has been saved on this device.",
    });
  };

  const emailMutation = useMutation({
    mutationFn: async (data: { email: string; plan: StrategyPlan }) => {
      const response = await apiRequest("POST", "/api/strategy-email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your strategy plan has been emailed to you.",
      });
      setEmailModalOpen(false);
      setEmailAddress("");
    },
    onError: () => {
      toast({
        title: "Failed to send email",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = () => {
    setEmailError("");
    if (!emailAddress.trim()) {
      setEmailError("Please enter your email address");
      return;
    }
    if (!validateEmail(emailAddress)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    emailMutation.mutate({
      email: emailAddress.trim(),
      plan: buildStrategyPlan(),
    });
  };

  const getConvictionZoneStyles = (label: string) => {
    switch (label) {
      case "Exploring":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "Interested":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "High conviction":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-testid="strategy-stage">
      <CardHeader className="text-center pb-6">
        {companyName && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              {logoUrl ? (
                <img 
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  className="w-16 h-16 rounded-lg object-contain bg-white p-2 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`${logoUrl ? 'hidden' : 'flex'} w-16 h-16 rounded-lg bg-primary/10 items-center justify-center shadow-sm`}>
                <span className="text-2xl font-bold text-primary">{ticker.charAt(0)}</span>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">{companyName}</h2>
              <p className="text-sm text-muted-foreground">{ticker}</p>
            </div>
          </div>
        )}
        <CardTitle className="text-2xl">Strategy</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-12 space-y-8">
        <ReadOnlyTakeaways 
          performanceStrong={performanceStrong}
          valuationSensible={valuationSensible}
          timingSupported={timingSupported}
          timingTotal={timingTotal}
          isLoading={takeawaysLoading}
        />

        <div className="max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Conviction</Label>
              <Badge className={cn("font-medium", getConvictionZoneStyles(convictionLabel))}>
                {convictionLabel}
              </Badge>
            </div>
            <Slider
              value={[convictionValue]}
              onValueChange={(value) => setConvictionValue(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
              data-testid="slider-conviction"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Exploring</span>
              <span>Interested</span>
              <span>High conviction</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              Amount you want to invest
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="pl-9"
                placeholder="10000"
                data-testid="input-amount"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Plan Preview</Label>
              <span className="text-sm text-muted-foreground">
                {trancheCount} tranches
              </span>
            </div>
            <div className="space-y-3">
              {tranches.map((tranche) => (
                <TrancheCard
                  key={tranche.index}
                  tranche={tranche}
                  onTriggerChange={(trigger) => handleTriggerChange(tranche.index, trigger)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="wrong-if" className="text-base font-medium">
                I'm wrong if...
              </Label>
              <Badge variant="outline" className="text-xs">
                Recommended
              </Badge>
            </div>
            <Textarea
              id="wrong-if"
              value={imWrongIf}
              onChange={(e) => setImWrongIf(e.target.value)}
              placeholder="e.g., revenue growth stalls for 2+ quarters, debt risk rises, margins compress..."
              className="min-h-[100px] resize-none"
              data-testid="textarea-wrong-if"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              className="flex-1"
              data-testid="button-save-strategy"
            >
              <Save className="w-4 h-4 mr-2" />
              Save strategy
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEmailModalOpen(true)}
              className="flex-1"
              data-testid="button-email-strategy"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email me this plan
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This is a planning tool, not investment advice. Always do your own research.
          </p>
        </div>
      </CardContent>

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email your strategy plan</DialogTitle>
            <DialogDescription>
              We'll send a copy of your {ticker} strategy to your inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  setEmailError("");
                }}
                placeholder="you@example.com"
                disabled={emailMutation.isPending}
                data-testid="input-email-modal"
              />
              {emailError && (
                <div className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>{emailError}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailModalOpen(false)}
              disabled={emailMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailSubmit}
              disabled={emailMutation.isPending}
              data-testid="button-send-email"
            >
              {emailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
