import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ErrorState({ title, message, onRetry, onBack }: ErrorStateProps) {
  return (
    <div className="w-full max-w-3xl mx-auto text-center py-24 space-y-8 animate-fade-in">
      <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
      
      <div className="space-y-4">
        <h2 className="text-3xl font-bold" data-testid="text-error-title">
          {title}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto" data-testid="text-error-message">
          {message}
        </p>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        {onBack && (
          <Button 
            variant="outline" 
            onClick={onBack}
            className="h-12 px-8 rounded-full"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {onRetry && (
          <Button 
            onClick={onRetry}
            className="h-12 px-8 rounded-full"
            data-testid="button-retry"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
