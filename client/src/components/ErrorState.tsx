import { Card, CardContent } from "@/components/ui/card";
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
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <Card className="border-destructive/20">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground" data-testid="text-error-title">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md" data-testid="text-error-message">
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button 
                variant="outline" 
                onClick={onBack}
                data-testid="button-back"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {onRetry && (
              <Button 
                onClick={onRetry}
                data-testid="button-retry"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
