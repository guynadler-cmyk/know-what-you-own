import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  ticker?: string;
  isFirstAnalysis?: boolean;
}

export function LoadingState({ message = "Analyzing...", ticker, isFirstAnalysis }: LoadingStateProps) {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-24 space-y-8 animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <div className="space-y-4">
        <p className="text-2xl font-semibold" data-testid="text-loading-message">
          {message}
        </p>
        {isFirstAnalysis ? (
          <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto" data-testid="text-first-analysis-notice">
            {ticker ? `${ticker} hasn't been researched on our platform before.` : "This company hasn't been researched on our platform before."}{" "}
            We're pulling the 10-K filing directly from the SEC and building the full analysis from scratch — this takes about 30–45 seconds. It'll be instant next time.
          </p>
        ) : (
          <p className="text-base text-muted-foreground leading-relaxed">
            Beta version - still optimizing for speed.<br />
            Thanks for your patience while we build something worth sticking with.
          </p>
        )}
      </div>
    </div>
  );
}
