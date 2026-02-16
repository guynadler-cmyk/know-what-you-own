import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Rocket, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";
import { setStoredEmail, unlockPaywall } from "@/lib/abTest";

interface EmailPaywallProps {
  ticker: string;
  onUnlocked: () => void;
  onSkipped?: () => void;
  mode?: "friday_report" | "action_gate";
}

export function EmailPaywall({
  ticker,
  onUnlocked,
  onSkipped,
  mode = "friday_report",
}: EmailPaywallProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState<"friday_report" | "waitlist">("waitlist");

  useEffect(() => {
    trackEvent("paywall_viewed", "paywall", `${ticker}|variant=${mode}`);
  }, [ticker, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    const label =
      mode === "action_gate"
        ? `${ticker}|variant=${mode}|option=${selectedOption}`
        : `${ticker}|variant=${mode}`;

    trackEvent("paywall_email_submitted", "paywall", label);

    try {
      const stageName =
        mode === "friday_report"
          ? `Paywall Gate - ${ticker}`
          : `Action Gate (${selectedOption}) - ${ticker}`;

      const response = await apiRequest("POST", "/api/waitlist", { email, stageName });
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: 'paywall_gate',
          ticker: ticker || undefined,
          stage: mode === "friday_report" ? 4 : 5,
        });
      }

      setStoredEmail(email);
      unlockPaywall(ticker);

      trackEvent("paywall_email_success", "paywall", label);

      setIsSuccess(true);

      setTimeout(() => {
        onUnlocked();
      }, 1200);
    } catch (err: any) {
      const message = err?.message || "Something went wrong.";
      trackEvent("paywall_email_error", "paywall", `${label}|error=${message}`);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    trackEvent("paywall_skipped", "paywall", `${ticker}|variant=friday_report`);
    onSkipped?.();
  };

  if (isSuccess) {
    return (
      <Card className="shadow-2xl max-w-lg mx-auto" data-testid="paywall-success-card">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold" data-testid="text-paywall-success">
            You're in! Loading your full analysis...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (mode === "action_gate") {
    return (
      <Card className="shadow-2xl max-w-lg mx-auto" data-testid="paywall-card">
        <CardHeader className="pb-2">
          <h2 className="text-xl font-bold" data-testid="text-paywall-heading">
            Ready to plan your entry?
          </h2>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-paywall-subtext">
            You've explored the analysis for {ticker}. Sign up to unlock the strategy builder and create your action plan.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedOption("friday_report")}
              className={`rounded-md border p-3 text-left transition-colors ${
                selectedOption === "friday_report"
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              }`}
              data-testid="option-friday-report"
            >
              <Mail className="h-5 w-5 mb-2" />
              <p className="text-sm font-medium">Friday Report</p>
              <p className="text-xs text-muted-foreground mt-1">
                Weekly note: what changed, what it means, and what to do Monday.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOption("waitlist")}
              className={`rounded-md border p-3 text-left transition-colors ${
                selectedOption === "waitlist"
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              }`}
              data-testid="option-waitlist"
            >
              <Rocket className="h-5 w-5 mb-2" />
              <p className="text-sm font-medium">Restnvest Waitlist</p>
              <p className="text-xs text-muted-foreground mt-1">
                Be first to access the full platform when it launches.
              </p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              data-testid="input-paywall-email"
            />
            {error && (
              <p className="text-sm text-destructive" data-testid="text-paywall-error">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-paywall-submit"
            >
              {isSubmitting
                ? "Submitting..."
                : selectedOption === "friday_report"
                  ? "Send my Friday report"
                  : "Join the waitlist"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Without signing up, you can still browse the analysis stages — but the strategy builder stays locked.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl max-w-lg mx-auto" data-testid="paywall-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-5 w-5" />
          <h2 className="text-xl font-bold" data-testid="text-paywall-heading">
            Friday Report → Monday Actions
          </h2>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="text-paywall-subtext">
          Get a quick weekly note for {ticker}: what changed, what matters, and what to do next.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li>
            <span className="font-semibold">What changed:</span>{" "}
            <span className="text-muted-foreground">earnings / filings / news that move the thesis</span>
          </li>
          <li>
            <span className="font-semibold">What it means:</span>{" "}
            <span className="text-muted-foreground">fundamentals + valuation in plain English</span>
          </li>
          <li>
            <span className="font-semibold">Monday actions:</span>{" "}
            <span className="text-muted-foreground">hold / add / wait + 1 thing to watch</span>
          </li>
        </ul>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            data-testid="input-paywall-email"
          />
          {error && (
            <p className="text-sm text-destructive" data-testid="text-paywall-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            data-testid="button-paywall-submit"
          >
            {isSubmitting ? "Submitting..." : "Send my Friday report"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          No spam. Ever. Just your weekly report and your saved analysis link.
        </p>

        {onSkipped && (
          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-xs text-muted-foreground underline underline-offset-2"
            data-testid="button-paywall-skip"
          >
            Not now — continue with limited view
          </button>
        )}
      </CardContent>
    </Card>
  );
}
