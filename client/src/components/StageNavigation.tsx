import { Card, CardContent } from "@/components/ui/card";

interface StageNavigationProps {
  currentStage: number;
  onStageChange: (stage: number) => void;
}

const STAGES = [
  { number: 1, label: "Business" },
  { number: 2, label: "Performance" },
  { number: 3, label: "Valuation" },
  { number: 4, label: "Timing" },
  { number: 5, label: "Strategy" },
  { number: 6, label: "Protection" }
];

export function StageNavigation({ currentStage, onStageChange }: StageNavigationProps) {
  return (
    <Card className="mb-8" data-testid="stage-navigation">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-center justify-center gap-1 sm:gap-4">
          {STAGES.map((stage, index) => (
            <div key={stage.number} className="flex items-center">
              <button
                onClick={() => onStageChange(stage.number)}
                className="flex flex-col items-center gap-1.5"
                data-testid={`stage-button-${stage.number}`}
              >
                <div
                  className={`
                    w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                    font-semibold text-xs sm:text-base transition-all
                    ${
                      currentStage === stage.number
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover-elevate active-elevate-2"
                    }
                  `}
                >
                  {stage.number}
                </div>
                <span
                  className={`
                    text-xs font-medium hidden sm:block transition-colors
                    ${currentStage === stage.number ? "text-primary" : "text-muted-foreground"}
                  `}
                >
                  {stage.label}
                </span>
              </button>
              
              {index < STAGES.length - 1 && (
                <div 
                  className="w-3 sm:w-12 h-0.5 bg-border mx-0.5 sm:mx-2"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
