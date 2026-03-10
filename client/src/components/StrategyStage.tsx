import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Mail, AlertCircle, Loader2, BarChart3, DollarSign, Activity,
  Building2, Sparkles, Plus, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type ConvictionLevel = "exploring" | "interested" | "high_conviction";
type SplitType = "even" | "front_loaded" | "back_loaded" | "custom";
type MemoState = "idle" | "generating" | "done";

interface SimpleTranche {
  id: number;
  amount: number;
  amountDisplay: string;
  timing: string;
  condition: string;
}

interface GuardrailRow {
  id: number;
  selectedAreas: string[];
  selectedChanges: string[];
  selectedThresholds: string[];
  customText: string;
}

interface MemoData {
  why_own: string;
  time_horizon: string;
  watching: string;
}

interface SavedStrategy {
  conviction: ConvictionLevel;
  totalAmount: number;
  split: SplitType;
  tranches: SimpleTranche[];
  guardrails: GuardrailRow[];
  memo?: MemoData;
  memoGenerated?: boolean;
}

interface TimingSignal { status: "green" | "yellow" | "red"; }
interface TimingAnalysisResponse {
  verdict?: { message: string };
  trend?: { signal: TimingSignal };
  momentum?: { signal: TimingSignal };
  stretch?: { signal: TimingSignal };
}
interface ValuationQuadrantItem { id: string; verdict: string; strength: "sensible" | "caution" | "risky"; }
interface ValuationMetricsResponse { quadrants?: ValuationQuadrantItem[]; }

interface StrategyStageProps {
  ticker?: string;
  companyName?: string;
  homepage?: string;
  fundamentalsScore?: string;
  valuationLabel?: string;
  timingVerdict?: string;
  onStageChange?: (stage: number) => void;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CONVICTION_CONFIGS: Record<ConvictionLevel, {
  label: string;
  trancheCount: number;
  desc: string;
  insight: string;
}> = {
  exploring: {
    label: "Exploring",
    trancheCount: 1,
    desc: "Interested but not ready to commit. Want to watch it first.",
    insight: "We suggest a single small starter position. This keeps you in the game without over-committing before you've built full conviction.",
  },
  interested: {
    label: "Interested",
    trancheCount: 3,
    desc: "I understand the business and see a real case. Ready to enter in stages.",
    insight: "We suggest entering in 2–3 tranches over 30–60 days. This lets you average in without committing everything at once.",
  },
  high_conviction: {
    label: "High Conviction",
    trancheCount: 2,
    desc: "Strong thesis, comfortable with position size. Prepared to add on dips.",
    insight: "We suggest entering in 2 tranches — a strong initial position now, with a second tranche ready if price improves.",
  },
};

const SPLIT_WEIGHTS: Record<SplitType, Record<number, number[]>> = {
  even: { 1: [1], 2: [0.5, 0.5], 3: [0.334, 0.333, 0.333] },
  front_loaded: { 1: [1], 2: [0.6, 0.4], 3: [0.5, 0.3, 0.2] },
  back_loaded: { 1: [1], 2: [0.4, 0.6], 3: [0.2, 0.3, 0.5] },
  custom: { 1: [1], 2: [0.5, 0.5], 3: [0.334, 0.333, 0.333] },
};

const DEFAULT_TIMINGS: Record<number, string[]> = {
  1: ["now"],
  2: ["now", "30days"],
  3: ["now", "30days", "60days"],
};

const TIMING_OPTIONS = [
  { value: "now", label: "Now / soon" },
  { value: "30days", label: "In 30 days" },
  { value: "60days", label: "In 60 days" },
  { value: "dip5", label: "On dip >5%" },
];

const GUARDRAIL_AREAS = ["Revenue", "Margins", "Debt", "Cash Flow", "Competition", "Management", "Strategy"];
const GUARDRAIL_CHANGES = ["declines", "stalls", "deteriorates", "compresses", "breaks"];
const GUARDRAIL_THRESHOLDS = ["for 2+ quarters", "by >10%", "without recovery", "below prior level"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function sanitizeToDigits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function buildTranches(
  total: number,
  count: number,
  split: SplitType,
  existing?: SimpleTranche[],
): SimpleTranche[] {
  const weights = SPLIT_WEIGHTS[split]?.[count] || SPLIT_WEIGHTS.even[count] || [1];
  const timings = DEFAULT_TIMINGS[count] || ["now"];
  const rawAmounts = weights.map(w => Math.floor(total * w));
  const allocated = rawAmounts.reduce((s, a) => s + a, 0);
  rawAmounts[rawAmounts.length - 1] += total - allocated;

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    amount: rawAmounts[i],
    amountDisplay: `$ ${formatNumber(rawAmounts[i])}`,
    timing: existing?.[i]?.timing || timings[i] || "now",
    condition: existing?.[i]?.condition || "",
  }));
}

