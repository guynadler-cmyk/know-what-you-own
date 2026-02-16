import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, Bell } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getStoredEmail } from "@/lib/abTest";
import { trackEvent } from "@/lib/analytics";

interface TickerFollowPromptProps {
  ticker: string;
  onFollowed: () => void;
}

export function TickerFollowPrompt({ ticker, onFollowed }: TickerFollowPromptProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleFollow = async () => {
    const email = getStoredEmail();
    if (!email || !ticker) return;

    setIsSubmitting(true);

    trackEvent("ticker_followed", "engagement", `${ticker.toUpperCase()}|returning_user=true`);

    try {
      await apiRequest("POST", "/api/waitlist", {
        email,
        stageName: `Friday Report (returning) - ${ticker.toUpperCase()}`,
      });

      setIsSuccess(true);

      setTimeout(() => {
        onFollowed();
      }, 1200);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3" data-testid="ticker-follow-success">
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
        <span className="text-sm text-muted-foreground">
          Done! You'll get Friday reports for {ticker.toUpperCase()}.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-md border bg-muted/50 px-4 py-3" data-testid="ticker-follow-prompt">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground" data-testid="text-follow-label">
            Want Friday reports for {ticker.toUpperCase()} too?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleFollow}
            disabled={isSubmitting}
            data-testid="button-follow-ticker"
          >
            {isSubmitting ? "Adding..." : "Yes, add it"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            data-testid="button-follow-dismiss"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
