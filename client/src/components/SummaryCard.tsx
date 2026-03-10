import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, ChevronDown, ChevronUp, AlertTriangle, Info, ArrowRight, ExternalLink } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";

import { useQuery } from "@tanstack/react-query";
import { InvestmentTheme, Moat, MarketOpportunity, ValueCreation, TemporalAnalysis as TemporalAnalysisType, FinePrintAnalysis as FinePrintAnalysisType } from "@shared/schema";
import { TagWithTooltip } from "@/components/TagWithTooltip";
import { CompanyLogo } from "@/components/CompanyLogo";
import { FinePrintAnalysis } from "@/components/FinePrintAnalysis";
import { TemporalAnalysis } from "@/components/TemporalAnalysis";

interface Product {
  name: string;
  icon: LucideIcon;
  description: string;
}

interface Competitor {
  name: string;
  ticker?: string;
  focus: string;
}

interface SalesChannel {
  name: string;
  explanation: string;
}

interface Metric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
}

interface SummaryCardProps {
  companyName: string;
  ticker: string;
  filingDate: string;
  fiscalYear: string;
  tagline: string;
  investmentThesis: string;
  investmentThemes: InvestmentTheme[];
  moats: Moat[];
  marketOpportunity: MarketOpportunity[];
  valueCreation: ValueCreation[];
  products: Product[];
  operations: {
    regions: string[];
    channels: SalesChannel[];
    scale: string;
  };
  competitors: Competitor[];
  metrics: Metric[];
  metadata: {
    homepage: string;
    investorRelations?: string;
  };
  cik?: string;
  temporalAnalysis?: TemporalAnalysisType;
  businessAnalysisUnavailable?: boolean;
  businessAnalysisError?: string;
  analysisDepth?: 'full' | 'limited' | 'unavailable';
  no10KAvailable?: boolean;
  onStageChange?: (stage: number) => void;
}

/* ─── helpers ─────────────────────────────────────────────── */

const tealDeep = 'var(--lp-teal-deep)';
const tealPale = 'var(--lp-teal-pale)';
const cream = 'var(--lp-cream)';
const border = 'rgba(42,140,133,0.12)';

