import { Badge } from "@/components/ui/badge";

interface TickerContextCardProps {
  ticker: string;
}

export function TickerContextCard({ ticker }: TickerContextCardProps) {
  return (
    <div
      className="mb-8 rounded-md p-5 sm:p-6"
      style={{ backgroundColor: "#1a2e2e" }}
      data-testid="ticker-context-card"
    >
      <p
        className="text-xs font-medium tracking-widest uppercase mb-3"
        style={{ color: "#5bb8a6", fontFamily: "monospace" }}
        data-testid="text-context-eyebrow"
      >
        What you're looking at
      </p>
      <p
        className="text-base sm:text-lg font-medium text-white leading-snug mb-3"
        data-testid="text-context-headline"
      >
        Key themes from <span className="font-bold">{ticker}</span>'s own filings — what the company says about itself.
      </p>
      <p
        className="text-sm mb-4"
        style={{ color: "#7fa8a0" }}
        data-testid="text-context-subline"
      >
        Built from 5 years of 10-K filings. Plain English. No jargon.
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="no-default-hover-elevate no-default-active-elevate text-xs border-white/20 text-white/80"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          data-testid="badge-context-10k"
        >
          10-K Analysis
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate no-default-active-elevate text-xs border-white/20 text-white/80"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          data-testid="badge-context-years"
        >
          2021 – 2026
        </Badge>
        <Badge
          variant="outline"
          className="no-default-hover-elevate no-default-active-elevate text-xs border-white/20 text-white/80"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          data-testid="badge-context-dimensions"
        >
          6 dimensions
        </Badge>
      </div>
    </div>
  );
}
