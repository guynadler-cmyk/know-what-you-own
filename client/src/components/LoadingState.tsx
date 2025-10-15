import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Fetching 10-K filing..." }: LoadingStateProps) {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-base font-medium text-foreground" data-testid="text-loading-message">
              {message}
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a moment...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
