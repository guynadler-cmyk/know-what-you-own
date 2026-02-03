import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const STORAGE_KEY = "rn_popup_submitted";
const TRIGGER_SECONDS = 15;
const SCROLL_THRESHOLD = 25;

export function LeadPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRef = useRef(false);
  const pageLoadTimeRef = useRef(Date.now());
  const currentUrlRef = useRef(window.location.href);

  const getTickerFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ticker");
  }, []);

  const isAnalysisPage = useCallback(() => {
    return getTickerFromUrl() !== null;
  }, [getTickerFromUrl]);

  const hasAlreadySubmitted = useCallback(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }, []);

  const getPageDepth = useCallback(() => {
    const path = window.location.pathname;
    return path.split("/").filter(Boolean).length;
  }, []);

  const checkConditionsAndShow = useCallback(() => {
    if (hasShownRef.current) return;
    if (!isAnalysisPage()) return;
    if (hasAlreadySubmitted()) return;

    const timeOnPage = (Date.now() - pageLoadTimeRef.current) / 1000;
    if (timeOnPage < TRIGGER_SECONDS) return;

    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;
    const scrollPercent = (scrollY / (scrollHeight - windowHeight)) * 100;
    
    if (scrollPercent >= SCROLL_THRESHOLD) {
      hasShownRef.current = true;
      setIsVisible(true);
    }
  }, [isAnalysisPage, hasAlreadySubmitted]);

  const resetConditions = useCallback(() => {
    hasShownRef.current = false;
    pageLoadTimeRef.current = Date.now();
    setIsVisible(false);
    setIsSubmitted(false);
    setEmail("");
    setError("");
  }, []);

  const handleUrlChange = useCallback(() => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrlRef.current) {
      currentUrlRef.current = newUrl;
      resetConditions();
    }
  }, [resetConditions]);

  useEffect(() => {
    if (hasAlreadySubmitted()) return;

    const handleScroll = () => {
      checkConditionsAndShow();
    };

    timerRef.current = setInterval(() => {
      checkConditionsAndShow();
    }, 1000);

    window.addEventListener("scroll", handleScroll, { passive: true });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    window.addEventListener("popstate", handleUrlChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("popstate", handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [checkConditionsAndShow, handleUrlChange, hasAlreadySubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/lead", {
        email,
        ticker: getTickerFromUrl(),
        path: window.location.pathname,
        depth: getPageDepth(),
        triggerSeconds: TRIGGER_SECONDS,
        ts: pageLoadTimeRef.current,
      });

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
        <CardHeader className="pb-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleDismiss}
            data-testid="button-close-lead-popup"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg pr-6" data-testid="lead-popup-title">
            {isSubmitted ? "You're on the list!" : "Sign up for our advanced 10K analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="lead-popup-success">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Thanks — you're on the early access list.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-muted-foreground" data-testid="lead-popup-description">
                We are hard at work on our next version and would love to share it with you first
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
