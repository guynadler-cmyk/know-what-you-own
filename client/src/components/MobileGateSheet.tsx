import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { setStoredEmail, unlockPaywall } from "@/lib/abTest";
import { trackEvent } from "@/lib/analytics";

interface MobileGateSheetProps {
  ticker: string;
  onUnlocked: () => void;
  onDismissed: () => void;
}

export function MobileGateSheet({ ticker, onUnlocked, onDismissed }: MobileGateSheetProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    document.body.style.overflow = "";
    setTimeout(onDismissed, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    trackEvent("paywall_email_submitted", "paywall", `${ticker}|variant=friday_report|source=mobile_sheet`);

    try {
      const response = await apiRequest("POST", "/api/waitlist", {
        email,
        stageName: `Mobile Gate - ${ticker.toUpperCase()}`,
      });
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: "mobile_gate_sheet",
          ticker: ticker || undefined,
          stage: 1,
        });
      }

      setStoredEmail(email);
      unlockPaywall(ticker);
      setIsSuccess(true);
      trackEvent("paywall_email_success", "paywall", `${ticker}|variant=friday_report|source=mobile_sheet`);

      setTimeout(() => {
        document.body.style.overflow = "";
        onUnlocked();
      }, 900);
    } catch {
      const msg = "Something went wrong. Please try again.";
      setError(msg);
      trackEvent("paywall_email_error", "paywall", `${ticker}|source=mobile_sheet`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="mobile-gate-sheet">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background transition-transform duration-300"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Get weekly analysis"
        data-testid="mobile-gate-sheet-panel"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="px-6 pb-8 pt-4">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center" data-testid="mobile-gate-success">
              <CheckCircle className="h-10 w-10" style={{ color: "var(--lp-teal-brand)" }} />
              <p className="text-base font-semibold" style={{ color: "var(--lp-ink)" }}>
                You're in! Unlocking your full analysis…
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-5">
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--lp-teal-brand)" }}
                >
                  Free weekly report
                </p>
                <h2
                  className="text-xl font-bold leading-snug"
                  style={{ color: "var(--lp-ink)", fontFamily: "Playfair Display, serif" }}
                  data-testid="text-mobile-gate-headline"
                >
                  Keep reading — get the full picture on {ticker.toUpperCase()}
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--lp-ink-light)" }}>
                  Every Friday: key moves, risks, and what changed — for every stock you follow.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 text-base"
                  data-testid="input-mobile-gate-email"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive" data-testid="text-mobile-gate-error">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full text-base font-semibold"
                  style={{
                    backgroundColor: "var(--lp-teal-deep)",
                    color: "#fff",
                    border: "none",
                  }}
                  data-testid="button-mobile-gate-submit"
                >
                  {isSubmitting ? "Sending…" : "Get my free report"}
                </Button>
              </form>

              {/* Dismiss */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="min-h-[44px] w-full flex items-center justify-center text-sm"
                  style={{ color: "var(--lp-ink-ghost)" }}
                  data-testid="button-mobile-gate-dismiss"
                >
                  Maybe later
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
