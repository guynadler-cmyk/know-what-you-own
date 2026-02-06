import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Save, Mail, AlertCircle, Loader2, ChevronRight,
  BarChart3, DollarSign, Activity, Lock, Unlock,
  RotateCcw, Equal, Wrench, Plus, X, ArrowUp, ArrowDown,
  CalendarIcon, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

interface StrategyStageProps {
  ticker?: string;
  companyName?: string;
  logoUrl?: string;
  fundamentalsScore?: string;
  valuationLabel?: string;
  timingVerdict?: string;
  onStageChange?: (stage: number) => void;
}

interface TrancheWhen {
  type: "now" | "earnings" | "days" | "date" | "manual";
  days?: number;
  dateISO?: string;
}

interface TrancheGate {
  type: "none" | "fundamentals_ok" | "not_wrong_if" | "reread_takeaways" | "manual";
}

interface TrancheData {
  index: number;
  amount: number;
  when: TrancheWhen;
  gate: TrancheGate;
  gateEnabled: boolean;
  manual: boolean;
}

interface StrategyPlan {
  ticker: string;
  companyName?: string;
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
  takeawayTexts: {
    performance: string;
    valuation: string;
    timing: string;
  };
  createdAt: string;
}

const WHEN_OPTIONS: { value: string; label: string }[] = [
  { value: "now", label: "Now / soon" },
  { value: "earnings", label: "After next earnings" },
  { value: "days", label: "In 30 days" },
  { value: "date", label: "On a specific date..." },
  { value: "manual", label: "Manual / I'll decide" },
];

const GATE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fundamentals_ok", label: "Fundamentals still look healthy" },
  { value: "not_wrong_if", label: "My 'I'm wrong if...' conditions are NOT true" },
  { value: "reread_takeaways", label: "I've re-read the takeaways" },
  { value: "manual", label: "Manual check (I'll decide)" },
];

function whenToKey(w: TrancheWhen): string {
  if (w.type === "days") return "days";
  if (w.type === "date") return "date";
  return w.type;
}

function whenToLabel(w: TrancheWhen): string {
  switch (w.type) {
    case "now": return "Now / soon";
    case "earnings": return "After next earnings";
    case "days": return `In ${w.days || 30} days`;
    case "date": return w.dateISO ? format(new Date(w.dateISO), "MMM d, yyyy") : "Pick a date";
    case "manual": return "Manual / I'll decide";
  }
}

function gateToLabel(g: TrancheGate): string {
  const opt = GATE_OPTIONS.find(o => o.value === g.type);
  return opt?.label || g.type;
}

function migrateLegacyTranche(t: any): TrancheData {
  if (t.when && typeof t.when === "object") {
    return {
      index: t.index,
      amount: t.amount,
      when: t.when,
      gate: t.gate || { type: "none" },
      gateEnabled: t.gateEnabled || false,
      manual: t.manual || false,
    };
  }
  const trigger: string = t.trigger || "manual";
  let when: TrancheWhen;
  let gate: TrancheGate = { type: "none" };
  let gateEnabled = false;

  switch (trigger) {
    case "now":
      when = { type: "now" };
      break;
    case "earnings":
      when = { type: "earnings" };
      break;
    case "30days":
      when = { type: "days", days: 30 };
      break;
    case "recheck":
      when = { type: "manual" };
      gate = { type: "fundamentals_ok" };
      gateEnabled = true;
      break;
    default:
      when = { type: "manual" };
  }

  return {
    index: t.index,
    amount: t.amount,
    when,
    gate,
    gateEnabled,
    manual: t.manual || false,
  };
}

const CONVICTION_WEIGHTS: Record<string, number[]> = {
  "Exploring": [0.12, 0.18, 0.20, 0.25, 0.25],
  "Interested": [0.35, 0.33, 0.32],
  "High conviction": [0.60, 0.40],
};

