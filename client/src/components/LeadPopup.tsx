import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const STORAGE_KEY = "rn_popup_submitted";
const TRIGGER_SECONDS = 10;

export function LeadPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTickerRef = useRef<string | null>(null);
  const hasShownRef = useRef(false);

  const getTickerFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ticker");
  };

  const hasAlreadySubmitted = () => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  };

  const isPageLoading = () => {
    // Check if loading spinner is present (analysis still loading)
    const loadingIndicator = document.querySelector('[data-testid="analysis-loading"]');
    return loadingIndicator !== null;
  };

  useEffect(() => {
    // Don't show if already submitted
    if (hasAlreadySubmitted()) return;

    // Check every second
    timerRef.current = setInterval(() => {
      const currentTicker = getTickerFromUrl();
      
      // Not on an analysis page - reset everything
      if (!currentTicker) {
        startTimeRef.current = null;
        lastTickerRef.current = null;
        return;
      }
      
      // Page still loading - don't start timer yet
      if (isPageLoading()) {
        startTimeRef.current = null;
        return;
      }
      
      // Ticker changed - reset timer
      if (currentTicker !== lastTickerRef.current) {
        startTimeRef.current = Date.now();
        lastTickerRef.current = currentTicker;
        hasShownRef.current = false;
        return;
      }
      
      // Already shown for this session
      if (hasShownRef.current) return;
      
      // Timer not started yet (page just finished loading)
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        return;
      }
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      
      if (elapsed >= TRIGGER_SECONDS) {
        hasShownRef.current = true;
        setIsVisible(true);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/lead", {
        email,
        ticker: getTickerFromUrl(),
        path: window.location.pathname,
        ts: startTimeRef.current,
      });
      const result = await response.json();

      if (result.isNewLead) {
        const { analytics } = await import("@/lib/analytics");
        analytics.trackNewLead({
          lead_source: 'popup',
          ticker: getTickerFromUrl() || undefined,
          stage: 0,
        });
      }

      localStorage.setItem(STORAGE_KEY, "true");
      setIsSubmitted(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300" data-testid="lead-popup">
      <Card className="shadow-lg border-border">
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg leading-snug" data-testid="lead-popup-title">
              {isSubmitted ? "You're on the list!" : "Get sensible stock analysis"}
            </CardTitle>

            <Button
              variant="ghost"
              size="icon"
              className="-mt-1 h-8 w-8 shrink-0"
              onClick={handleDismiss}
              data-testid="button-close-lead-popup"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4">
          {isSubmitted ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="lead-popup-success">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Thanks — you're on the early access list.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-muted-foreground" data-testid="lead-popup-description">
                Be first to try our next version - clear insights, no hype.
              </p>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                data-testid="input-lead-email"
              />
              {error && (
                <p className="text-sm text-destructive" data-testid="lead-popup-error">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-submit-lead"
              >
                {isSubmitting ? "Submitting..." : "Notify me"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
