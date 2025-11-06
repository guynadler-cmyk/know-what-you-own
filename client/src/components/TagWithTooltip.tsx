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
        <div>
          <Badge
            className={`text-sm px-3 py-1 cursor-help ${getThemeBadgeClasses(emphasis)}`}
            data-testid={testId}
          >
            {name}
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs p-3 text-sm" side="top">
        <p>{explanation}</p>
      </PopoverContent>
    </Popover>
  );
}
