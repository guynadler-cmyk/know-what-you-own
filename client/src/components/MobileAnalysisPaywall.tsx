import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";

interface MobileAnalysisPaywallProps {
  stage: 3 | 4;
  isOpen: boolean;
  onSignedIn: () => void;
  onDismissed: () => void;
}

export function MobileAnalysisPaywall({ stage, isOpen, onSignedIn, onDismissed }: MobileAnalysisPaywallProps) {
  const [visible, setVisible] = useState(false);
  const [closeEnabled, setCloseEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";

      setCloseEnabled(false);
      const timer = setTimeout(() => setCloseEnabled(true), 5000);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (!closeEnabled) return;
    setVisible(false);
    document.body.style.overflow = "";
    setTimeout(onDismissed, 300);
  };

  const handleSignIn = async () => {
    try {
      trackEvent("mobile_analysis_paywall_signin_click", "engagement", `stage_${stage}`);
      document.body.style.overflow = "";
      await signInWithGoogle();
      onSignedIn();
    } catch {
      // user cancelled or error — stay open
    }
  };

  return (
    <div data-testid="mobile-analysis-paywall">
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-background transition-transform duration-300"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Save your research"
        data-testid="mobile-analysis-paywall-panel"
      >
        <div className="flex justify-end pt-3 pr-3">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={!closeEnabled}
            className="p-2 rounded-full transition-opacity"
            style={{ opacity: closeEnabled ? 1 : 0.3, cursor: closeEnabled ? "pointer" : "not-allowed" }}
            data-testid="button-analysis-paywall-close"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2">
          <div className="mb-5">
            <h2
              className="text-xl font-bold leading-snug"
              style={{ color: "var(--lp-ink)", fontFamily: "Playfair Display, serif" }}
              data-testid="text-analysis-paywall-headline"
            >
              You're getting into the details
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--lp-ink-mid)" }}>
              Create a free account to save your research and track this company over time.
            </p>
          </div>

          <Button
            onClick={handleSignIn}
            className="h-12 w-full text-base font-semibold"
            style={{
              backgroundColor: "var(--lp-teal-deep)",
              color: "#fff",
              border: "none",
            }}
            data-testid="button-analysis-paywall-cta"
          >
            Continue with Google
          </Button>

          <button
            type="button"
            onClick={handleDismiss}
            disabled={!closeEnabled}
            className="mt-4 w-full text-center text-sm transition-opacity"
            style={{ 
              color: "var(--lp-ink-ghost)",
              opacity: closeEnabled ? 1 : 0.3,
              cursor: closeEnabled ? "pointer" : "not-allowed"
            }}
            data-testid="button-analysis-paywall-dismiss"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

