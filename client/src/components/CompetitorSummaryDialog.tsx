import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { CompanySummary } from "@shared/schema";

interface CompetitorSummaryDialogProps {
  competitorName: string;
  competitorTicker?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompetitorSummaryDialog({
  competitorName,
  competitorTicker,
  open,
  onOpenChange,
}: CompetitorSummaryDialogProps) {
  const { data, isLoading, error } = useQuery<CompanySummary>({
    queryKey: ["/api/analyze", competitorTicker],
    enabled: open && !!competitorTicker,
    staleTime: 1000 * 60 * 60,
  });

  const handleViewFullAnalysis = () => {
    if (competitorTicker) {
      window.open(`/?ticker=${competitorTicker}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-competitor-summary">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{competitorName}</DialogTitle>
          <DialogDescription>
            {competitorTicker ? (
              <span className="font-mono text-sm">{competitorTicker}</span>
            ) : (
              "Quick overview"
            )}
          </DialogDescription>
        </DialogHeader>

        {!competitorTicker ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Ticker symbol not available for this competitor.</p>
            <p className="text-sm mt-2">Unable to fetch detailed analysis.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-competitor" />
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive">Unable to load competitor analysis</p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a moment to process. Please try again.
            </p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Tagline */}
            {data.tagline && (
              <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                {data.tagline}
              </p>
            )}

            {/* Key Products */}
            {data.products && data.products.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Key Products
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.products.slice(0, 4).map((product, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                      {product.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {data.metrics && data.metrics.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Key Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.metrics.slice(0, 4).map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {metric.label}
                      </p>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Analysis Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleViewFullAnalysis}
                className="w-full"
                data-testid="button-view-full-analysis"
              >
                View Full Analysis
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