function CardHeader({ label, badge }: { label: string; badge?: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5"
      style={{ background: tealDeep }}
    >
      <span className="font-mono text-[11px] tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {label}
      </span>
      {badge && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function SectionCard({ header, badge, children, className = '' }: {
  header: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden border ${className}`}
      style={{ borderColor: border, boxShadow: '0 2px 20px rgba(13,74,71,0.07)' }}
    >
      <CardHeader label={header} badge={badge} />
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────── */

export function SummaryCard({
  companyName,
  ticker,
  filingDate,
  fiscalYear,
  tagline,
  investmentThesis,
  investmentThemes,
  moats,
  marketOpportunity,
  valueCreation,
  products,
  operations,
  competitors,
  metrics,
  metadata,
  cik,
  temporalAnalysis,
  businessAnalysisUnavailable,
  businessAnalysisError,
  analysisDepth,
  no10KAvailable,
  onStageChange,
}: SummaryCardProps) {
  const [thesisOpen, setThesisOpen] = useState(false);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  const [showTemporalDetail, setShowTemporalDetail] = useState(true);
  const [showFinePrintDetail, setShowFinePrintDetail] = useState(true);

  const filteredCompetitors = competitors.filter(
    (c) => !c.ticker || c.ticker.toUpperCase() !== ticker.toUpperCase()
  );

  const { data: finePrintAnalysis } = useQuery<FinePrintAnalysisType | null>({
    queryKey: ['/api/analyze', ticker, 'fine-print'],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/analyze/${ticker}/fine-print`);
        if (response.status === 404) return null;
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    enabled: !!ticker,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const getThemeBadgeClasses = (emphasis: "high" | "medium" | "low") => {
    switch (emphasis) {
      case "high":   return "bg-[#0d4a47] text-white border-transparent";
      case "medium": return "bg-[#e8f5f4] text-[#1a6b66] border-[rgba(42,140,133,0.12)]";
      case "low":    return "bg-[#faf8f4] text-[#6b6b64] border-[rgba(42,140,133,0.12)]";
    }
  };

  /* --- temporal counters --- */
  const temporalCounters = temporalAnalysis ? [
    { label: 'Discontinued', count: temporalAnalysis.discontinued.length, color: '#dc2626', bg: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.12)' },
    { label: 'New & Sustained', count: temporalAnalysis.newAndSustained.length, color: '#16a34a', bg: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.12)' },
    { label: 'Evolved', count: temporalAnalysis.evolved.length, color: '#2563eb', bg: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.12)' },
    { label: 'New Products', count: temporalAnalysis.newProducts.length, color: '#7c3aed', bg: 'rgba(139,92,246,0.04)', borderColor: 'rgba(139,92,246,0.12)' },
  ] : [];

  /* --- temporal preview items --- */
  type PreviewItem = { label: string; text: string; year: string; type: 'product' | 'market' };
  const temporalPreviewItems: PreviewItem[] = [];
  if (temporalAnalysis) {
    if (temporalAnalysis.discontinued[0]) {
      temporalPreviewItems.push({ label: 'product', text: temporalAnalysis.discontinued[0].item, year: temporalAnalysis.discontinued[0].lastMentionedYear, type: 'product' });
    }
    if (temporalAnalysis.evolved[0]) {
      temporalPreviewItems.push({ label: 'evolved', text: temporalAnalysis.evolved[0].item, year: temporalAnalysis.evolved[0].yearRange?.split('–')[1] || '', type: 'market' });
    } else if (temporalAnalysis.newProducts[0]) {
      temporalPreviewItems.push({ label: 'product', text: temporalAnalysis.newProducts[0].name, year: temporalAnalysis.newProducts[0].introducedYear, type: 'product' });
    }
  }

  const yearsLabel = temporalAnalysis?.summary?.yearsAnalyzed?.length
    ? `${temporalAnalysis.summary.yearsAnalyzed.length} yrs`
    : undefined;

  const temporalHasItems = temporalAnalysis != null && (
    temporalAnalysis.discontinued.length +
    temporalAnalysis.newAndSustained.length +
    temporalAnalysis.evolved.length +
    temporalAnalysis.newProducts.length
  ) > 0;

  return (
    <TooltipProvider>
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-16 animate-fade-in" data-testid="stage-1-content">

      {/* ── analysis notices ── */}
      {analysisDepth === 'limited' && !businessAnalysisUnavailable && (
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3" data-testid="banner-limited-depth">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Limited filing</p>
            <p className="text-xs mt-0.5 text-blue-700 dark:text-blue-400">
              This company's 10-K has minimal business information — it may be a SPAC, blank check company, or early-stage filer.
            </p>
          </div>
        </div>
      )}
      {businessAnalysisUnavailable && (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Business summary unavailable</p>
            <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">
              {businessAnalysisError || "We had trouble reading this company's 10-K filing."} Performance, Valuation, Timing and other stages below are still fully available.
            </p>
          </div>
        </div>
      )}

      {/* ── company header card ── */}
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between relative overflow-hidden"
        style={{ background: tealDeep }}
        data-testid="company-header-card"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(77,184,176,0.12) 0%, transparent 60%)' }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <CompanyLogo
              homepage={metadata.homepage}
              companyName={companyName}
              ticker={ticker}
              size="sm"
            />
          </div>
          <div>
            <h1
              className="text-xl font-bold leading-tight text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="text-company-name"
            >
              {companyName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }} data-testid="text-ticker">
                {ticker}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
              <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }} data-testid="text-filing-date">
                {filingDate}
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-end gap-2 max-w-xs">
          <p
            className="text-xs font-light italic text-right leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            {tagline}
          </p>
          {metadata.homepage && (
            <a
              href={metadata.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] transition-opacity hover:opacity-80"
              style={{ color: 'var(--lp-teal-light)' }}
              data-testid="link-homepage"
            >
              <Globe className="h-3 w-3" />
              {metadata.homepage.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              <ArrowRight className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* ── two-col row: Investment Thesis + Business Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Investment Thesis */}
        <SectionCard
          header={`Investment Thesis — ${ticker}`}
          badge={`${(investmentThemes?.length || 0) + (moats?.length || 0) > 0 ? Math.round(((investmentThemes?.length || 0) + (moats?.length || 0)) / 2) : 4} themes`}
        >
          {/* legend */}
          <div className="flex items-center gap-4 pb-3 mb-3 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-1.5 text-[9px]" style={{ color: 'var(--lp-ink-ghost)' }}>
              <div className="w-1.5 h-1.5 rounded-sm bg-[#0d4a47]" /> Strong
            </div>
            <div className="flex items-center gap-1.5 text-[9px]" style={{ color: 'var(--lp-ink-ghost)' }}>
              <div className="w-1.5 h-1.5 rounded-sm bg-[#e8f5f4] border border-[rgba(42,140,133,0.12)]" /> Moderate
            </div>
            <div className="flex items-center gap-1.5 text-[9px]" style={{ color: 'var(--lp-ink-ghost)' }}>
              <div className="w-1.5 h-1.5 rounded-sm bg-[#faf8f4] border border-[rgba(42,140,133,0.12)]" /> Mentioned
            </div>
          </div>

          {/* 2x2 category grid */}
          <div className="grid grid-cols-2 gap-4">
            {investmentThemes && investmentThemes.length > 0 && (
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2 flex items-center gap-1" style={{ color: 'var(--lp-ink-ghost)' }}>
                  ↗ Strategic Themes
                </p>
                <div className="flex flex-wrap gap-1" data-testid="investment-themes">
                  {investmentThemes.map((theme, i) => (
                    <TagWithTooltip
                      key={i}
                      name={theme.name}
                      emphasis={theme.emphasis}
                      explanation={theme.explanation}
                      testId={`theme-${theme.emphasis}-${i}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}
            {moats && moats.length > 0 && (
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--lp-ink-ghost)' }}>
                  ◎ Competitive Moats
                </p>
                <div className="flex flex-wrap gap-1" data-testid="moats">
                  {moats.map((moat, i) => (
                    <TagWithTooltip
                      key={i}
                      name={moat.name}
                      emphasis={moat.emphasis}
                      explanation={moat.explanation}
                      testId={`moat-${moat.emphasis}-${i}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}
            {marketOpportunity && marketOpportunity.length > 0 && (
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--lp-ink-ghost)' }}>
                  ◎ Market Opportunity
                </p>
                <div className="flex flex-wrap gap-1" data-testid="market-opportunity">
                  {marketOpportunity.map((opp, i) => (
                    <TagWithTooltip
                      key={i}
                      name={opp.name}
                      emphasis={opp.emphasis}
                      explanation={opp.explanation}
                      testId={`opportunity-${opp.emphasis}-${i}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}
            {valueCreation && valueCreation.length > 0 && (
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--lp-ink-ghost)' }}>
                  ◈ Value Creation
                </p>
                <div className="flex flex-wrap gap-1" data-testid="value-creation">
                  {valueCreation.map((val, i) => (
                    <TagWithTooltip
                      key={i}
                      name={val.name}
                      emphasis={val.emphasis}
                      explanation={val.explanation}
                      testId={`value-${val.emphasis}-${i}`}
                      getThemeBadgeClasses={getThemeBadgeClasses}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Read Full Thesis collapsible */}
          <Collapsible open={thesisOpen} onOpenChange={setThesisOpen}>
            <div className="flex items-center justify-center mt-3 pt-3 border-t" style={{ borderColor: border }}>
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: 'var(--lp-teal-brand)' }}
                  data-testid="button-toggle-thesis"
                >
                  Read Full Thesis
                  <ChevronDown className={`h-3 w-3 transition-transform ${thesisOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                {investmentThesis.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-mid)' }} data-testid={`text-investment-thesis-p${i + 1}`}>
                    {para}
                  </p>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </SectionCard>

        {/* Business Overview */}
        <SectionCard
          header={`Business Overview — ${ticker}`}
          badge={`${products?.length || 0} products`}
        >
          {/* 2x2 products grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {products.map((product, i) => {
              const Icon = product.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg p-3 border"
                  style={{ background: cream, borderColor: border }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center mb-2"
                    style={{ background: 'var(--lp-teal-ghost)' }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: 'var(--lp-teal-brand)' }} />
                  </div>
                  <p className="text-[11px] font-medium mb-0.5" style={{ color: 'var(--lp-ink)' }}>{product.name}</p>
                  <p className="text-[10px] leading-[1.4]" style={{ color: 'var(--lp-ink-light)' }}>{product.description}</p>
                </div>
              );
            })}
          </div>

          {/* where & how 3-col strip */}
          <div
            className="pt-3 border-t grid grid-cols-3 gap-2.5"
            style={{ borderColor: border }}
          >
            <div>
              <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>
                Reach
              </p>
              <div className="flex flex-wrap gap-1">
                {operations.regions.map((r, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded-sm border"
                    style={{ background: 'var(--lp-teal-ghost)', color: 'var(--lp-teal-mid)', borderColor: border }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>
                Sales
              </p>
              <div className="flex flex-wrap gap-1">
                {operations.channels.map((ch, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-sm border cursor-help"
                        style={{ background: 'var(--lp-teal-ghost)', color: 'var(--lp-teal-mid)', borderColor: border }}
                        data-testid={`badge-channel-${i}`}
                      >
                        {ch.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-2 text-xs">
                      <p>{ch.explanation}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>
                Scale
              </p>
              <p className="text-[10px] leading-[1.4]" style={{ color: 'var(--lp-ink-light)' }}>
                {operations.scale}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── two-col row: Performance · Competition ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Performance Snapshot */}
        <SectionCard header="Performance Snapshot" badge={fiscalYear ? `FY ${fiscalYear}` : undefined}>
          <div className="space-y-2.5">
            {metrics.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="rounded-lg p-3 border"
                style={{ background: cream, borderColor: border }}
              >
                <p className="text-[9px] font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--lp-ink-ghost)' }}>
                  {m.label}
                </p>
                <p
                  className="font-serif text-xl font-bold leading-none"
                  style={{ color: 'var(--lp-ink)', fontFamily: "'Playfair Display', serif" }}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Competition */}
        <SectionCard
          header={`Competition — ${ticker}`}
          badge={`${filteredCompetitors.length} peers`}
        >
          <div className="space-y-1.5">
            {filteredCompetitors.slice(0, 5).map((comp, i) => (
              comp.ticker ? (
                <div
                  key={i}
                  className="rounded-lg border overflow-hidden cursor-pointer"
                  style={{ borderColor: border }}
                  data-testid={`competitor-${i}`}
                >
                  <div
                    className="flex items-center justify-between p-2.5 transition-colors"
                    style={{ background: expandedCompetitor === i ? 'var(--lp-teal-pale)' : cream }}
                    onClick={() => setExpandedCompetitor(expandedCompetitor === i ? null : i)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono text-[9px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 text-white"
                        style={{ background: tealDeep }}
                      >
                        {comp.ticker}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: 'var(--lp-ink)' }}>{comp.name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--lp-ink-ghost)' }}>{comp.focus}</p>
                      </div>
                    </div>
                    {expandedCompetitor === i
                      ? <ChevronUp className="h-3 w-3 flex-shrink-0 ml-2" style={{ color: 'var(--lp-ink-ghost)' }} />
                      : <ChevronDown className="h-3 w-3 flex-shrink-0 ml-2" style={{ color: 'var(--lp-ink-ghost)' }} />
                    }
                  </div>
                  {expandedCompetitor === i && (
                    <div
                      className="px-3 py-2.5 border-t flex items-center justify-between gap-3"
                      style={{ background: 'var(--lp-warm-white)', borderColor: border }}
                    >
                      <p className="text-[10px] leading-relaxed flex-1" style={{ color: 'var(--lp-ink-light)' }}>
                        {comp.focus}
                      </p>
                      <a
                        href={`/stocks/${comp.ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 flex-shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-md border"
                        style={{ color: 'var(--lp-teal-deep)', borderColor: 'rgba(13,74,71,0.2)', background: 'var(--lp-teal-pale)' }}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`competitor-${i}-open-link`}
                      >
                        Open analysis
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border"
                  style={{ background: cream, borderColor: border }}
                  data-testid={`competitor-${i}`}
                >
                  <p className="text-[11px] font-medium" style={{ color: 'var(--lp-ink)' }}>{comp.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--lp-ink-ghost)' }}>{comp.focus}</p>
                </div>
              )
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Changes Over Time (collapsible card) ── */}
      {temporalHasItems && temporalAnalysis && (
        <div
          className="rounded-xl border overflow-hidden bg-white"
          style={{ borderColor: border, boxShadow: '0 2px 20px rgba(13,74,71,0.07)' }}
          data-testid="changes-over-time-wrapper"
        >
          <button
            className="w-full flex items-center justify-between text-left"
            style={{ background: tealDeep, padding: '10px 16px' }}
            onClick={() => setShowTemporalDetail((v) => !v)}
            data-testid="button-toggle-temporal"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="font-mono tracking-[0.04em]"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Mono', monospace" }}
              >
                Changes Over Time
              </span>
              {yearsLabel && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)' }}
                >
                  {yearsLabel}
                </span>
              )}
            </div>
            <span
              className="text-[10px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)' }}
            >
              {showTemporalDetail ? 'Collapse' : 'Expand'}
              {showTemporalDetail
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />
              }
            </span>
          </button>
          {showTemporalDetail && (
            <div style={{ padding: '20px', background: 'white' }}>
              <TemporalAnalysis analysis={temporalAnalysis} companyName={companyName} />
            </div>
          )}
        </div>
      )}

      {/* ── Fine Print (collapsible card) ── */}
      {finePrintAnalysis && (
        <div
          className="rounded-xl border overflow-hidden bg-white"
          style={{ borderColor: border, boxShadow: '0 2px 20px rgba(13,74,71,0.07)' }}
          data-testid="fine-print-wrapper"
        >
          <button
            className="w-full flex items-center justify-between text-left"
            style={{ background: tealDeep, padding: '10px 16px' }}
            onClick={() => setShowFinePrintDetail((v) => !v)}
            data-testid="button-toggle-fine-print"
          >
            <span
              className="font-mono tracking-[0.04em]"
              style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Mono', monospace" }}
            >
              Fine Print Analysis
            </span>
            <span
              className="text-[10px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)' }}
            >
              {showFinePrintDetail ? 'Collapse' : 'Expand'}
              {showFinePrintDetail
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />
              }
            </span>
          </button>
          {showFinePrintDetail && (
            <div style={{ padding: '20px', background: 'white' }}>
              <FinePrintAnalysis analysis={finePrintAnalysis} companyName={companyName} />
            </div>
          )}
        </div>
      )}

      {/* ── bottom CTA: teaser for Stage 2 ── */}
      <div
        className="rounded-xl px-6 py-5 flex items-center justify-between relative overflow-hidden"
        style={{ background: tealDeep }}
        data-testid="stage-1-cta"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 80% at 100% 50%, rgba(77,184,176,0.15) 0%, transparent 60%)' }}
        />
        <div className="relative z-10">
          <p
            className="text-[9px] font-medium uppercase tracking-widest mb-1"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Stage 1 complete
          </p>
          <p
            className="text-[17px] font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            You know the business.{' '}
            <em className="italic" style={{ color: 'var(--lp-teal-light)' }}>Is it financially strong?</em>
          </p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Next: revenue growth, profit quality, debt, and cash flow — all in plain English.
          </p>
        </div>
        <button
          className="relative z-10 flex items-center gap-2 rounded-lg text-[12px] font-medium px-5 py-2.5 flex-shrink-0 ml-6 transition-opacity hover:opacity-90"
          style={{ background: 'white', color: tealDeep, fontFamily: "'DM Sans', sans-serif" }}
          data-testid="button-cta-performance"
          onClick={() => onStageChange?.(2)}
        >
          Check Performance →
        </button>
      </div>

    </div>
    </TooltipProvider>
  );
}
