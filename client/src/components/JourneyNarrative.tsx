import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const JOURNEY_STEPS = [
  {
    number: 1,
    title: "Understand the Business",
    description: "Study what the company does, how it makes money, and why customers choose them"
  },
  {
    number: 2,
    title: "Understand Performance",
    description: "Analyze financial metrics, trends, and operational efficiency"
  },
  {
    number: 3,
    title: "Evaluate the Stock",
    description: "Assess current valuation and price relative to business quality"
  },
  {
    number: 4,
    title: "Plan Your Investment",
    description: "Determine position size and develop your investment strategy"
  },
  {
    number: 5,
    title: "Time It Sensibly",
    description: "Identify favorable entry points and market conditions"
  },
  {
    number: 6,
    title: "Protect What's Yours",
    description: "Set stop losses and establish clear exit rules"
  }
];

export function JourneyNarrative() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="mb-8 border-2 border-primary/20" data-testid="journey-narrative">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full" data-testid="journey-narrative-trigger">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-left">
                <p className="text-lg font-semibold text-foreground">
                  Our Investment Philosophy
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  We only buy great businesses at great prices, entered wisely, protected carefully
                </p>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sensible investing requires a systematic approach. We guide you through six essential stages, 
                each building on the last, to help you make informed decisions with confidence.
              </p>
              
              <div className="grid gap-3 mt-6">
                {JOURNEY_STEPS.map((step) => (
                  <div 
                    key={step.number}
                    className="flex gap-3 items-start"
                    data-testid={`journey-step-${step.number}`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{step.number}</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
