import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { setStoredEmail, unlockPaywall } from "@/lib/abTest";
import { trackEvent } from "@/lib/analytics";

interface InlineEmailCaptureProps {
  ticker: string;
  onUnlocked: () => void;
}

export function InlineEmailCapture({ ticker, onUnlocked }: InlineEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    trackEvent("paywall_email_submitted", "paywall", `${ticker}|variant=friday_report|source=inline`);

    try {
      const response = await apiRequest("POST", "/api/waitlist", {
        email,
        stageName: `Paywall Gate - ${ticker.toUpperCase()}`,
      });
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: 'inline_gate',
          ticker: ticker || undefined,
          stage: 4,
        });
      }

      setStoredEmail(email);
      unlockPaywall(ticker);
      setIsSuccess(true);
      trackEvent("paywall_email_success", "paywall", `${ticker}|variant=friday_report|source=inline`);

      setTimeout(() => {
        onUnlocked();
      }, 800);
    } catch (err: any) {
      const msg = "Something went wrong. Please try again.";
      setError(msg);
      trackEvent("paywall_email_error", "paywall", `${ticker}|variant=friday_report|source=inline|error=${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3" data-testid="inline-capture-success">
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
        <span className="text-sm text-muted-foreground">You're in! Unlocking your full analysis...</span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border bg-muted/50 px-4 py-3" data-testid="inline-email-capture">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <span className="shrink-0 text-sm text-muted-foreground" data-testid="text-inline-capture-label">
          Get the Friday report for {ticker.toUpperCase()} — weekly insights, straight to your inbox.
        </span>
        <div className="flex items-center gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="h-9 w-56"
            data-testid="input-inline-email"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            data-testid="button-inline-send"
          >
            <Send className="mr-1 h-3 w-3" />
            {isSubmitting ? "..." : "Send"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            data-testid="button-inline-dismiss"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="w-full text-sm text-destructive" data-testid="text-inline-error">{error}</p>
        )}
      </form>
    </div>
  );
}