const WRONG_IF_AREAS = [
  "Revenue", "Margins", "Debt", "Cash flow",
  "Competition", "Strategy narrative", "Management execution",
];
const WRONG_IF_CHANGES = [
  "stalls", "declines", "rises", "deteriorates", "compresses", "breaks",
];
const WRONG_IF_THRESHOLDS = [
  "for 2+ quarters", "by >10%", "without recovery", "below prior level",
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

function buildWeightedTranches(total: number, label: string): TrancheData[] {
  const weights = CONVICTION_WEIGHTS[label] || [1];
  const count = weights.length;
  const rawAmounts = weights.map(w => Math.floor(total * w));
  const allocated = rawAmounts.reduce((s, a) => s + a, 0);
  const remainder = total - allocated;
  rawAmounts[0] += remainder;

  return rawAmounts.map((amount, i) => ({
    index: i + 1,
    amount,
    when: i === 0 ? { type: "now" as const } : { type: "days" as const, days: 30 },
    gate: { type: "none" as const },
    gateEnabled: false,
    manual: false,
  }));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function sanitizeToDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

type TakeawayTone = "positive" | "mixed" | "negative";

interface TakeawayData {
  title: string;
  score: string;
  summary: string;
  tone: TakeawayTone;
  icon: typeof BarChart3;
  stageNumber: number;
}

function getPerformanceTakeaway(strongCount: number): TakeawayData {
  const tone: TakeawayTone = strongCount === 4 ? "positive" : strongCount >= 2 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "Financially strong across all four dimensions.",
    mixed: "Mixed financial signals across the scorecard.",
    negative: "Financial picture shows weakness in most areas.",
  };
  return {
    title: "Performance",
    score: `${strongCount}/4 strong`,
    summary: summaries[tone],
    tone,
    icon: BarChart3,
    stageNumber: 2,
  };
}

function getValuationTakeaway(sensibleCount: number): TakeawayData {
  const tone: TakeawayTone = sensibleCount === 4 ? "positive" : sensibleCount >= 2 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "All valuation signals look sensible.",
    mixed: "Some valuation signals look reasonable, others warrant a closer look.",
    negative: "Multiple valuation signals suggest elevated pricing.",
  };
  return {
    title: "Valuation",
    score: `${sensibleCount}/4 sensible`,
    summary: summaries[tone],
    tone,
    icon: DollarSign,
    stageNumber: 3,
  };
}

function getTimingTakeaway(supportiveCount: number, total: number): TakeawayData {
  const ratio = total > 0 ? supportiveCount / total : 0;
  const tone: TakeawayTone = ratio >= 0.8 ? "positive" : ratio >= 0.4 ? "mixed" : "negative";
  const summaries: Record<TakeawayTone, string> = {
    positive: "Timing conditions are aligned and supportive.",
    mixed: "Mixed timing signals across trend, momentum, and stretch.",
    negative: "Timing conditions are currently challenging.",
  };
  return {
    title: "Timing",
    score: `${supportiveCount}/${total} supportive`,
    summary: summaries[tone],
    tone,
    icon: Activity,
    stageNumber: 4,
  };
}

