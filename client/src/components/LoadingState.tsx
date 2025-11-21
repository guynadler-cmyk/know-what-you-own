import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Analyzing..." }: LoadingStateProps) {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-24 space-y-8 animate-fade-in">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <div className="space-y-4">
        <p className="text-2xl font-semibold" data-testid="text-loading-message">
          {message}
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Beta version - still optimizing for speed.<br />
          Thanks for your patience while we build something worth sticking with.
        </p>
      </div>
    </div>
  );
}
