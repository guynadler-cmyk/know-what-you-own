import { useState, useEffect } from "react";
import { Building } from "lucide-react";

function extractDomain(homepage: string): string | null {
  try {
    const url = new URL(homepage);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function getClearbitUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}?size=256`;
}

function getGoogleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

interface CompanyLogoProps {
  homepage?: string;
  companyName: string;
  ticker: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "h-20 w-20",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

const textSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function CompanyLogo({ homepage, companyName, ticker, size = "md", className = "" }: CompanyLogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const domain = homepage ? extractDomain(homepage) : null;

  useEffect(() => {
    setSourceIndex(0);
  }, [domain]);

  const sources = domain
    ? [getClearbitUrl(domain), getGoogleFaviconUrl(domain)]
    : [];

  const currentSrc = sources[sourceIndex];
  const showImage = domain && sourceIndex < sources.length;

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  const textSize = textSizes[size];

  if (!showImage) {
    return (
      <div
        className={`${sizeClass} rounded-lg bg-muted flex items-center justify-center ${className}`}
        data-testid="company-logo-fallback"
      >
        {ticker ? (
          <span className={`${textSize} font-bold text-primary`}>{ticker.charAt(0)}</span>
        ) : (
          <Building className={`${iconSize} text-muted-foreground`} />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <img
        src={currentSrc}
        alt={`${companyName} logo`}
        className={`${sizeClass} rounded-lg object-contain bg-white p-2 shadow-sm`}
        data-testid="company-logo"
        onError={() => {
          setSourceIndex((prev) => prev + 1);
        }}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth < 32 || img.naturalHeight < 32) {
            setSourceIndex((prev) => prev + 1);
          }
        }}
      />
    </div>
  );
}
