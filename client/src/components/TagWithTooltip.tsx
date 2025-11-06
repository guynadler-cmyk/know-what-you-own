import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagWithTooltipProps {
  name: string;
  emphasis: "high" | "medium" | "low";
  explanation: string;
  testId?: string;
  getThemeBadgeClasses: (emphasis: "high" | "medium" | "low") => string;
}

export function TagWithTooltip({ 
  name, 
  emphasis, 
  explanation, 
  testId,
  getThemeBadgeClasses 
}: TagWithTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`text-sm px-3 py-1 cursor-pointer border rounded-md ${getThemeBadgeClasses(emphasis)}`}
          data-testid={testId}
          aria-label={`${name}. Click for explanation.`}
        >
          {name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs p-3 text-sm" side="top">
        <p>{explanation}</p>
      </PopoverContent>
    </Popover>
  );
}
