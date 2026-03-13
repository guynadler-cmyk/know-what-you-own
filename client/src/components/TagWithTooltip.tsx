import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={`/discover?tags=${encodeURIComponent(name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm px-3 py-1 cursor-pointer border rounded-md inline-block ${getThemeBadgeClasses(emphasis)}`}
          data-testid={testId}
          aria-label={`${name}. Click to discover similar companies.`}
        >
          {name}
        </a>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs p-3 text-sm" side="top">
        <p>{explanation}</p>
      </TooltipContent>
    </Tooltip>
  );
}
