import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { addWeeks, addMonths, format } from "date-fns";
import {
  TrendingUp, BarChart3, Activity, Shield, Plus, X,
  ChevronLeft, Mail, Calendar, Loader2, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface ManageStageProps {
  ticker?: string;
  companyName?: string;
  fundamentalsScore?: string;
  onStageChange?: (stage: number) => void;
}

interface PositionRule {
  id: number;
  type: "add" | "trim" | "exit" | "custom";
  text: string;
}

interface MonitorSignal {
  id: string;
  label: string;
  stage: string;
  status: "green" | "amber" | "red";
  statusLabel: string;
  Icon: typeof TrendingUp;
  description: string;
}

type Cadence = "weekly" | "monthly" | "quarterly" | "trigger";

interface TimingAnalysis {
  trend?: { signal?: { status?: string } };
  momentum?: { signal?: { status?: string } };
  stretch?: { signal?: { status?: string } };
}

interface ValuationItem {
  id: string;
  strength: "sensible" | "caution" | "risky";
  verdict: string;
}

interface ValuationResponse {
  quadrants?: ValuationItem[];
}

interface AnalysisResponse {
  moats?: { name: string; emphasis?: number }[];
  investmentThesis?: string;
}

interface WatchlistCheckResponse {
  saved: boolean;
  item?: { id: string; snapshotHistory?: any[] } | null;
}

// ── Sub-components ──────────────────────────────────────────────────────────

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
      <span className="text-xs font-medium text-white/80">{label} — {ticker}</span>
      {badge && (
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full border border-white/15"
          style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid="toggle-position"
      className="relative flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        width: 40, height: 22,
        background: on ? "var(--lp-teal-brand)" : "var(--lp-border)",
      }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{
          width: 18, height: 18,
          left: on ? 20 : 2,
        }}
      />
    </button>
  );
}

// ── Signal status helpers ───────────────────────────────────────────────────

function statusClasses(status: "green" | "amber" | "red") {
  if (status === "green") return { bg: "bg-green-50", icon: "bg-green-100", badge: "bg-green-100 text-green-700" };
  if (status === "amber") return { bg: "bg-amber-50", icon: "bg-amber-100", badge: "bg-amber-100 text-amber-700" };
  return { bg: "bg-red-50", icon: "bg-red-100", badge: "bg-red-100 text-red-700" };
}

// ── Main component ──────────────────────────────────────────────────────────

