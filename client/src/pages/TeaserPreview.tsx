import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface TeaserPreviewProps {
  onScrollToForm: () => void;
}

const discoveryItems = [
  "Strategic Themes",
  "Market Size",
  "Competitive Moats",
  "Value Creation",
  "Recent Shifts",
  "Competitors",
  "Leadership",
];

export function TeaserPreview({ onScrollToForm }: TeaserPreviewProps) {
  return (
    <div 
      className="rounded-xl bg-muted/40 dark:bg-muted/20 p-6 shadow-sm border border-border"
      data-testid="section-teaser-preview"
    >
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold" data-testid="text-teaser-heading">
            What You'll Discover Instantly
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {discoveryItems.map((item) => (
            <div
              key={item}
              className="bg-background border border-border px-3 py-1.5 text-sm rounded-full shadow-sm text-center"
              data-testid={`badge-teaser-${item.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {item}
            </div>
          ))}
        </div>
        
        <Button
          onClick={onScrollToForm}
          className="rounded-full mt-2"
          data-testid="button-teaser-cta"
        >
          Try it Instantly
        </Button>
      </div>
    </div>
  );
}
