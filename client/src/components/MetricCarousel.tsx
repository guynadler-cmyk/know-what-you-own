import { lazy, Suspense, useState } from "react";
import { PerformanceMetric } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

const LazyChart = lazy(() => import("./MetricCarouselChart"));

interface MetricCarouselProps {
  metrics: PerformanceMetric[];
}

export function MetricCarousel({ metrics }: MetricCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextMetric = () => {
    setCurrentIndex((prev) => (prev + 1) % metrics.length);
  };

  const prevMetric = () => {
    setCurrentIndex((prev) => (prev - 1 + metrics.length) % metrics.length);
  };

  if (metrics.length === 0) return null;

  const currentMetric = metrics[currentIndex];

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl sm:text-2xl font-bold">{currentMetric.name}</h4>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" data-testid={`info-${currentMetric.name.toLowerCase().replace(/\s+/g, '-')}`} />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{currentMetric.explanation}</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-primary">{currentMetric.value}</p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
          {currentMetric.explanation}
        </p>

        <div className="h-48 sm:h-64 mb-4">
          <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse rounded" />}>
            <LazyChart chartData={currentMetric.chartData} />
          </Suspense>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={prevMetric}
            disabled={metrics.length <= 1}
            data-testid="button-prev-metric"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {metrics.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to metric ${index + 1}`}
                data-testid={`dot-metric-${index}`}
              />
            ))}
          </div>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={nextMetric}
            disabled={metrics.length <= 1}
            data-testid="button-next-metric"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Metric {currentIndex + 1} of {metrics.length}
      </p>
    </div>
  );
}
