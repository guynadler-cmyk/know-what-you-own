import { useRef } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

interface TagWithTooltipProps {
  name: string;
  emphasis: "high" | "medium" | "low";
  explanation: string;
  testId?: string;
  getThemeBadgeClasses: (emphasis: "high" | "medium" | "low") => string;
  draggable?: boolean;
  dragIdSuffix?: string;
}

export function TagWithTooltip({ 
  name, 
  emphasis, 
  explanation, 
  testId,
  getThemeBadgeClasses,
  draggable = false,
  dragIdSuffix,
}: TagWithTooltipProps) {
  const dragId = `tag-drag:${name}${dragIdSuffix ? `:${dragIdSuffix}` : ""}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    disabled: !draggable,
    data: { tag: name },
  });
  const wasDraggingRef = useRef(false);

  if (isDragging) {
    wasDraggingRef.current = true;
  }

  const baseClasses = `text-[11px] px-2.5 py-1 cursor-pointer border rounded-md inline-flex items-center gap-1 transition-transform hover:-translate-y-[1px] ${getThemeBadgeClasses(emphasis)}`;

  if (draggable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            ref={setNodeRef}
            className={baseClasses}
            style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
            data-testid={testId}
            aria-label={`${name}. Drag to Discovery Builder or click to discover similar companies.`}
            onClick={(e) => {
              if (wasDraggingRef.current) {
                wasDraggingRef.current = false;
                e.preventDefault();
                return;
              }
              window.open(`/discover?tags=${encodeURIComponent(name)}`, "_blank");
            }}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
            {name}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 text-sm" side="top">
          <p>{explanation}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={`/discover?tags=${encodeURIComponent(name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
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