function buildGuardrailStatement(row: GuardrailRow): string {
  const parts = [...row.selectedAreas, ...row.selectedChanges, ...row.selectedThresholds];
  if (parts.length > 0) return parts.join(" ");
  return row.customText;
}

function convictionLevelToOldValue(c: ConvictionLevel): number {
  return c === "exploring" ? 16 : c === "interested" ? 50 : 83;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionRow({ num, title, sub }: { num: number; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 mb-4 mt-8">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
        style={{ background: "var(--lp-teal-deep)", color: "white" }}
      >
        {num}
      </div>
      <div>
        <div className="font-semibold text-base" style={{ color: "var(--lp-ink)" }}>{title}</div>
        <div className="text-sm" style={{ color: "var(--lp-ink-mid)" }}>{sub}</div>
      </div>
    </div>
  );
}

function CardMacHeader({ label, ticker, badge }: { label: string; ticker: string; badge?: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-t-md"
      style={{ background: "var(--lp-teal-deep)" }}
    >
      <span className="text-xs font-medium text-white/80">{label}</span>
      <span className="text-xs font-mono text-white/70">{ticker}</span>
      {badge && <span className="text-xs text-white/60">{badge}</span>}
    </div>
  );
}

function StatusDot({ tone }: { tone: "positive" | "mixed" | "negative" }) {
  return (
    <div className={cn(
      "w-2.5 h-2.5 rounded-full flex-shrink-0",
      tone === "positive" && "bg-emerald-500",
      tone === "mixed" && "bg-amber-400",
      tone === "negative" && "bg-red-500",
    )} />
  );
}

function TagChip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer",
        selected
          ? "border-transparent text-white"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
      style={selected ? { background: "var(--lp-teal-deep)" } : {}}
      data-testid={`chip-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    >
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function StrategyStage({
  ticker = "",
  companyName,
  fundamentalsScore,
  onStageChange,
}: StrategyStageProps) {
  const { toast } = useToast();
  const upperTicker = ticker.toUpperCase();

  // ── State ──────────────────────────────────────────────────────────────────
  const [conviction, setConviction] = useState<ConvictionLevel>("interested");
  const [totalAmountRaw, setTotalAmountRaw] = useState(10000);
  const [amountDisplay, setAmountDisplay] = useState("$ 10,000");
  const [split, setSplit] = useState<SplitType>("even");
  const [tranches, setTranches] = useState<SimpleTranche[]>([]);
  const [guardrails, setGuardrails] = useState<GuardrailRow[]>([
    { id: 1, selectedAreas: [], selectedChanges: [], selectedThresholds: [], customText: "" },
  ]);
  const [memoState, setMemoState] = useState<MemoState>("idle");
  const [memo, setMemo] = useState<MemoData | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showRebalanced, setShowRebalanced] = useState(false);

  const prevConvictionRef = useRef<ConvictionLevel>(conviction);
  const rebalanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Remote data ────────────────────────────────────────────────────────────
  const { data: analysisData } = useQuery<{
    investmentThesis?: string;
    investmentThemes?: { name: string }[];
    moats?: { name: string }[];
  }>({
    queryKey: [`/api/analyze/${upperTicker}`],
    enabled: !!ticker,
  });
  const { data: timingData } = useQuery<TimingAnalysisResponse>({
    queryKey: [`/api/timing/${upperTicker}`],
    enabled: !!ticker,
  });
  const { data: valuationData } = useQuery<ValuationMetricsResponse>({
    queryKey: [`/api/valuation/${upperTicker}`],
    enabled: !!ticker,
  });

  // ── Derived recap metrics ──────────────────────────────────────────────────
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
    const signals = [timingData.trend?.signal, timingData.momentum?.signal, timingData.stretch?.signal].filter(Boolean);
    return { timingSupported: signals.filter(s => s?.status === "green").length, timingTotal: signals.length || 3 };
  }, [timingData]);

  const perfTone: "positive" | "mixed" | "negative" = performanceStrong === 4 ? "positive" : performanceStrong >= 2 ? "mixed" : "negative";
  const valTone: "positive" | "mixed" | "negative" = valuationSensible >= 3 ? "positive" : valuationSensible >= 2 ? "mixed" : "negative";
  const timingRatio = timingTotal > 0 ? timingSupported / timingTotal : 0;
  const timingTone: "positive" | "mixed" | "negative" = timingRatio >= 0.8 ? "positive" : timingRatio >= 0.4 ? "mixed" : "negative";
  const bizTone: "positive" | "mixed" | "negative" = "mixed";

  const perfLabel = performanceStrong === 4 ? "Strong" : performanceStrong >= 2 ? "Mixed" : "Weak";
  const valLabel = valuationSensible >= 3 ? "Sensible" : valuationSensible >= 2 ? "Mixed" : "Elevated";
  const timingLabel = timingRatio >= 0.8 ? "Supportive" : timingRatio >= 0.4 ? "Mixed" : "Challenging";

  const perfSummary = perfTone === "positive" ? "Financially strong across all four dimensions." : perfTone === "mixed" ? "Mixed financial signals across the scorecard." : "Financial picture shows weakness in most areas.";
  const valSummary = valTone === "positive" ? "All valuation signals look sensible." : valTone === "mixed" ? "Some valuation signals look reasonable, others warrant a closer look." : "Multiple valuation signals suggest elevated pricing.";
  const timSummary = timingTone === "positive" ? "Timing conditions are aligned and supportive." : timingTone === "mixed" ? "Mixed timing signals across trend, momentum, and stretch." : "Timing conditions are currently challenging.";

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ticker) return;
    const saved = localStorage.getItem(`strategyPlan2:${ticker}`);
    if (saved) {
      try {
        const plan: SavedStrategy = JSON.parse(saved);
        setConviction(plan.conviction || "interested");
        setTotalAmountRaw(plan.totalAmount || 10000);
        setAmountDisplay(`$ ${formatNumber(plan.totalAmount || 10000)}`);
        setSplit(plan.split || "even");
        if (plan.tranches?.length) setTranches(plan.tranches);
        if (plan.guardrails?.length) setGuardrails(plan.guardrails);
        if (plan.memo) { setMemo(plan.memo); setMemoState("done"); }
        return;
      } catch {}
    }
    // Legacy format migration
    const legacy = localStorage.getItem(`strategyPlan:${ticker}`);
    if (legacy) {
      try {
        const old = JSON.parse(legacy);
        const cv: number = old.convictionValue ?? 50;
        const nc: ConvictionLevel = cv <= 33 ? "exploring" : cv <= 66 ? "interested" : "high_conviction";
        setConviction(nc);
        const total = old.totalAmount || 10000;
        setTotalAmountRaw(total);
        setAmountDisplay(`$ ${formatNumber(total)}`);
        if (old.imWrongIf) {
          const parts = old.imWrongIf.split("\n").filter(Boolean);
          if (parts.length > 0) {
            setGuardrails(parts.map((p: string, i: number) => ({
              id: i + 1, selectedAreas: [], selectedChanges: [], selectedThresholds: [], customText: p,
            })));
          }
        }
      } catch {}
    }
  }, [ticker]);

  // ── Initialize tranches on conviction/total/split change ──────────────────
  useEffect(() => {
    const cfg = CONVICTION_CONFIGS[conviction];
    const convChanged = prevConvictionRef.current !== conviction;
    prevConvictionRef.current = conviction;

    const effectiveSplit = convChanged && split === "custom" ? "even" : split;
    if (convChanged && split === "custom") setSplit("even");

    if (split === "custom" && !convChanged) {
      setTranches(prev => buildTranches(totalAmountRaw, cfg.trancheCount, "custom", prev));
    } else {
      setTranches(buildTranches(totalAmountRaw, cfg.trancheCount, effectiveSplit));
    }
  }, [conviction, totalAmountRaw, split]);

  // ── Auto-save to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (!ticker || !tranches.length) return;
    const plan: SavedStrategy = { conviction, totalAmount: totalAmountRaw, split, tranches, guardrails, memo: memo ?? undefined, memoGenerated: memoState === "done" };
    localStorage.setItem(`strategyPlan2:${ticker}`, JSON.stringify(plan));
  }, [ticker, conviction, totalAmountRaw, split, tranches, guardrails, memo, memoState]);

  // ── Handlers: conviction ───────────────────────────────────────────────────
  const handleConviction = (c: ConvictionLevel) => {
    if (c === conviction) return;
    setConviction(c);
    setSplit("even");
  };

  // ── Handlers: total amount ────────────────────────────────────────────────
  const handleAmountInput = (raw: string) => {
    const digits = sanitizeToDigits(raw);
    const num = parseInt(digits, 10) || 0;
    setTotalAmountRaw(num || 10000);
    setAmountDisplay(digits ? `$ ${formatNumber(num)}` : "");
  };

  const handleAmountBlur = () => {
    if (!amountDisplay) setAmountDisplay(`$ ${formatNumber(totalAmountRaw)}`);
  };

  // ── Handlers: split ────────────────────────────────────────────────────────
  const handleSplitChange = (s: SplitType) => {
    setSplit(s);
    if (s !== "custom") {
      const cfg = CONVICTION_CONFIGS[conviction];
      setTranches(buildTranches(totalAmountRaw, cfg.trancheCount, s));
    }
  };

  // ── Tranche rebalancing helpers ────────────────────────────────────────────
  const triggerRebalanced = () => {
    if (rebalanceTimerRef.current) clearTimeout(rebalanceTimerRef.current);
    setShowRebalanced(true);
    rebalanceTimerRef.current = setTimeout(() => setShowRebalanced(false), 1500);
  };

  const applyEvenSplit = (list: SimpleTranche[], total: number): SimpleTranche[] => {
    if (!list.length) return list;
    const base = Math.floor(total / list.length);
    const remainder = total - base * list.length;
    return list.map((t, i) => ({
      ...t,
      amount: i === 0 ? base + remainder : base,
      amountDisplay: `$ ${formatNumber(i === 0 ? base + remainder : base)}`,
    }));
  };

  const applyRemainderSplit = (list: SimpleTranche[], editedId: number, editedAmount: number, total: number): SimpleTranche[] => {
    const others = list.filter(t => t.id !== editedId);
    if (!others.length) {
      return list.map(t => t.id === editedId ? { ...t, amount: total, amountDisplay: `$ ${formatNumber(total)}` } : t);
    }
    const remaining = Math.max(0, total - editedAmount);
    const base = Math.floor(remaining / others.length);
    const remainder = remaining - base * others.length;
    let firstOther = true;
    return list.map(t => {
      if (t.id === editedId) return { ...t, amount: editedAmount, amountDisplay: `$ ${formatNumber(editedAmount)}` };
      const amt = firstOther ? base + remainder : base;
      firstOther = false;
      return { ...t, amount: amt, amountDisplay: `$ ${formatNumber(amt)}` };
    });
  };

  // ── Handlers: tranches ─────────────────────────────────────────────────────
  const handleTrancheAmount = (id: number, raw: string) => {
    const digits = sanitizeToDigits(raw);
    const num = parseInt(digits, 10) || 0;
    setSplit("custom");
    setTranches(prev => prev.map(t =>
      t.id === id ? { ...t, amount: num, amountDisplay: digits ? `$ ${formatNumber(num)}` : "" } : t
    ));
  };

  const handleTrancheAmountBlur = (id: number) => {
    setTranches(prev => {
      const editedTranche = prev.find(t => t.id === id);
      if (!editedTranche) return prev;
      const clampedAmount = Math.min(editedTranche.amount, totalAmountRaw);
      const rebalanced = applyRemainderSplit(prev, id, clampedAmount, totalAmountRaw);
      triggerRebalanced();
      return rebalanced;
    });
  };

  const handleTrancheTiming = (id: number, timing: string) => {
    setTranches(prev => prev.map(t => t.id === id ? { ...t, timing } : t));
  };

  const handleTrancheCondition = (id: number, condition: string) => {
    setTranches(prev => prev.map(t => t.id === id ? { ...t, condition } : t));
  };

  const handleRemoveTranche = (id: number) => {
    setSplit("custom");
    setTranches(prev => {
      const remaining = prev.filter(t => t.id !== id).map((t, i) => ({ ...t, id: i + 1 }));
      if (!remaining.length) return prev;
      const rebalanced = applyEvenSplit(remaining, totalAmountRaw);
      triggerRebalanced();
      return rebalanced;
    });
  };

  const handleAddTranche = () => {
    setSplit("custom");
    setTranches(prev => {
      const withNew = [
        ...prev,
        { id: prev.length + 1, amount: 0, amountDisplay: "$ 0", timing: "30days", condition: "" },
      ];
      const rebalanced = applyEvenSplit(withNew, totalAmountRaw);
      triggerRebalanced();
      return rebalanced;
    });
  };

  // ── Handlers: guardrails ───────────────────────────────────────────────────
  const toggleGuardrailTag = (id: number, group: "areas" | "changes" | "thresholds", tag: string) => {
    setGuardrails(prev => prev.map(g => {
      if (g.id !== id) return g;
      const key = `selected${group.charAt(0).toUpperCase() + group.slice(1)}` as keyof GuardrailRow;
      const current = g[key] as string[];
      const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
      return { ...g, [key]: next };
    }));
  };

  const handleGuardrailCustomText = (id: number, text: string) => {
    setGuardrails(prev => prev.map(g => g.id === id ? { ...g, customText: text } : g));
  };

  const addGuardrail = () => {
    setGuardrails(prev => [
      ...prev,
      { id: prev.length + 1, selectedAreas: [], selectedChanges: [], selectedThresholds: [], customText: "" },
    ]);
  };

  const removeGuardrail = (id: number) => {
    setGuardrails(prev => {
      const next = prev.filter(g => g.id !== id);
      return next.length ? next.map((g, i) => ({ ...g, id: i + 1 })) : [{ id: 1, selectedAreas: [], selectedChanges: [], selectedThresholds: [], customText: "" }];
    });
  };

  // ── Handlers: memo ─────────────────────────────────────────────────────────
  const memoMutation = useMutation({
    mutationFn: async () => {
      const businessThesis = (analysisData?.investmentThesis || "").substring(0, 800);
      const strategicThemes = (analysisData?.investmentThemes || []).map(t => t.name);
      const competitiveMoats = (analysisData?.moats || []).map(m => m.name);
      const body = {
        businessThesis,
        strategicThemes,
        competitiveMoats,
        performanceScore: `${performanceStrong}/4 strong`,
        performanceSummary: perfSummary,
        valuationScore: `${valuationSensible}/4 sensible`,
        valuationSummary: valSummary,
        timingScore: `${timingSupported}/${timingTotal} supportive`,
        timingSummary: timSummary,
      };
      const res = await fetch(`/api/memo/${upperTicker}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate memo");
      }
      return res.json() as Promise<MemoData>;
    },
    onSuccess: (data) => {
      setMemo(data);
      setMemoState("done");
    },
    onError: (err: any) => {
      setMemoState("idle");
      toast({ title: "Couldn't generate memo", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  const handleGenerateMemo = () => {
    setMemoState("generating");
    memoMutation.mutate();
  };

  const handleMemoField = (field: keyof MemoData, value: string) => {
    setMemo(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  const imWrongIf = guardrails.map(buildGuardrailStatement).filter(Boolean).join("\n");

  const buildPlanForEmail = () => ({
    ticker: upperTicker,
    companyName,
    convictionValue: convictionLevelToOldValue(conviction),
    convictionLabel: CONVICTION_CONFIGS[conviction].label,
    trancheCount: tranches.length,
    totalAmount: totalAmountRaw,
    tranches: tranches.map(t => ({
      index: t.id,
      amount: t.amount,
      when: { type: t.timing === "now" ? "now" as const : "days" as const, days: t.timing === "30days" ? 30 : t.timing === "60days" ? 60 : undefined },
      gate: { type: "none" as const },
      gateEnabled: false,
      manual: false,
    })),
    imWrongIf,
    snapshot: {
      fundamentals: fundamentalsScore || "---",
      valuation: `${valuationSensible}/4 sensible`,
      timing: `${timingSupported}/${timingTotal} supportive`,
    },
    takeawayTexts: {
      performance: `${performanceStrong}/4 strong`,
      valuation: `${valuationSensible}/4 sensible`,
      timing: `${timingSupported}/${timingTotal} supportive`,
    },
    memo,
    createdAt: new Date().toISOString(),
  });

  const emailMutation = useMutation({
    mutationFn: async (data: { email: string; plan: ReturnType<typeof buildPlanForEmail> }) => {
      const response = await apiRequest("POST", "/api/strategy-email", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.isNewLead) {
        import("@/lib/analytics").then(({ analytics }) => {
          analytics.trackNewLead({ lead_source: "strategy_email", ticker: ticker || undefined, stage: 5, company_name: companyName });
        });
      }
      toast({ title: "Email sent", description: "Your strategy plan has been emailed to you." });
      setEmailModalOpen(false);
      setEmailAddress("");
    },
    onError: () => {
      toast({ title: "Failed to send email", description: "Please try again later.", variant: "destructive" });
    },
  });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailSubmit = () => {
    setEmailError("");
    if (!emailAddress.trim()) { setEmailError("Please enter your email address"); return; }
    if (!validateEmail(emailAddress)) { setEmailError("Please enter a valid email address"); return; }
    emailMutation.mutate({ email: emailAddress.trim(), plan: buildPlanForEmail() });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto" data-testid="strategy-stage">
      {/* ── Page header ── */}
      <div className="mb-8">
        <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--lp-teal-deep)" }}>
          Stage 5 of 6 · Strategy
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold" style={{ color: "var(--lp-ink)", fontFamily: "'Playfair Display', serif" }}>
          You've done the research. <em>Now make a plan.</em>
        </h1>
        <p className="mt-2 text-base" style={{ color: "var(--lp-ink-mid)" }}>
          Turn your research into a structured, personally owned investment decision.
        </p>
      </div>

      {/* ── Research recap ── */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--lp-ink-ghost)" }}>What you learned</span>
        <div className="flex-1 h-px" style={{ background: "var(--lp-border)" }} />
      </div>
      <div className="rounded-md border overflow-hidden mb-2">
        <CardMacHeader label="Research Recap" ticker={upperTicker} />
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: "var(--lp-border)" }}>
          {[
            { label: "Performance", verdict: `${perfLabel}`, sub: `${performanceStrong}/4 financials`, tone: perfTone, Icon: BarChart3, stage: 2 },
            { label: "Valuation", verdict: valLabel, sub: `${valuationSensible}/4 sensible`, tone: valTone, Icon: DollarSign, stage: 3 },
            { label: "Timing", verdict: timingLabel, sub: `${timingSupported}/${timingTotal} supportive`, tone: timingTone, Icon: Activity, stage: 4 },
            { label: "Business", verdict: "Qualitative", sub: "Business overview", tone: bizTone, Icon: Building2, stage: 1 },
          ].map(({ label, verdict, sub, tone, Icon, stage }) => (
            <button
              key={label}
              type="button"
              onClick={() => onStageChange?.(stage)}
              className="p-4 text-left hover-elevate group transition-colors"
              data-testid={`recap-${label.toLowerCase()}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <StatusDot tone={tone} />
                <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--lp-ink-ghost)" }}>{label}</span>
              </div>
              <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--lp-ink)" }}>{verdict}</div>
              <div className="text-xs" style={{ color: "var(--lp-ink-mid)" }}>{sub}</div>
              <div className="mt-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--lp-teal-deep)" }}>
                View details →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: Conviction ── */}
      <SectionRow num={1} title="How convicted are you?" sub="This shapes how much you allocate and how you enter" />

      <div className="rounded-md border overflow-hidden">
        <CardMacHeader label="Conviction Level" ticker={upperTicker} badge="Select one" />
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["exploring", "interested", "high_conviction"] as ConvictionLevel[]).map(level => {
              const cfg = CONVICTION_CONFIGS[level];
              const selected = conviction === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleConviction(level)}
                  className={cn(
                    "p-4 rounded-md border-2 text-left transition-all cursor-pointer",
                    selected ? "border-transparent" : "border-border hover-elevate",
                  )}
                  style={selected ? { background: "var(--lp-teal-deep)", borderColor: "var(--lp-teal-deep)" } : {}}
                  data-testid={`conviction-${level}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm font-semibold", selected ? "text-white" : "")} style={!selected ? { color: "var(--lp-ink)" } : {}}>{cfg.label}</span>
                    {selected && (
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <p className={cn("text-xs leading-relaxed", selected ? "text-white/80" : "text-muted-foreground")}>{cfg.desc}</p>
                </button>
              );
            })}
          </div>
          <div
            className="rounded-md p-3 text-sm"
            style={{ background: "var(--lp-teal-ghost, rgba(13,74,71,0.06))", color: "var(--lp-ink)" }}
          >
            <strong className="font-semibold">{CONVICTION_CONFIGS[conviction].label}</strong>
            {" — "}
            {CONVICTION_CONFIGS[conviction].insight}
          </div>
        </div>
      </div>

      {/* ── Section 3: Entry Plan ── */}
      <SectionRow num={3} title="Build your entry plan" sub="How much, when, and under what conditions" />

      <div className="rounded-md border overflow-hidden">
        <CardMacHeader
          label="Entry Plan"
          ticker={upperTicker}
          badge={`${tranches.length} tranche${tranches.length !== 1 ? "s" : ""} · ${formatCurrency(totalAmountRaw)}`}
        />
        <div className="p-4 space-y-4">
          <p className="text-sm" style={{ color: "var(--lp-ink-mid)" }}>
            Based on your <strong className="font-semibold" style={{ color: "var(--lp-ink)" }}>{CONVICTION_CONFIGS[conviction].label}</strong> conviction level, we suggest {CONVICTION_CONFIGS[conviction].trancheCount} tranche{CONVICTION_CONFIGS[conviction].trancheCount !== 1 ? "s" : ""}. Adjust the amounts and timing to fit your situation.
          </p>

          {/* Controls row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: "var(--lp-ink-mid)" }}>Total amount</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={(e) => handleAmountInput(e.target.value)}
                onBlur={handleAmountBlur}
                className="text-sm"
                data-testid="input-amount"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: "var(--lp-ink-mid)" }}>Split</Label>
              <Select value={split} onValueChange={(v) => handleSplitChange(v as SplitType)}>
                <SelectTrigger className="text-sm" data-testid="select-split">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="even">Even split</SelectItem>
                  <SelectItem value="front_loaded">Front-loaded</SelectItem>
                  <SelectItem value="back_loaded">Back-loaded</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tranche table */}
          <div className="rounded-md border overflow-hidden" style={{ borderColor: "var(--lp-border)" }}>
            <div
              className="grid gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                gridTemplateColumns: "24px 1fr 1fr 1fr 28px",
                color: "var(--lp-ink-ghost)",
                borderBottom: "1px solid var(--lp-border)",
                background: "var(--lp-warm-white)",
              }}
            >
              <div />
              <div>Amount</div>
              <div>Timing</div>
              <div>Condition</div>
              <div />
            </div>

            {tranches.map(t => (
              <div
                key={t.id}
                className="grid gap-2 px-3 py-2.5 items-center"
                style={{
                  gridTemplateColumns: "24px 1fr 1fr 1fr 28px",
                  borderBottom: "1px solid var(--lp-border)",
                }}
                data-testid={`tranche-row-${t.id}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: "var(--lp-teal-pale, rgba(13,74,71,0.12))", color: "var(--lp-teal-deep)" }}
                >
                  {t.id}
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={t.amountDisplay}
                  onChange={(e) => handleTrancheAmount(t.id, e.target.value)}
                  onBlur={() => handleTrancheAmountBlur(t.id)}
                  className="text-sm h-8"
                  data-testid={`input-tranche-amount-${t.id}`}
                />
                <Select value={t.timing} onValueChange={(v) => handleTrancheTiming(t.id, v)}>
                  <SelectTrigger className="text-xs h-8" data-testid={`select-timing-${t.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMING_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={t.condition}
                  onChange={(e) => handleTrancheCondition(t.id, e.target.value)}
                  placeholder="no condition"
                  className="text-xs h-8 placeholder:text-muted-foreground/50"
                  data-testid={`input-tranche-condition-${t.id}`}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTranche(t.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-remove-tranche-${t.id}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--lp-border)" }}>
              <button
                type="button"
                onClick={handleAddTranche}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-add-tranche"
              >
                <Plus className="w-3.5 h-3.5" /> Add tranche
              </button>
              <span
                className={cn("text-xs transition-opacity duration-500", showRebalanced ? "opacity-100" : "opacity-0")}
                style={{ color: "var(--lp-teal-deep)" }}
                data-testid="indicator-rebalanced"
              >
                ↻ Recalculated
              </span>
            </div>

            <div className="px-3 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold" style={{ color: "var(--lp-ink-mid)" }}>Total allocated</div>
                <div className="text-xs" style={{ color: "var(--lp-ink-ghost)" }}>
                  {tranches.length} tranche{tranches.length !== 1 ? "s" : ""}
                  {tranches.some(t => t.timing === "30days") || tranches.some(t => t.timing === "60days") ? " · over ~60 days" : ""}
                </div>
              </div>
              <div className="text-base font-semibold" style={{ color: "var(--lp-ink)" }}>{formatCurrency(totalAmountRaw)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Investment Memo ── */}
      <SectionRow num={4} title="Write your thesis" sub="Pre-filled from your research — edit to make it yours" />

      <div className="rounded-md border overflow-hidden">
        <CardMacHeader label="Investment Memo" ticker={upperTicker} badge={memoState === "done" ? "Editable" : "AI-generated"} />
        <div className="p-4 space-y-0">
          {memoState === "idle" && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <Sparkles className="w-8 h-8" style={{ color: "var(--lp-teal-deep)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--lp-ink)" }}>Generate your investment memo</p>
                <p className="text-xs mt-1" style={{ color: "var(--lp-ink-mid)" }}>We'll use your research to pre-fill the key fields — you can edit them after.</p>
              </div>
              <Button onClick={handleGenerateMemo} data-testid="button-generate-memo">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate memo
              </Button>
            </div>
          )}

          {memoState === "generating" && (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--lp-teal-deep)" }} />
              <p className="text-sm" style={{ color: "var(--lp-ink-mid)" }}>Generating your investment memo...</p>
            </div>
          )}

          {memoState === "done" && memo && (
            <div className="divide-y" style={{ borderColor: "var(--lp-border)" }}>
              {[
                { key: "why_own" as const, icon: "📋", label: "Why I own this", rows: 3 },
                { key: "time_horizon" as const, icon: "⏳", label: "My time horizon", rows: 2 },
                { key: "watching" as const, icon: "⚠️", label: "What I'm watching", rows: 3 },
              ].map(({ key, icon, label, rows }) => (
                <div key={key} className="py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base" role="img" aria-label={label}>{icon}</span>
                    <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--lp-ink-mid)" }}>{label}</span>
                  </div>
                  <Textarea
                    value={memo[key]}
                    onChange={(e) => handleMemoField(key, e.target.value)}
                    rows={rows}
                    className="resize-none text-sm border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                    style={{ color: "var(--lp-ink)" }}
                    data-testid={`memo-${key}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Guardrails ── */}
      <SectionRow num={5} title="Define your guardrails" sub="What would make you reconsider or exit?" />

      <div className="rounded-md border overflow-hidden">
        <CardMacHeader
          label="I'm Wrong If..."
          ticker={upperTicker}
          badge={`${guardrails.filter(g => buildGuardrailStatement(g)).length} guardrail${guardrails.filter(g => buildGuardrailStatement(g)).length !== 1 ? "s" : ""} set`}
        />
        <div className="p-4 space-y-4">
          <p className="text-sm" style={{ color: "var(--lp-ink-mid)" }}>
            Decide now what would change your mind — before emotion gets involved. These become your exit rules.
          </p>

          {guardrails.map((row, idx) => (
            <div key={row.id} className="rounded-md border p-4 space-y-3" style={{ borderColor: "var(--lp-border)" }} data-testid={`guardrail-row-${row.id}`}>
              <div className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5"
                  style={{ background: "var(--lp-teal-deep)", color: "white" }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lp-ink-ghost)" }}>
                    I'm wrong if...
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: "var(--lp-ink-mid)" }}>Area</div>
                    <div className="flex flex-wrap gap-1.5">
                      {GUARDRAIL_AREAS.map(a => (
                        <TagChip
                          key={a} label={a}
                          selected={row.selectedAreas.includes(a)}
                          onClick={() => toggleGuardrailTag(row.id, "areas", a)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: "var(--lp-ink-mid)" }}>Change</div>
                    <div className="flex flex-wrap gap-1.5">
                      {GUARDRAIL_CHANGES.map(c => (
                        <TagChip
                          key={c} label={c}
                          selected={row.selectedChanges.includes(c)}
                          onClick={() => toggleGuardrailTag(row.id, "changes", c)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: "var(--lp-ink-mid)" }}>Threshold</div>
                    <div className="flex flex-wrap gap-1.5">
                      {GUARDRAIL_THRESHOLDS.map(t => (
                        <TagChip
                          key={t} label={t}
                          selected={row.selectedThresholds.includes(t)}
                          onClick={() => toggleGuardrailTag(row.id, "thresholds", t)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs mb-1.5" style={{ color: "var(--lp-ink-mid)" }}>Or type your own:</div>
                    <Input
                      value={row.customText}
                      onChange={(e) => handleGuardrailCustomText(row.id, e.target.value)}
                      placeholder="e.g. AMD gains meaningful share in data center GPU market..."
                      className="text-sm"
                      data-testid={`guardrail-input-${row.id}`}
                    />
                  </div>
                </div>

                {guardrails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuardrail(row.id)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    data-testid={`button-remove-guardrail-${row.id}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addGuardrail} className="gap-1.5" data-testid="button-add-guardrail">
            <Plus className="w-3.5 h-3.5" />
            Add another guardrail
          </Button>
        </div>
      </div>

      {/* ── Export banner ── */}
      <div
        className="mt-8 rounded-md p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
        style={{ background: "var(--lp-teal-deep)" }}
        data-testid="export-banner"
      >
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-1">Your plan is ready</div>
          <div className="text-xl font-serif font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Save it. <em>Don't forget it.</em>
          </div>
          <div className="text-sm text-white/70 mt-1">Email yourself the full memo + entry plan so you have it when you're ready to act.</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Button
            onClick={() => setEmailModalOpen(true)}
            className="bg-white hover:bg-white/90 text-sm font-semibold"
            style={{ color: "var(--lp-teal-deep)" }}
            data-testid="button-email-strategy"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email me this plan
          </Button>
          <Button
            variant="outline"
            onClick={() => onStageChange?.(6)}
            className="border-white/40 text-white hover:bg-white/10 text-sm"
            data-testid="button-continue-protection"
          >
            Continue to Protection
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-xs text-center mt-4" style={{ color: "var(--lp-ink-ghost)" }}>
        This is a planning tool, not investment advice. Always do your own research.
      </p>

      {/* ── Email modal ── */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email your strategy plan</DialogTitle>
            <DialogDescription>
              We'll send a copy of your {upperTicker} strategy to your inbox.
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