function TakeawayCard({ takeaway, onNavigate }: { takeaway: TakeawayData; onNavigate?: (stage: number) => void }) {
  const Icon = takeaway.icon;
  return (
    <div
      className={cn(
        "p-3 rounded-md border flex items-center gap-3",
        takeaway.tone === "positive" && "bg-green-500/5 border-green-500/20",
        takeaway.tone === "mixed" && "bg-yellow-500/5 border-yellow-500/20",
        takeaway.tone === "negative" && "bg-red-500/5 border-red-500/20"
      )}
      data-testid={`takeaway-${takeaway.title.toLowerCase()}`}
    >
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{takeaway.title}</span>
          <Badge variant="outline" className="text-xs">{takeaway.score}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{takeaway.summary}</p>
      </div>
      {onNavigate && (
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 text-xs text-muted-foreground gap-1"
          onClick={() => onNavigate(takeaway.stageNumber)}
          data-testid={`link-view-${takeaway.title.toLowerCase()}`}
        >
          View details
          <ChevronRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

function ReadOnlyTakeaways({ 
  performanceStrong, valuationSensible, timingSupported, timingTotal,
  isLoading, onNavigate,
}: { 
  performanceStrong: number;
  valuationSensible: number;
  timingSupported: number;
  timingTotal: number;
  isLoading: boolean;
  onNavigate?: (stage: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  
  const performanceTakeaway = getPerformanceTakeaway(performanceStrong);
  const valuationTakeaway = getValuationTakeaway(valuationSensible);
  const timingTakeaway = getTimingTakeaway(timingSupported, timingTotal);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} defaultOpen={true}>
      <div className="flex items-center justify-between mb-2">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-sm font-medium text-muted-foreground"
            data-testid="button-takeaways-toggle"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
            Research takeaways
          </Button>
        </CollapsibleTrigger>
        <span className="text-xs text-muted-foreground">Use "View details" to revisit a stage.</span>
      </div>
      <CollapsibleContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            <TakeawayCard takeaway={performanceTakeaway} onNavigate={onNavigate} />
            <TakeawayCard takeaway={valuationTakeaway} onNavigate={onNavigate} />
            <TakeawayCard takeaway={timingTakeaway} onNavigate={onNavigate} />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function TrancheCard({ 
  tranche, 
  onWhenChange,
  onGateChange,
  onGateToggle,
  onAmountChange,
  onToggleManual,
}: { 
  tranche: TrancheData;
  onWhenChange: (when: TrancheWhen) => void;
  onGateChange: (gate: TrancheGate) => void;
  onGateToggle: (enabled: boolean) => void;
  onAmountChange: (amount: number) => void;
  onToggleManual: () => void;
}) {
  const [localValue, setLocalValue] = useState(formatNumber(tranche.amount));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (!tranche.manual) {
      setLocalValue(formatNumber(tranche.amount));
    }
  }, [tranche.amount, tranche.manual]);

  const handleAmountChange = (raw: string) => {
    const digits = sanitizeToDigits(raw);
    const num = parseInt(digits, 10) || 0;
    setLocalValue(digits ? formatNumber(num) : "");
    onAmountChange(num);
  };

  const handleWhenSelect = (key: string) => {
    switch (key) {
      case "now": onWhenChange({ type: "now" }); break;
      case "earnings": onWhenChange({ type: "earnings" }); break;
      case "days": onWhenChange({ type: "days", days: 30 }); break;
      case "date": {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        onWhenChange({ type: "date", dateISO: tranche.when.dateISO || defaultDate.toISOString() });
        setDatePickerOpen(true);
        break;
      }
      case "manual": onWhenChange({ type: "manual" }); break;
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onWhenChange({ type: "date", dateISO: date.toISOString() });
      setDatePickerOpen(false);
    }
  };

  return (
    <div 
      className="p-3 bg-muted/30 rounded-md border border-border/50 space-y-2"
      data-testid={`tranche-card-${tranche.index}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-primary">{tranche.index}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                value={localValue}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-6 text-sm font-medium"
                data-testid={`input-tranche-amount-${tranche.index}`}
              />
            </div>
            <Select value={whenToKey(tranche.when)} onValueChange={handleWhenSelect}>
              <SelectTrigger className="text-xs flex-1" data-testid={`select-when-${tranche.index}`}>
                <SelectValue placeholder="When?" />
              </SelectTrigger>
              <SelectContent>
                {WHEN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={onToggleManual}
              title={tranche.manual ? "Manual (click to auto)" : "Auto (click to lock)"}
              data-testid={`button-lock-${tranche.index}`}
            >
              {tranche.manual ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
            </Button>
          </div>
        </div>
      </div>

      {tranche.when.type === "date" && (
        <div className="ml-9">
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "text-xs gap-1.5 font-normal",
                  !tranche.when.dateISO && "text-muted-foreground"
                )}
                data-testid={`button-date-picker-${tranche.index}`}
              >
                <CalendarIcon className="w-3 h-3" />
                {tranche.when.dateISO
                  ? format(new Date(tranche.when.dateISO), "MMM d, yyyy")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={tranche.when.dateISO ? new Date(tranche.when.dateISO) : undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {tranche.gateEnabled ? (
        <div className="ml-9 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <Select value={tranche.gate.type} onValueChange={(v) => onGateChange({ type: v as TrancheGate["type"] })}>
            <SelectTrigger className="text-xs flex-1" data-testid={`select-gate-${tranche.index}`}>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              {GATE_OPTIONS.filter(o => o.value !== "none").map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => {
              onGateToggle(false);
              onGateChange({ type: "none" });
            }}
            title="Remove condition"
            data-testid={`button-remove-gate-${tranche.index}`}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="ml-9">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1"
            onClick={() => {
              onGateToggle(true);
              onGateChange({ type: "fundamentals_ok" });
            }}
            data-testid={`button-add-gate-${tranche.index}`}
          >
            <Plus className="w-3 h-3" />
            Add a condition
          </Button>
        </div>
      )}
    </div>
  );
}

function WrongIfBuilder({ 
  value, onChange 
}: { 
  value: string; 
  onChange: (val: string) => void;
}) {
  const [statements, setStatements] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [selectedThreshold, setSelectedThreshold] = useState<string | null>(null);

  useEffect(() => {
    if (value && statements.length === 0) {
      const parts = value.split("\n").filter(Boolean);
      if (parts.length > 0) setStatements(parts);
    }
  }, []);

  const previewSentence = useMemo(() => {
    if (!selectedArea) return null;
    let s = selectedArea;
    if (selectedChange) s += ` ${selectedChange}`;
    if (selectedThreshold) s += ` ${selectedThreshold}`;
    return s;
  }, [selectedArea, selectedChange, selectedThreshold]);

  const addStatement = () => {
    if (previewSentence) {
      const next = [...statements, previewSentence];
      setStatements(next);
      onChange(next.join("\n"));
      setSelectedArea(null);
      setSelectedChange(null);
      setSelectedThreshold(null);
    }
  };

  const removeStatement = (idx: number) => {
    const next = statements.filter((_, i) => i !== idx);
    setStatements(next);
    onChange(next.join("\n"));
  };

  const moveStatement = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= statements.length) return;
    const next = [...statements];
    [next[idx], next[target]] = [next[target], next[idx]];
    setStatements(next);
    onChange(next.join("\n"));
  };

  const handleTextareaChange = (text: string) => {
    onChange(text);
    const parts = text.split("\n").filter(Boolean);
    setStatements(parts);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Area</Label>
        <div className="flex flex-wrap gap-1.5">
          {WRONG_IF_AREAS.map(a => (
            <Badge
              key={a}
              variant={selectedArea === a ? "default" : "outline"}
              className={cn("cursor-pointer text-xs", selectedArea === a && "toggle-elevate toggle-elevated")}
              onClick={() => setSelectedArea(selectedArea === a ? null : a)}
              data-testid={`chip-area-${a.toLowerCase().replace(/\s/g, '-')}`}
            >
              {a}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Change</Label>
        <div className="flex flex-wrap gap-1.5">
          {WRONG_IF_CHANGES.map(c => (
            <Badge
              key={c}
              variant={selectedChange === c ? "default" : "outline"}
              className={cn("cursor-pointer text-xs", selectedChange === c && "toggle-elevate toggle-elevated")}
              onClick={() => setSelectedChange(selectedChange === c ? null : c)}
              data-testid={`chip-change-${c}`}
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Threshold</Label>
        <div className="flex flex-wrap gap-1.5">
          {WRONG_IF_THRESHOLDS.map(t => (
            <Badge
              key={t}
              variant={selectedThreshold === t ? "default" : "outline"}
              className={cn("cursor-pointer text-xs", selectedThreshold === t && "toggle-elevate toggle-elevated")}
              onClick={() => setSelectedThreshold(selectedThreshold === t ? null : t)}
              data-testid={`chip-threshold-${t.replace(/\s/g, '-')}`}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      {previewSentence && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <p className="flex-1 text-sm italic text-muted-foreground">{previewSentence}</p>
          <Button size="sm" onClick={addStatement} data-testid="button-add-statement">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      )}

      {statements.length > 0 && (
        <div className="space-y-1.5">
          {statements.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 p-2 bg-muted/30 rounded-md text-sm">
              <span className="flex-1">{s}</span>
              <Button variant="ghost" size="icon" onClick={() => moveStatement(i, -1)} disabled={i === 0}>
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => moveStatement(i, 1)} disabled={i === statements.length - 1}>
                <ArrowDown className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeStatement(i)} data-testid={`button-remove-statement-${i}`}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Textarea
        value={value}
        onChange={(e) => handleTextareaChange(e.target.value)}
        placeholder="Or type freely here..."
        className="min-h-[60px] resize-none text-sm"
        data-testid="textarea-wrong-if"
      />
    </div>
  );
}

interface TimingSignal {
  status: "green" | "yellow" | "red";
}

interface TimingAnalysisResponse {
  verdict?: { message: string };
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
  onStageChange,
}: StrategyStageProps) {
  const { toast } = useToast();
  const [convictionValue, setConvictionValue] = useState(50);
  const [totalAmountRaw, setTotalAmountRaw] = useState(10000);
  const [amountDisplay, setAmountDisplay] = useState("10,000");
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

  const convictionLabel = useMemo(() => getConvictionLabel(convictionValue), [convictionValue]);
  const trancheCount = useMemo(() => getTrancheCount(convictionValue), [convictionValue]);

  const rebuildAutoTranches = useCallback((total: number, label: string, preserveWhenGate = true) => {
    const newTranches = buildWeightedTranches(total, label);
    setTranches(prev => {
      return newTranches.map((t, i) => ({
        ...t,
        when: preserveWhenGate && prev[i]?.when ? prev[i].when : t.when,
        gate: preserveWhenGate && prev[i]?.gate ? prev[i].gate : t.gate,
        gateEnabled: preserveWhenGate && prev[i] ? prev[i].gateEnabled : t.gateEnabled,
      }));
    });
  }, []);

  useEffect(() => {
    setTranches(prev => {
      const newTranches = buildWeightedTranches(totalAmountRaw, convictionLabel);
      if (prev.length !== newTranches.length) {
        return newTranches.map((t, i) => ({
          ...t,
          when: prev[i]?.when || t.when,
          gate: prev[i]?.gate || t.gate,
          gateEnabled: prev[i]?.gateEnabled || t.gateEnabled,
        }));
      }
      return prev.map((existing, i) => {
        if (existing.manual) return existing;
        return {
          ...newTranches[i],
          when: existing.when,
          gate: existing.gate,
          gateEnabled: existing.gateEnabled,
        };
      });
    });
  }, [totalAmountRaw, convictionLabel]);

  useEffect(() => {
    if (ticker) {
      const saved = localStorage.getItem(`strategyPlan:${ticker}`);
      if (saved) {
        try {
          const plan = JSON.parse(saved);
          setConvictionValue(plan.convictionValue);
          setTotalAmountRaw(plan.totalAmount);
          setAmountDisplay(formatNumber(plan.totalAmount));
          setImWrongIf(plan.imWrongIf);
          if (plan.tranches?.length) {
            setTranches(plan.tranches.map((t: any) => migrateLegacyTranche(t)));
          }
        } catch (e) {
          console.error("Failed to load saved strategy:", e);
        }
      }
    }
  }, [ticker]);

  const handleAmountInput = (raw: string) => {
    const digits = sanitizeToDigits(raw);
    const num = parseInt(digits, 10) || 0;
    setTotalAmountRaw(num || 10000);
    setAmountDisplay(digits ? formatNumber(num) : "");
  };

  const handleWhenChange = (index: number, when: TrancheWhen) => {
    setTranches(prev => prev.map(t => t.index === index ? { ...t, when } : t));
  };

  const handleGateChange = (index: number, gate: TrancheGate) => {
    setTranches(prev => prev.map(t => t.index === index ? { ...t, gate } : t));
  };

  const handleGateToggle = (index: number, enabled: boolean) => {
    setTranches(prev => prev.map(t => t.index === index ? { ...t, gateEnabled: enabled } : t));
  };

  const handleTrancheAmountChange = (index: number, amount: number) => {
    setTranches(prev => prev.map(t => t.index === index ? { ...t, amount, manual: true } : t));
  };

  const handleToggleManual = (index: number) => {
    setTranches(prev => {
      const updated = prev.map(t => {
        if (t.index !== index) return t;
        if (t.manual) {
          const autoTranches = buildWeightedTranches(totalAmountRaw, convictionLabel);
          const autoAmount = autoTranches[t.index - 1]?.amount || t.amount;
          return { ...t, manual: false, amount: autoAmount };
        }
        return { ...t, manual: true };
      });
      return updated;
    });
  };

  const handleResetToAuto = () => {
    rebuildAutoTranches(totalAmountRaw, convictionLabel);
  };

  const handleEvenSplit = () => {
    const count = tranches.length;
    const base = Math.floor(totalAmountRaw / count);
    const remainder = totalAmountRaw - base * count;
    setTranches(prev => prev.map((t, i) => ({
      ...t,
      amount: i === 0 ? base + remainder : base,
      manual: false,
    })));
  };

  const trancheSum = useMemo(() => tranches.reduce((s, t) => s + t.amount, 0), [tranches]);
  const trancheDiff = totalAmountRaw - trancheSum;

  const handleFixTranches = () => {
    if (trancheDiff === 0) return;
    setTranches(prev => {
      const lastIndex = prev.length - 1;
      return prev.map((t, i) => i === lastIndex ? { ...t, amount: t.amount + trancheDiff } : t);
    });
  };

  const performanceTakeaway = getPerformanceTakeaway(performanceStrong);
  const valuationTakeaway = getValuationTakeaway(valuationSensible);
  const timingTakeaway = getTimingTakeaway(timingSupported, timingTotal);

  const buildStrategyPlan = (): StrategyPlan => ({
    ticker,
    companyName: companyName || undefined,
    convictionValue,
    convictionLabel,
    trancheCount,
    totalAmount: totalAmountRaw,
    tranches,
    imWrongIf,
    snapshot: {
      fundamentals: fundamentalsScore || "---",
      valuation: `${valuationSensible}/4 sensible`,
      timing: `${timingSupported}/${timingTotal} supportive`,
    },
    takeawayTexts: {
      performance: `${performanceTakeaway.score}: ${performanceTakeaway.summary}`,
      valuation: `${valuationTakeaway.score}: ${valuationTakeaway.summary}`,
      timing: `${timingTakeaway.score}: ${timingTakeaway.summary}`,
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
      toast({ title: "Email sent", description: "Your strategy plan has been emailed to you." });
      setEmailModalOpen(false);
      setEmailAddress("");
    },
    onError: () => {
      toast({ title: "Failed to send email", description: "Please try again later.", variant: "destructive" });
    },
  });

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailSubmit = () => {
    setEmailError("");
    if (!emailAddress.trim()) { setEmailError("Please enter your email address"); return; }
    if (!validateEmail(emailAddress)) { setEmailError("Please enter a valid email address"); return; }
    emailMutation.mutate({ email: emailAddress.trim(), plan: buildStrategyPlan() });
  };

  const getConvictionZoneStyles = (label: string) => {
    switch (label) {
      case "Exploring": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "Interested": return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "High conviction": return "bg-green-500/10 text-green-700 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="max-w-5xl mx-auto" data-testid="strategy-stage">
      {companyName && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            {logoUrl ? (
              <img 
                src={logoUrl}
                alt={`${companyName} logo`}
                className="w-10 h-10 rounded-md object-contain bg-white p-1 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`${logoUrl ? 'hidden' : 'flex'} w-10 h-10 rounded-md bg-primary/10 items-center justify-center`}>
              <span className="text-lg font-bold text-primary">{ticker.charAt(0)}</span>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">{companyName}</h2>
            <p className="text-xs text-muted-foreground">{ticker} &middot; Strategy</p>
          </div>
        </div>
      )}

      <ReadOnlyTakeaways
        performanceStrong={performanceStrong}
        valuationSensible={valuationSensible}
        timingSupported={timingSupported}
        timingTotal={timingTotal}
        isLoading={takeawaysLoading}
        onNavigate={onStageChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-5 pb-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-sm font-medium">Conviction</Label>
                  <Badge className={cn("font-medium", getConvictionZoneStyles(convictionLabel))}>
                    {convictionLabel} &middot; {trancheCount} tranches
                  </Badge>
                </div>
                <Slider
                  value={[convictionValue]}
                  onValueChange={(v) => setConvictionValue(v[0])}
                  min={0} max={100} step={1}
                  data-testid="slider-conviction"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Exploring</span>
                  <span>Interested</span>
                  <span>High conviction</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Total amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={(e) => handleAmountInput(e.target.value)}
                    className="pl-9"
                    placeholder="10,000"
                    data-testid="input-amount"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <Label className="text-sm font-medium">I'm wrong if...</Label>
                <Badge variant="outline" className="text-xs">Guardrails</Badge>
              </div>
              <WrongIfBuilder value={imWrongIf} onChange={setImWrongIf} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <Label className="text-sm font-medium">Plan preview</Label>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleResetToAuto} data-testid="button-reset-auto">
                    <RotateCcw className="w-3 h-3" /> Auto
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleEvenSplit} data-testid="button-even-split">
                    <Equal className="w-3 h-3" /> Even
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {tranches.map((tranche) => (
                  <TrancheCard
                    key={tranche.index}
                    tranche={tranche}
                    onWhenChange={(when) => handleWhenChange(tranche.index, when)}
                    onGateChange={(gate) => handleGateChange(tranche.index, gate)}
                    onGateToggle={(enabled) => handleGateToggle(tranche.index, enabled)}
                    onAmountChange={(amount) => handleTrancheAmountChange(tranche.index, amount)}
                    onToggleManual={() => handleToggleManual(tranche.index)}
                  />
                ))}
              </div>

              {trancheDiff !== 0 && (
                <div className={cn(
                  "flex items-center justify-between mt-3 p-2 rounded-md text-xs",
                  trancheDiff > 0 ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                )}>
                  <span>
                    {trancheDiff > 0 
                      ? `${formatCurrency(trancheDiff)} remaining`
                      : `${formatCurrency(Math.abs(trancheDiff))} over budget`
                    }
                  </span>
                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handleFixTranches} data-testid="button-fix-tranches">
                    <Wrench className="w-3 h-3" /> Fix
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm">
                <span className="text-muted-foreground">Total allocated</span>
                <span className="font-semibold">{formatCurrency(trancheSum)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button onClick={handleSave} className="flex-1" data-testid="button-save-strategy">
          <Save className="w-4 h-4 mr-2" /> Save strategy
        </Button>
        <Button variant="outline" onClick={() => setEmailModalOpen(true)} className="flex-1" data-testid="button-email-strategy">
          <Mail className="w-4 h-4 mr-2" /> Email me this plan
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        This is a planning tool, not investment advice. Always do your own research.
      </p>

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
                onChange={(e) => { setEmailAddress(e.target.value); setEmailError(""); }}
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
            <Button variant="outline" onClick={() => setEmailModalOpen(false)} disabled={emailMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleEmailSubmit} disabled={emailMutation.isPending} data-testid="button-send-email">
              {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
