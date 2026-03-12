import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface StageContent {
  eyebrow: string;
  headline: (ticker: string) => JSX.Element;
  sub: string;
}

const STAGE_CONTENT: Record<number, StageContent> = {
  1: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>Key themes from <span className="font-bold">{ticker}</span>'s own filings — what the company says about itself.</>
    ),
    sub: "Built from 5 years of 10-K filings. Plain English. No jargon.",
  },
  2: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>Is <span className="font-bold">{ticker}</span> financially strong enough to own?</>
    ),
    sub: "Revenue, earnings, cash flow, debt, and reinvestment — to help you decide if this is a business worth holding long term.",
  },
  3: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>What are you actually paying for <span className="font-bold">{ticker}</span>?</>
    ),
    sub: "Sensible investing isn't about finding the cheapest stock — it's about knowing whether the price, expectations, and potential returns make sense together.",
  },
  4: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>Are conditions aligned to act on <span className="font-bold">{ticker}</span>?</>
    ),
    sub: "This isn't about predicting the future — it's about understanding whether current price trend, momentum, and stretch signals suggest patience or action.",
  },
  5: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>Build your investment plan for <span className="font-bold">{ticker}</span>.</>
    ),
    sub: "Structure your thinking into a clear plan — conviction level, tranche sizing, and your 'I'm wrong if' rules.",
  },
  6: {
    eyebrow: "What you're looking at",
    headline: (ticker) => (
      <>Stay honest with yourself on <span className="font-bold">{ticker}</span>.</>
    ),
    sub: "The research is done. Now build the habit of checking in — so you act on facts, not feelings.",
  },
};

interface TickerContextCardProps {
  ticker: string;
  currentStage?: number;
}

export function TickerContextCard({ ticker, currentStage = 1 }: TickerContextCardProps) {
  const [visible, setVisible] = useState(true);
  const [displayStage, setDisplayStage] = useState(currentStage);

  useEffect(() => {
    if (currentStage === displayStage) return;
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplayStage(currentStage);
      setVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [currentStage, displayStage]);

  const content = STAGE_CONTENT[displayStage] || STAGE_CONTENT[1];

  return (
    <div
      className="mb-8 rounded-md p-5 sm:p-6"
      style={{ backgroundColor: "#1a2e2e" }}
      data-testid="ticker-context-card"
    >
      <div
        className="transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <p
          className="text-xs font-medium tracking-widest uppercase mb-3"
          style={{ color: "#5bb8a6", fontFamily: "monospace" }}
          data-testid="text-context-eyebrow"
        >
          {content.eyebrow}
        </p>
        <p
          className="text-base sm:text-lg font-medium text-white leading-snug mb-3"
          data-testid="text-context-headline"
        >
          {content.headline(ticker)}
        </p>
        <p
          className="text-sm mb-4"
          style={{ color: "#7fa8a0" }}
          data-testid="text-context-subline"
        >
          {content.sub}
        </p>
      </div>
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
