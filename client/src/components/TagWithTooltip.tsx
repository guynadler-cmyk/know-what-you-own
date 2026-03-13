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

  const lowStyle: React.CSSProperties = emphasis === "low" ? {
    background: 'var(--color-background-secondary, #f5f5f5)',
    color: 'var(--color-text-secondary, #666)',
    borderColor: 'var(--color-border-tertiary, rgba(42,140,133,0.12))',
    borderWidth: '0.5px',
  } : {};

  const baseClasses = `cursor-pointer rounded-full inline-flex items-center transition-transform hover:-translate-y-[1px] ${getThemeBadgeClasses(emphasis)}`;
  const tagStyle: React.CSSProperties = { padding: '4px 12px', fontSize: '11.5px', fontWeight: 500, ...lowStyle };

  if (draggable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            ref={setNodeRef}
            className={baseClasses}
            style={{ ...tagStyle, opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
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
          style={tagStyle}
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