export function ManageStage({ ticker, companyName, fundamentalsScore, onStageChange }: ManageStageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const upperTicker = ticker?.toUpperCase() ?? "";

  // ── State ─────────────────────────────────────────────────────────────────

  const [positionOn, setPositionOn] = useState(false);
  const [entryPrice, setEntryPrice] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [sharesAmount, setSharesAmount] = useState("");

  const [cadence, setCadence] = useState<Cadence | null>(null);

  const [emailDelivery, setEmailDelivery] = useState(false);
  const [calendarDelivery, setCalendarDelivery] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [futureMessage, setFutureMessage] = useState("");

  const [positionRules, setPositionRules] = useState<PositionRule[]>([
    { id: 1, type: "add", text: "" },
    { id: 2, type: "trim", text: "" },
    { id: 3, type: "exit", text: "" },
  ]);
  const [nextRuleId, setNextRuleId] = useState(4);

  const [activateSuccess, setActivateSuccess] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: analysisData } = useQuery<AnalysisResponse>({
    queryKey: [`/api/analyze/${upperTicker}`],
    enabled: !!upperTicker,
  });

  const { data: valuationData } = useQuery<ValuationResponse>({
    queryKey: [`/api/valuation/${upperTicker}`],
    enabled: !!upperTicker,
  });

  const { data: timingData } = useQuery<TimingAnalysis>({
    queryKey: [`/api/timing/${upperTicker}`],
    enabled: !!upperTicker,
  });

  const { data: watchlistCheck } = useQuery<WatchlistCheckResponse>({
    queryKey: ["/api/watchlist/check", upperTicker],
    enabled: !!upperTicker && isAuthenticated,
  });

  // ── Load guardrails from localStorage ────────────────────────────────────

  useEffect(() => {
    if (!upperTicker) return;
    try {
      const saved = localStorage.getItem(`strategyPlan2:${upperTicker}`);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      const guardrails: any[] = parsed.guardrails || [];
      const exitTexts = guardrails
        .map((g: any) => g.customText || "")
        .filter(Boolean);

      if (exitTexts.length > 0) {
        const rules: PositionRule[] = [
          { id: 1, type: "add", text: "" },
          { id: 2, type: "trim", text: "" },
        ];
        exitTexts.forEach((text, i) => {
          rules.push({ id: 3 + i, type: "exit", text });
        });
        setPositionRules(rules);
        setNextRuleId(3 + exitTexts.length);
      }
    } catch {}
  }, [upperTicker]);

  // ── Monitor signals ───────────────────────────────────────────────────────

  const monitorSignals = useMemo<MonitorSignal[]>(() => {
    const signals: MonitorSignal[] = [];

    // Signal 1: Performance
    if (fundamentalsScore) {
      const match = fundamentalsScore.match(/(\d+)\/(\d+)/);
      const strongCount = match ? parseInt(match[1]) : 0;
      const total = match ? parseInt(match[2]) : 4;
      const weakCount = total - strongCount;
      const status: "green" | "amber" | "red" =
        strongCount === total ? "green" : strongCount >= 2 ? "amber" : "red";
      signals.push({
        id: "performance",
        label: "Financial Performance",
        stage: "Performance",
        status,
        statusLabel: status === "green" ? "On track" : status === "amber" ? "Watch" : "Alert",
        Icon: TrendingUp,
        description:
          `Growing revenue and earnings across ${strongCount} of ${total} dimensions.` +
          (weakCount > 0
            ? ` ${weakCount} dimension${weakCount > 1 ? "s" : ""} flagged as weak.`
            : " All dimensions healthy."),
      });
    }

    // Signal 2: Valuation
    const quadrants = valuationData?.quadrants ?? [];
    if (quadrants.length > 0) {
      const sensibleCount = quadrants.filter((q) => q.strength === "sensible").length;
      const total = quadrants.length;
      const stretchedCount = total - sensibleCount;
      const status: "green" | "amber" | "red" =
        sensibleCount >= 3 ? "green" : sensibleCount >= 2 ? "amber" : "red";
      signals.push({
        id: "valuation",
        label: "Valuation",
        stage: "Valuation",
        status,
        statusLabel: status === "green" ? "On track" : status === "amber" ? "Watch" : "Alert",
        Icon: BarChart3,
        description:
          `${sensibleCount} of ${total} valuation signals look sensible.` +
          (stretchedCount > 0
            ? ` ${stretchedCount} signal${stretchedCount > 1 ? "s" : ""} warrant a closer look.`
            : " Valuation looks well-grounded."),
      });
    }

    // Signal 3: Timing
    if (timingData) {
      const timingStatuses = [
        timingData.trend?.signal?.status,
        timingData.momentum?.signal?.status,
        timingData.stretch?.signal?.status,
      ].filter(Boolean);
      const greenCount = timingStatuses.filter((s) => s === "green").length;
      const status: "green" | "amber" | "red" =
        greenCount === 3 ? "green" : greenCount >= 1 ? "amber" : "red";
      const suggestion =
        greenCount < 2
          ? "patience before entry"
          : greenCount === 2
          ? "conditions are improving"
          : "conditions are favorable";
      signals.push({
        id: "timing",
        label: "Technical Conditions",
        stage: "Timing",
        status,
        statusLabel: status === "green" ? "Favorable" : status === "amber" ? "Mixed" : "Weak",
        Icon: Activity,
        description: `${greenCount} of 3 timing signals are supportive. Current conditions suggest ${suggestion}.`,
      });
    }

    // Signal 4: Business moats
    const moats = analysisData?.moats ?? [];
    const moatCount = moats.length;
    const status: "green" | "amber" | "red" =
      moatCount >= 3 ? "green" : moatCount >= 1 ? "amber" : "red";
    const top2 = moats.slice(0, 2).map((m) => m.name);
    const topMoat = top2[0] ?? "core competitive advantage";
    const moatDesc =
      top2.length >= 2
        ? `Moat supported by ${top2[0]} and ${top2[1]}. Watch for any shift in ${topMoat} strength.`
        : top2.length === 1
        ? `Moat supported by ${top2[0]}. Watch for any shift in ${topMoat} strength.`
        : "Business quality metrics from your research. Monitor for any strategic shifts.";
    signals.push({
      id: "business",
      label: "Competitive Moat",
      stage: "Business",
      status,
      statusLabel: status === "green" ? "Strong" : status === "amber" ? "Moderate" : "Weak",
      Icon: Shield,
      description: moatDesc,
    });

    return signals;
  }, [fundamentalsScore, valuationData, timingData, analysisData]);

  // ── Next check-in date ────────────────────────────────────────────────────

  const nextCheckinDate = useMemo(() => {
    if (!cadence || cadence === "trigger") return null;
    const today = new Date();
    if (cadence === "weekly") return addWeeks(today, 1);
    if (cadence === "monthly") return addMonths(today, 1);
    if (cadence === "quarterly") return addMonths(today, 3);
    return null;
  }, [cadence]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const activateMutation = useMutation({
    mutationFn: async () => {
      const snapshotManage = {
        cadence: cadence ?? undefined,
        nextCheckinDate: nextCheckinDate?.toISOString(),
        monitorSignals: monitorSignals.map((s) => ({
          label: s.label,
          stage: s.stage,
          status: s.status,
          description: s.description,
        })),
        positionRules: positionRules.map((r) => ({ type: r.type, text: r.text })),
        positionOn,
        positionNote: positionOn
          ? { entryPrice, entryDate, sharesAmount }
          : undefined,
        messageToFutureSelf: futureMessage || undefined,
      };

      let alreadySaved = false;

      if (isAuthenticated) {
        const existingId = watchlistCheck?.item?.id;
        alreadySaved = !!watchlistCheck?.saved;

        if (existingId) {
          await apiRequest("PATCH", `/api/watchlist/${existingId}/snapshot`, {
            snapshot: { manage: snapshotManage },
          });
        } else {
          await apiRequest("POST", "/api/watchlist", {
            ticker: upperTicker,
            companyName: companyName ?? upperTicker,
            snapshot: { manage: snapshotManage },
          });
        }

        queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", upperTicker] });
        queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      }

      if (emailDelivery && emailAddress && cadence && cadence !== "trigger") {
        await apiRequest("POST", "/api/scheduled-checkups", {
          email: emailAddress,
          ticker: upperTicker,
          selectedCheckins: [cadence],
          customMessage: futureMessage || undefined,
          reminderDates: nextCheckinDate
            ? [{ type: cadence, date: nextCheckinDate.toISOString() }]
            : [],
        });
      }

      return { alreadySaved };
    },
    onSuccess: ({ alreadySaved }) => {
      const cadenceLabel =
        cadence === "weekly" ? "weekly"
        : cadence === "monthly" ? "monthly"
        : cadence === "quarterly" ? "quarterly"
        : cadence === "trigger" ? "trigger-based"
        : "regular";
      const verb = alreadySaved ? "updated in" : "added to";
      setActivateSuccess(
        `${upperTicker} ${verb} your watchlist with a ${cadenceLabel} check-in.`
      );
      toast({
        title: "Plan activated",
        description: `${upperTicker} ${verb} your watchlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Activation failed",
        description: "Could not save your plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ── Rule helpers ──────────────────────────────────────────────────────────

  const addCustomRule = () => {
    setPositionRules((prev) => [...prev, { id: nextRuleId, type: "custom", text: "" }]);
    setNextRuleId((n) => n + 1);
  };

  const removeRule = (id: number) => {
    setPositionRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: number, text: string) => {
    setPositionRules((prev) => prev.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  // ── Cadence options ───────────────────────────────────────────────────────

  const CADENCE_OPTIONS: { value: Cadence; label: string; desc: string }[] = [
    { value: "weekly", label: "Weekly", desc: "Active monitoring. Good for new positions or volatile periods." },
    { value: "monthly", label: "Monthly", desc: "Balanced. Enough to catch changes without over-reacting." },
    { value: "quarterly", label: "Quarterly", desc: "Aligned with earnings. Good for high-conviction long-term holds." },
    { value: "trigger", label: "On trigger", desc: "Only check when a guardrail condition is met." },
  ];

  // ── Derived helpers ───────────────────────────────────────────────────────

  const alertCount = monitorSignals.filter((s) => s.status === "red").length;
  const watchCount = monitorSignals.filter((s) => s.status === "amber").length;
  const needsAttentionCount = alertCount + watchCount;

  const deliverySectionNum = positionOn ? 4 : 3;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">

      {/* PAGE HEADER */}
      <div className="mb-7">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: "var(--lp-teal-brand)", letterSpacing: "0.12em" }}
        >
          Stage 6 of 6 · Manage
        </div>
        <h1
          className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold mb-2 leading-tight"
          style={{ color: "var(--lp-ink)" }}
        >
          Stay honest{" "}
          <em style={{ fontStyle: "italic", color: "var(--lp-teal-brand)" }}>
            with yourself.
          </em>
        </h1>
        <p className="text-sm font-light max-w-xl leading-relaxed" style={{ color: "var(--lp-ink-light)" }}>
          The research is done. Now build the habit of checking in — so you act on facts, not feelings.
          Works whether you own this stock yet or not.
        </p>
      </div>

      {/* POSITION TOGGLE */}
      <div
        className="flex items-center justify-between p-4 mb-5 rounded-lg border bg-card shadow-sm cursor-pointer"
        style={{ borderColor: "var(--lp-border)" }}
        onClick={() => setPositionOn((v) => !v)}
        data-testid="position-toggle-card"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--lp-teal-ghost)" }}
          >
            <MapPin className="w-4 h-4" style={{ color: "var(--lp-teal-brand)" }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--lp-ink)" }}>
              I&apos;ve entered this position
            </div>
            <div className="text-xs font-light" style={{ color: "var(--lp-ink-ghost)" }}>
              Turn on to log your entry and unlock position management
            </div>
          </div>
        </div>
        <ToggleSwitch on={positionOn} onToggle={() => setPositionOn((v) => !v)} />
      </div>

      {/* POSITION ENTRY PANEL */}
      {positionOn && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 mb-5 rounded-lg border"
          style={{ background: "var(--lp-teal-ghost)", borderColor: "var(--lp-border)" }}
          data-testid="position-entry-panel"
        >
          {[
            { label: "Entry price", value: entryPrice, setter: setEntryPrice, placeholder: "$ 0.00", testId: "input-entry-price" },
            { label: "Entry date", value: entryDate, setter: setEntryDate, placeholder: "e.g. March 10, 2026", testId: "input-entry-date" },
            { label: "Shares / amount", value: sharesAmount, setter: setSharesAmount, placeholder: "e.g. 10 shares or $1,500", testId: "input-shares-amount" },
          ].map(({ label, value, setter, placeholder, testId }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium tracking-wider uppercase"
                style={{ color: "var(--lp-ink-ghost)", letterSpacing: "0.08em" }}
              >
                {label}
              </label>
              <Input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="bg-card text-sm font-medium"
                style={{ borderColor: "var(--lp-border)", color: "var(--lp-ink)" }}
                data-testid={testId}
              />
            </div>
          ))}
        </div>
      )}

      {/* SECTION 1: WHAT TO WATCH */}
      <SectionRow
        num={1}
        title="What to watch"
        sub="Signals pulled from your research — the ones that matter most"
      />

      <div
        className="rounded-md border overflow-hidden mb-4 shadow-sm"
        style={{ borderColor: "var(--lp-border)" }}
      >
        <CardMacHeader
          label="Monitor List"
          ticker={upperTicker}
          badge={
            monitorSignals.length > 0
              ? `${monitorSignals.length} signals${needsAttentionCount > 0 ? ` · ${needsAttentionCount} need${needsAttentionCount === 1 ? "s" : ""} attention` : ""}`
              : "Loading…"
          }
        />
        <div className="p-4 flex flex-col gap-2.5 bg-card">
          {monitorSignals.map((signal) => {
            const cls = statusClasses(signal.status);
            return (
              <div
                key={signal.id}
                className={cn("flex items-start gap-3 p-3 rounded-lg border", cls.bg)}
                style={{ borderColor: "var(--lp-border)" }}
                data-testid={`monitor-signal-${signal.id}`}
              >
                <div
                  className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", cls.icon)}
                >
                  <signal.Icon className="w-3.5 h-3.5" style={{ opacity: 0.8 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--lp-ink)" }}>
                      {signal.label}
                    </span>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: "var(--lp-border)", color: "var(--lp-ink-ghost)", letterSpacing: "0.06em" }}
                    >
                      {signal.stage}
                    </span>
                  </div>
                  <p className="text-xs font-light leading-relaxed" style={{ color: "var(--lp-ink-light)" }}>
                    {signal.description}
                  </p>
                </div>
                <span
                  className={cn("text-xs font-medium px-2 py-1 rounded flex-shrink-0 mt-0.5", cls.badge)}
                  data-testid={`signal-status-${signal.id}`}
                >
                  {signal.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: REVIEW CADENCE */}
      <SectionRow
        num={2}
        title="How often will you check in?"
        sub="Pick a cadence that fits how you invest"
      />

      <div
        className="rounded-md border overflow-hidden mb-4 shadow-sm"
        style={{ borderColor: "var(--lp-border)" }}
      >
        <CardMacHeader label="Review Cadence" ticker={upperTicker} badge="Select one" />
        <div className="p-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {CADENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCadence(opt.value)}
                data-testid={`cadence-${opt.value}`}
                className={cn(
                  "flex flex-col items-center text-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                  cadence === opt.value
                    ? "border-[color:var(--lp-teal-brand)]"
                    : "border-border"
                )}
                style={
                  cadence === opt.value
                    ? { background: "var(--lp-teal-ghost)" }
                    : { background: "var(--lp-warm-white)" }
                }
              >
                <span className="text-xs font-semibold mb-1" style={{ color: "var(--lp-ink)" }}>
                  {opt.label}
                </span>
                <span className="text-[10px] font-light leading-tight" style={{ color: "var(--lp-ink-ghost)" }}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>

          {cadence && (
            <div
              className="text-xs font-light px-3 py-2.5 rounded-md border"
              style={{ background: "var(--lp-cream)", borderColor: "var(--lp-border)", color: "var(--lp-ink-light)" }}
              data-testid="next-checkin-date"
            >
              {cadence === "trigger" ? (
                <>
                  <span style={{ color: "var(--lp-ink-mid)" }}>On trigger </span>
                  — You&apos;ll check in manually when a guardrail condition is met. No scheduled reminder will be sent.
                </>
              ) : nextCheckinDate ? (
                <>
                  Next check-in:{" "}
                  <strong style={{ color: "var(--lp-ink)", fontWeight: 500 }}>
                    {format(nextCheckinDate, "MMMM d, yyyy")}
                  </strong>
                  {" "}· We&apos;ll remind you at your chosen cadence.
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 (conditional): POSITION RULES */}
      {positionOn && (
        <div data-testid="position-rules-section">
          <SectionRow
            num={3}
            title="Position rules"
            sub="When will you add, trim, or exit?"
          />

          <div
            className="rounded-md border overflow-hidden mb-4 shadow-sm"
            style={{ borderColor: "var(--lp-border)" }}
          >
            <CardMacHeader
              label="Position Rules"
              ticker={upperTicker}
              badge="Pulled from your guardrails"
            />
            <div className="p-4 bg-card flex flex-col gap-2">
              {positionRules.map((rule) => {
                const isAdd = rule.type === "add";
                const isTrim = rule.type === "trim";
                const isExit = rule.type === "exit";
                const rowBg = isAdd
                  ? "rgba(22,163,74,0.06)"
                  : isTrim
                  ? "rgba(201,168,76,0.06)"
                  : isExit
                  ? "rgba(220,38,38,0.05)"
                  : "transparent";
                const rowBorder = isAdd
                  ? "rgba(22,163,74,0.15)"
                  : isTrim
                  ? "rgba(201,168,76,0.15)"
                  : isExit
                  ? "rgba(220,38,38,0.1)"
                  : "var(--lp-border)";
                const badgeCls = isAdd
                  ? "bg-green-100 text-green-700"
                  : isTrim
                  ? "bg-amber-100 text-amber-700"
                  : isExit
                  ? "bg-red-100 text-red-700"
                  : "bg-muted text-muted-foreground";
                const badgeLabel = isAdd ? "Add" : isTrim ? "Trim" : isExit ? "Exit" : "Rule";
                const placeholder = isAdd
                  ? "I'll add more if..."
                  : isTrim
                  ? "I'll trim if..."
                  : isExit
                  ? "I'll exit if..."
                  : "Rule condition...";

                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border"
                    style={{ background: rowBg, borderColor: rowBorder }}
                    data-testid={`rule-row-${rule.id}`}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0",
                        badgeCls
                      )}
                      style={{ letterSpacing: "0.08em" }}
                    >
                      {badgeLabel}
                    </span>
                    <Input
                      value={rule.text}
                      onChange={(e) => updateRule(rule.id, e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 h-8 text-xs border-0 bg-card shadow-none focus-visible:ring-1"
                      style={{ color: "var(--lp-ink)" }}
                      data-testid={`rule-input-${rule.id}`}
                    />
                    {rule.type === "custom" && (
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`rule-remove-${rule.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addCustomRule}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-dashed text-xs transition-colors mt-1"
                style={{
                  borderColor: "var(--lp-border)",
                  color: "var(--lp-teal-brand)",
                  background: "transparent",
                }}
                data-testid="add-rule-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3 or 4: REMINDER DELIVERY */}
      <SectionRow
        num={deliverySectionNum}
        title="How do you want your reminders?"
        sub="We'll send you a check-in at your chosen cadence"
      />

      <div
        className="rounded-md border overflow-hidden mb-4 shadow-sm"
        style={{ borderColor: "var(--lp-border)" }}
      >
        <CardMacHeader label="Reminder Delivery" ticker={upperTicker} badge="Choose delivery" />
        <div className="p-4 bg-card">

          {/* Delivery toggle cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              {
                key: "email",
                Icon: Mail,
                label: "Email reminder",
                desc: "Get a check-in email with your monitor list refreshed and any signals that have changed.",
                selected: emailDelivery,
                onToggle: () => setEmailDelivery((v) => !v),
                testId: "delivery-email",
              },
              {
                key: "calendar",
                Icon: Calendar,
                label: "Calendar invite",
                desc: "Add a recurring calendar event so the review is already blocked in your schedule.",
                selected: calendarDelivery,
                onToggle: () => setCalendarDelivery((v) => !v),
                testId: "delivery-calendar",
              },
            ].map(({ key, Icon, label, desc, selected, onToggle, testId }) => (
              <button
                key={key}
                type="button"
                onClick={onToggle}
                data-testid={testId}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all cursor-pointer",
                  selected ? "border-[color:var(--lp-teal-brand)]" : "border-border"
                )}
                style={selected ? { background: "var(--lp-teal-ghost)" } : { background: "var(--lp-warm-white)" }}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: selected ? "var(--lp-teal-brand)" : "var(--lp-ink-ghost)" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--lp-ink)" }}>
                    {label}
                  </div>
                  <div className="text-[11px] font-light leading-relaxed" style={{ color: "var(--lp-ink-ghost)" }}>
                    {desc}
                  </div>
                </div>
                {selected && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--lp-teal-brand)" }}
                  >
                    <span className="text-white text-[8px] font-bold">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Email input — shown when email delivery selected AND cadence is not trigger */}
          {emailDelivery && cadence !== "trigger" && (
            <div className="mb-4">
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="your@email.com"
                className="text-sm"
                style={{ background: "var(--lp-cream)", borderColor: "var(--lp-border)" }}
                data-testid="input-email-address"
              />
            </div>
          )}

          {/* On trigger note */}
          {emailDelivery && cadence === "trigger" && (
            <div
              className="mb-4 px-3 py-2.5 rounded-md border text-xs font-light"
              style={{ background: "var(--lp-cream)", borderColor: "var(--lp-border)", color: "var(--lp-ink-light)" }}
              data-testid="trigger-note"
            >
              You&apos;ll check in manually when a guardrail condition is met. No scheduled reminder will be sent.
            </div>
          )}

          {/* Message to future self */}
          <div>
            <div
              className="text-[10px] font-medium tracking-wider uppercase mb-2"
              style={{ color: "var(--lp-ink-ghost)", letterSpacing: "0.08em" }}
            >
              Message to your future self (optional)
            </div>
            <Textarea
              value={futureMessage}
              onChange={(e) => {
                if (e.target.value.length <= 280) setFutureMessage(e.target.value);
              }}
              placeholder="e.g. Don't sell just because it's down — check margins and story first. You bought this for the long term..."
              rows={3}
              className="text-xs resize-none"
              style={{
                background: "var(--lp-cream)",
                borderColor: "var(--lp-border)",
                color: "var(--lp-ink)",
                lineHeight: 1.6,
              }}
              data-testid="textarea-future-message"
            />
            <div
              className="text-right text-[10px] mt-1"
              style={{ color: futureMessage.length > 260 ? "var(--lp-teal-brand)" : "var(--lp-ink-ghost)" }}
            >
              {futureMessage.length} / 280
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT BAR */}
      <div
        className="relative rounded-xl overflow-hidden mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5"
        style={{ background: "var(--lp-teal-deep)" }}
        data-testid="export-bar"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 80% at 100% 50%, rgba(77,184,176,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative z-10">
          <div
            className="text-[9px] font-semibold tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em" }}
          >
            Your plan is complete
          </div>
          <div className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-white mb-1">
            Research done. Plan made.{" "}
            <em style={{ fontStyle: "italic", color: "var(--lp-teal-light, #4db8b0)" }}>Stay the course.</em>
          </div>
          <div className="text-xs font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
            We&apos;ll check in at your chosen cadence with a fresh signal snapshot.
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
          {activateSuccess ? (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20"
              data-testid="activate-success"
            >
              <span className="text-xs text-white/90 font-medium">{activateSuccess}</span>
            </div>
          ) : (
            <Button
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
              className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              style={{ background: "white", color: "var(--lp-teal-deep)", border: "1px solid white" }}
              data-testid="btn-activate-plan"
            >
              {activateMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Activating…</>
              ) : (
                "Activate my plan"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* FOOTER NAV */}
      <div
        className="flex items-center justify-start pt-6 border-t"
        style={{ borderColor: "var(--lp-border)" }}
      >
        <Button
          variant="outline"
          onClick={() => onStageChange?.(5)}
          className="flex items-center gap-1.5 text-sm"
          data-testid="btn-previous-stage"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Stage
        </Button>
      </div>
    </div>
  );
}
