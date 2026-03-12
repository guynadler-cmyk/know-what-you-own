import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  { number: 6, label: "Manage" }
];

export function StageNavigation({ currentStage, onStageChange }: StageNavigationProps) {
  const activeStage = STAGES.find(s => s.number === currentStage);

  return (
    <div
      className="bg-card border border-border rounded-md px-4 py-3"
      data-testid="stage-navigation"
    >
      <div className="flex items-center justify-center gap-[4px] sm:gap-1">
        {STAGES.map((stage, index) => {
          const isCompleted = stage.number < currentStage;
          const isActive = stage.number === currentStage;
          const isFuture = stage.number > currentStage;

          return (
            <div key={stage.number} className="flex items-center">
              <button
                onClick={() => onStageChange(stage.number)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md transition-all duration-200 hover-elevate active-elevate-2",
                  "min-w-[44px] min-h-[44px] justify-center px-1 sm:px-3 py-1.5",
                  "sm:min-w-[64px]"
                )}
                data-testid={`stage-button-${stage.number}`}
              >
                <div
                  className={cn(
                    "w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                    isActive && "text-white shadow-sm",
                    isCompleted && "border-2 border-[color:var(--lp-teal-deep)] text-[color:var(--lp-teal-deep)]",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                  style={isActive ? { background: "var(--lp-teal-deep)" } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    stage.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium leading-tight transition-colors hidden sm:block whitespace-nowrap",
                    isActive && "font-semibold",
                    isFuture && "text-muted-foreground"
                  )}
                  style={isActive ? { color: "var(--lp-teal-deep)" } : isCompleted ? { color: "var(--lp-teal-deep)" } : undefined}
                >
                  {stage.label}
                </span>
                {isActive && (
                  <div
                    className="h-0.5 w-full rounded-full"
                    style={{ background: "var(--lp-teal-deep)" }}
                  />
                )}
              </button>

              {index < STAGES.length - 1 && (
                <div
                  className={cn(
                    "w-2 sm:w-6 h-px mx-0 sm:mx-0.5 transition-colors",
                    stage.number < currentStage ? "opacity-50" : "bg-border"
                  )}
                  style={stage.number < currentStage ? { background: "var(--lp-teal-deep)" } : undefined}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      {activeStage && (
        <p
          className="sm:hidden text-center text-xs font-semibold mt-2"
          style={{ color: "var(--lp-teal-deep)" }}
          data-testid="stage-active-label-mobile"
        >
          Stage {activeStage.number} · {activeStage.label}
        </p>
      )}
    </div>
  );
}
