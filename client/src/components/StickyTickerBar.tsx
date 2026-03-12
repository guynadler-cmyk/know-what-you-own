import { useState, useEffect } from "react";

interface StickyTickerBarProps {
  ticker: string;
  companyName: string;
  homepage?: string;
}

function extractDomain(homepage: string): string | null {
  try {
    const url = new URL(homepage);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

export function StickyTickerBar({ ticker, companyName, homepage }: StickyTickerBarProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
    if (homepage) {
      const domain = extractDomain(homepage);
      if (domain) {
        setLogoSrc(`https://logo.clearbit.com/${domain}?size=64`);
        return;
      }
    }
    setLogoSrc(null);
  }, [homepage]);

  return (
    <div
      className="hidden sm:flex items-center gap-3 rounded-md px-4 py-2.5 mb-2"
      style={{ background: "var(--lp-teal-deep)" }}
      data-testid="sticky-ticker-bar"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}
      >
        {logoSrc && !logoFailed ? (
          <img
            src={logoSrc}
            alt={`${companyName} logo`}
            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="text-xs font-bold text-white/80">{ticker.charAt(0)}</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-sm font-bold text-white truncate"
          style={{ fontFamily: "'Playfair Display', serif" }}
          data-testid="text-sticky-company"
        >
          {companyName}
        </span>
        <span
          className="font-mono text-[11px] flex-shrink-0"
          style={{ color: "rgba(255,255,255,0.55)" }}
          data-testid="text-sticky-ticker"
        >
          {ticker}
        </span>
      </div>
    </div>
  );
}
