import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, ChevronDown, ChevronUp, AlertTriangle, Info, ArrowRight, ExternalLink, Users, GripVertical, X, Layers } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onMobileScroll?: () => void;
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

function SectionCard({ header, badge, children, className = '', collapsed, onToggle }: {
  header: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const isCollapsible = collapsed !== undefined && onToggle !== undefined;
  return (
    <div
      className={`rounded-xl overflow-hidden border ${className}`}
      style={{ borderColor: border, boxShadow: '0 2px 20px rgba(13,74,71,0.07)' }}
    >
      {isCollapsible ? (
        <button
          className="w-full"
          onClick={onToggle}
          type="button"
        >
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ background: tealDeep }}
          >
            <span className="font-mono text-[11px] tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {header}
            </span>
            <div className="flex items-center gap-2">
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
              {collapsed
                ? <ChevronDown className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.7)' }} />
                : <ChevronUp className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.7)' }} />
              }
            </div>
          </div>
        </button>
      ) : (
        <CardHeader label={header} badge={badge} />
      )}
      {!collapsed && <div className="bg-white p-4">{children}</div>}
    </div>
  );
}

/* ─── Discovery Builder DnD sub-components ────────────────── */

function BuilderDraggableTag({ id, tag, side }: { id: string; tag: string; side: "available" | "selected" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
    ...(side === "selected"
      ? { background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)", borderColor: "rgba(13,74,71,0.15)" }
      : { background: "transparent", color: "var(--lp-ink-light, #666)", borderColor: "var(--border)" }),
  };
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium select-none"
      style={style}
      data-testid={`builder-drag-${side}-${tag.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <GripVertical className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
      <span>{tag}</span>
    </div>
  );
}

function BuilderDropZone({ id, children, className, style }: { id: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{ ...style, outline: isOver ? "2px solid var(--lp-teal-brand, #1a6b67)" : undefined, outlineOffset: "-2px" }}
    >
      {children}
    </div>
  );
}

interface DiscoveryBuilderProps {
  investmentThemes?: InvestmentTheme[];
  moats?: Moat[];
  marketOpportunity?: MarketOpportunity[];
  valueCreation?: ValueCreation[];
  competitors?: Competitor[];
  ticker: string;
  companyName: string;
  basketTags: string[];
  setBasketTags: React.Dispatch<React.SetStateAction<string[]>>;
}

function DiscoveryBuilder({ investmentThemes, moats, marketOpportunity, valueCreation, competitors, ticker, companyName, basketTags, setBasketTags }: DiscoveryBuilderProps) {
  const allTags = useMemo(() => {
    const tags: string[] = [];
    investmentThemes?.forEach((t) => tags.push(t.name));
    moats?.forEach((m) => tags.push(m.name));
    marketOpportunity?.forEach((o) => tags.push(o.name));
    valueCreation?.forEach((v) => tags.push(v.name));
    competitors?.filter((c) => c.name).forEach((c) => tags.push(c.name));
    return Array.from(new Set(tags));
  }, [investmentThemes, moats, marketOpportunity, valueCreation, competitors]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const availableTags = useMemo(
    () => allTags.filter((t) => !basketTags.includes(t)),
    [allTags, basketTags]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const tag = activeId.replace(/^(avail|sel):/, "");
    const isFromAvailable = activeId.startsWith("avail:");
    const isOverBasket = overId === "builder-basket-zone" || overId.startsWith("sel:");
    const isOverAvailable = overId === "builder-available-zone" || overId.startsWith("avail:");

    if (isFromAvailable && isOverBasket) {
      if (!basketTags.includes(tag)) setBasketTags((prev) => [...prev, tag]);
    } else if (!isFromAvailable && isOverAvailable) {
      setBasketTags((prev) => prev.filter((t) => t !== tag));
    }
  }, [basketTags]);

  const handleShowResults = () => {
    const tags = basketTags.length > 0 ? basketTags : allTags;
    const params = new URLSearchParams();
    if (tags.length > 0) params.set("tags", tags.join(","));
    params.set("origin", ticker);
    params.set("name", companyName);
    window.open(`/discover?${params.toString()}`, "_blank");
  };

  if (allTags.length === 0) return null;

  return (
    <div className="pt-3 mt-3 border-t" style={{ borderColor: border }}>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <button
            className="flex items-center gap-1.5 w-full text-left text-[11px] font-medium mb-2"
            style={{ color: 'var(--lp-teal-brand)' }}
            data-testid="button-toggle-discovery-builder"
          >
            <Layers className="h-3 w-3" />
            <span>Discovery Builder</span>
            <ChevronDown className="h-3 w-3 ml-auto transition-transform" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--lp-ink-ghost)' }}>
                  Available Tags
                </p>
                <SortableContext items={availableTags.map((t) => `avail:${t}`)} strategy={rectSortingStrategy}>
                  <BuilderDropZone
                    id="builder-available-zone"
                    className="min-h-[48px] rounded-md border border-dashed p-1.5 flex flex-wrap gap-1"
                    style={{ borderColor: border }}
                  >
                    {availableTags.map((tag) => (
                      <BuilderDraggableTag key={`avail:${tag}`} id={`avail:${tag}`} tag={tag} side="available" />
                    ))}
                    {availableTags.length === 0 && (
                      <span className="text-[9px] py-1 px-0.5" style={{ color: 'var(--lp-ink-ghost)' }}>All tags selected</span>
                    )}
                  </BuilderDropZone>
                </SortableContext>
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-widest mb-1.5 flex items-center" style={{ color: 'var(--lp-ink-ghost)' }}>
                  Discovery Basket
                  {basketTags.length > 0 && (
                    <button
                      onClick={() => setBasketTags([])}
                      className="text-[9px] underline underline-offset-2 ml-auto normal-case tracking-normal font-normal"
                      style={{ color: 'var(--lp-ink-ghost)' }}
                      data-testid="button-builder-clear-basket"
                    >
                      Clear
                    </button>
                  )}
                </p>
                <SortableContext items={basketTags.map((t) => `sel:${t}`)} strategy={rectSortingStrategy}>
                  <BuilderDropZone
                    id="builder-basket-zone"
                    className="min-h-[48px] rounded-md border border-dashed p-1.5 flex flex-wrap gap-1"
                    style={{ borderColor: basketTags.length > 0 ? 'var(--lp-teal-deep, #0d4a47)' : border }}
                  >
                    {basketTags.map((tag) => (
                      <div key={`sel:${tag}`} className="inline-flex items-center gap-0.5">
                        <BuilderDraggableTag id={`sel:${tag}`} tag={tag} side="selected" />
                        <button
                          onClick={() => setBasketTags((prev) => prev.filter((t) => t !== tag))}
                          className="p-0.5 rounded"
                          style={{ color: 'var(--lp-teal-deep, #0d4a47)' }}
                          data-testid={`button-builder-remove-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {basketTags.length === 0 && (
                      <span className="text-[9px] py-1 px-0.5" style={{ color: 'var(--lp-ink-ghost)' }}>Drop tags here</span>
                    )}
                  </BuilderDropZone>
                </SortableContext>
              </div>
            </div>
            <DragOverlay>
              {activeDragId ? (
                <div className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium bg-white shadow-md">
                  <GripVertical className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
                  <span>{activeDragId.replace(/^(avail|sel):/, "")}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          <div className="flex justify-center mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleShowResults}
              data-testid="button-builder-show-results"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Show Results
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ─── Desktop Discovery Sidebar ────────────────────────────── */

function useIsDesktop(breakpoint = 1200) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false
  );
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isDesktop;
}

interface DesktopDiscoverySidebarProps {
  investmentThemes?: InvestmentTheme[];
  moats?: Moat[];
  marketOpportunity?: MarketOpportunity[];
  valueCreation?: ValueCreation[];
  competitors?: Competitor[];
  ticker: string;
  companyName: string;
  basketTags: string[];
  setBasketTags: React.Dispatch<React.SetStateAction<string[]>>;
}

function DesktopDiscoverySidebar({
  investmentThemes,
  moats,
  marketOpportunity,
  valueCreation,
  competitors,
  ticker,
  companyName,
  basketTags,
  setBasketTags,
}: DesktopDiscoverySidebarProps) {
  const allTags = useMemo(() => {
    const tags: string[] = [];
    investmentThemes?.forEach((t) => tags.push(t.name));
    moats?.forEach((m) => tags.push(m.name));
    marketOpportunity?.forEach((o) => tags.push(o.name));
    valueCreation?.forEach((v) => tags.push(v.name));
    competitors?.filter((c) => c.name).forEach((c) => tags.push(c.name));
    return Array.from(new Set(tags));
  }, [investmentThemes, moats, marketOpportunity, valueCreation, competitors]);

  const handleShowResults = () => {
    const tags = basketTags.length > 0 ? basketTags : allTags;
    const params = new URLSearchParams();
    if (tags.length > 0) params.set("tags", tags.join(","));
    params.set("origin", ticker);
    params.set("name", companyName);
    window.open(`/discover?${params.toString()}`, "_blank");
  };

  const availableTags = allTags.filter((t) => !basketTags.includes(t));

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: "desktop-sidebar-drop" });

  if (allTags.length === 0) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: border,
        boxShadow: '0 2px 20px rgba(13,74,71,0.07)',
        position: 'sticky',
        top: '120px',
      }}
      data-testid="desktop-discovery-sidebar"
    >
      <div
        className="flex items-center gap-1.5 px-4 py-2.5"
        style={{ background: tealDeep }}
      >
        <Layers className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.7)' }} />
        <span className="font-mono text-[11px] tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Discovery Builder
        </span>
      </div>
      <div
        ref={setDropRef}
        className="bg-white p-4 space-y-3"
        style={{ outline: isOver ? '2px solid var(--lp-teal-brand, #1a6b67)' : undefined, outlineOffset: isOver ? '-2px' : undefined }}
      >
        {basketTags.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: 'var(--lp-ink-ghost)' }}>
                Selected Tags
              </p>
              <button
                onClick={() => setBasketTags([])}
                className="text-[9px] underline underline-offset-2"
                style={{ color: 'var(--lp-ink-ghost)' }}
                data-testid="button-sidebar-clear"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {basketTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium cursor-pointer transition-transform hover:-translate-y-[1px]"
                  style={{ background: tealPale, color: 'var(--lp-teal-deep)', borderColor: 'rgba(13,74,71,0.15)' }}
                  data-testid={`sidebar-tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {tag}
                  <button
                    onClick={() => setBasketTags((prev) => prev.filter((t) => t !== tag))}
                    className="ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
            Click tags from the analysis to add them here, then discover similar companies.
          </p>
        )}

        {availableTags.length > 0 && (
          <>
            <p className="text-[9px] font-medium uppercase tracking-widest pt-1" style={{ color: 'var(--lp-ink-ghost)' }}>
              {basketTags.length > 0 ? 'Available' : 'Click to add'}
            </p>
            <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setBasketTags((prev) => [...prev, tag])}
                  className="text-[10px] px-2 py-0.5 rounded-full border font-medium cursor-pointer transition-transform hover:-translate-y-[1px]"
                  style={{ background: 'transparent', color: 'var(--lp-ink-light)', borderColor: 'var(--border)' }}
                  data-testid={`sidebar-avail-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 mt-2"
          onClick={handleShowResults}
          data-testid="button-sidebar-show-similar"
        >
          <Users className="h-3.5 w-3.5" />
          {basketTags.length > 0 ? 'Show Similar Companies' : `Discover Similar to ${ticker}`}
        </Button>
      </div>
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
  onMobileScroll,
}: SummaryCardProps) {
  const [thesisOpen, setThesisOpen] = useState(false);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [sidebarBasketTags, setSidebarBasketTags] = useState<string[]>([]);
  const [sidebarDragActiveTag, setSidebarDragActiveTag] = useState<string | null>(null);

  const sidebarDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleSidebarDragStart = useCallback((event: DragStartEvent) => {
    const current = event.active.data?.current;
    const tag = current && typeof current === 'object' && 'tag' in current ? (current as { tag: string }).tag : null;
    if (tag) setSidebarDragActiveTag(tag);
  }, []);

  const handleSidebarDragEnd = useCallback((event: DragEndEvent) => {
    setSidebarDragActiveTag(null);
    const { active, over } = event;
    if (!over) return;
    const current = active.data?.current;
    const tag = current && typeof current === 'object' && 'tag' in current ? (current as { tag: string }).tag : null;
    if (!tag) return;
    if (over.id === "desktop-sidebar-drop") {
      setSidebarBasketTags((prev) => prev.includes(tag) ? prev : [...prev, tag]);
    }
  }, []);

  const mobileGateFiredRef = useRef(false);
  const mobileExpansionCountRef = useRef(0);
  const mobileExpansionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMobileSection = (section: string) => {
    setMobileExpandedSection(prev => {
      const isExpanding = prev !== section;
      if (isExpanding && onMobileScroll && !mobileGateFiredRef.current) {
        mobileExpansionCountRef.current += 1;
        if (mobileExpansionCountRef.current >= 3 && !mobileExpansionTimerRef.current) {
          mobileExpansionTimerRef.current = setTimeout(() => {
            if (!mobileGateFiredRef.current) {
              mobileGateFiredRef.current = true;
              onMobileScroll();
            }
          }, 4000);
        }
      }
      return isExpanding ? section : null;
    });
  };

  useEffect(() => {
    return () => {
      if (mobileExpansionTimerRef.current) {
        clearTimeout(mobileExpansionTimerRef.current);
      }
    };
  }, []);

  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);

  const showTemporalDetail = isMobile ? mobileExpandedSection === 'changesOverTime' : true;
  const showFinePrintDetail = isMobile ? mobileExpandedSection === 'finePrint' : true;
  const [desktopShowTemporal, setDesktopShowTemporal] = useState(true);
  const [desktopShowFinePrint, setDesktopShowFinePrint] = useState(true);
  const effectiveShowTemporal = isMobile ? showTemporalDetail : desktopShowTemporal;
  const effectiveShowFinePrint = isMobile ? showFinePrintDetail : desktopShowFinePrint;

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
    <div className={`w-full mx-auto space-y-5 pb-16 animate-fade-in ${isDesktop ? 'max-w-[1400px]' : 'max-w-5xl'}`} data-testid="stage-1-content">

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

      {/* ── Desktop: 3-col grid / Mobile: stacked ── */}
      <DndContext
        sensors={sidebarDndSensors}
        onDragStart={handleSidebarDragStart}
        onDragEnd={handleSidebarDragEnd}
      >
      <div
        className="gap-4"
        style={isDesktop ? {
          display: 'grid',
          gridTemplateColumns: '1.4fr 1.2fr 320px',
          alignItems: 'start',
        } : {
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* ── Left column ── */}
        <div className="space-y-4">

        {/* Investment Thesis */}
        <SectionCard
          header={`Investment Thesis — ${ticker}`}
          badge={`${(investmentThemes?.length || 0) + (moats?.length || 0) > 0 ? Math.round(((investmentThemes?.length || 0) + (moats?.length || 0)) / 2) : 4} themes`}
          collapsed={isMobile ? mobileExpandedSection !== 'investmentThesis' : undefined}
          onToggle={isMobile ? () => toggleMobileSection('investmentThesis') : undefined}
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
                      draggable={isDesktop}
                      dragIdSuffix={`theme-${i}`}
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
                      draggable={isDesktop}
                      dragIdSuffix={`moat-${i}`}
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
                      draggable={isDesktop}
                      dragIdSuffix={`opp-${i}`}
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
                      draggable={isDesktop}
                      dragIdSuffix={`val-${i}`}
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

          <div className="pt-3 mt-3 border-t flex justify-center" style={{ borderColor: border }}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const params = new URLSearchParams();
                const allTagNames = [
                  ...(investmentThemes?.map((t) => t.name) || []),
                  ...(moats?.map((m) => m.name) || []),
                  ...(marketOpportunity?.map((o) => o.name) || []),
                  ...(valueCreation?.map((v) => v.name) || []),
                  ...(competitors?.filter((c) => c.name).map((c) => c.name) || []),
                ];
                const uniqueTags = Array.from(new Set(allTagNames));
                if (uniqueTags.length > 0) params.set("tags", uniqueTags.join(","));
                params.set("origin", ticker);
                params.set("name", companyName);
                window.open(`/discover?${params.toString()}`, "_blank");
              }}
              data-testid="button-show-similar-companies"
            >
              <Users className="h-3.5 w-3.5" />
              Show Companies Similar to {ticker}
            </Button>
          </div>

          {!isDesktop && (
            <DiscoveryBuilder
              investmentThemes={investmentThemes}
              moats={moats}
              marketOpportunity={marketOpportunity}
              valueCreation={valueCreation}
              competitors={filteredCompetitors}
              ticker={ticker}
              companyName={companyName}
              basketTags={sidebarBasketTags}
              setBasketTags={setSidebarBasketTags}
            />
          )}
        </SectionCard>

        </div>

        {/* ── Center column ── */}
        <div className="space-y-4">

        {/* Performance Snapshot */}
        <SectionCard
          header="Performance Snapshot"
          badge={fiscalYear ? `FY ${fiscalYear}` : undefined}
          collapsed={isMobile ? mobileExpandedSection !== 'performanceSnapshot' : undefined}
          onToggle={isMobile ? () => toggleMobileSection('performanceSnapshot') : undefined}
        >
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
          collapsed={isMobile ? mobileExpandedSection !== 'competition' : undefined}
          onToggle={isMobile ? () => toggleMobileSection('competition') : undefined}
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

        {/* Business Overview */}
        <SectionCard
          header={`Business Overview — ${ticker}`}
          badge={`${products?.length || 0} products`}
          collapsed={isMobile ? mobileExpandedSection !== 'businessOverview' : undefined}
          onToggle={isMobile ? () => toggleMobileSection('businessOverview') : undefined}
        >
          {/* products grid — clean vertical tiles */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {products.map((product, i) => {
              const Icon = product.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg p-3 border"
                  style={{ background: cream, borderColor: border }}
                >
                  <Icon className="h-5 w-5 mb-2" style={{ color: 'var(--lp-teal-brand)' }} />
                  <p className="text-[11px] font-semibold leading-snug mb-1" style={{ color: 'var(--lp-ink)' }}>{product.name}</p>
                  <p className="text-[10px] leading-snug line-clamp-2" style={{ color: 'var(--lp-ink-light)' }}>{product.description}</p>
                </div>
              );
            })}
          </div>

          {/* where & how 3-col strip */}
          <div
            className="pt-3 border-t grid grid-cols-3 gap-3"
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
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                {operations.scale}
              </p>
            </div>
          </div>
        </SectionCard>

        </div>

        {/* ── Right column: Desktop Discovery Sidebar ── */}
        {isDesktop && (
          <DesktopDiscoverySidebar
            investmentThemes={investmentThemes}
            moats={moats}
            marketOpportunity={marketOpportunity}
            valueCreation={valueCreation}
            competitors={filteredCompetitors}
            ticker={ticker}
            companyName={companyName}
            basketTags={sidebarBasketTags}
            setBasketTags={setSidebarBasketTags}
          />
        )}
      </div>
      <DragOverlay>
        {sidebarDragActiveTag ? (
          <div
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-medium bg-white shadow-md"
            style={{ color: 'var(--lp-teal-deep)', borderColor: 'rgba(13,74,71,0.15)' }}
          >
            <GripVertical className="h-2.5 w-2.5 opacity-40 flex-shrink-0" />
            {sidebarDragActiveTag}
          </div>
        ) : null}
      </DragOverlay>
      </DndContext>

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
            onClick={() => isMobile ? toggleMobileSection('changesOverTime') : setDesktopShowTemporal((v) => !v)}
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
              {effectiveShowTemporal ? 'Collapse' : 'Expand'}
              {effectiveShowTemporal
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />
              }
            </span>
          </button>
          {effectiveShowTemporal && (
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
            onClick={() => isMobile ? toggleMobileSection('finePrint') : setDesktopShowFinePrint((v) => !v)}
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
              {effectiveShowFinePrint ? 'Collapse' : 'Expand'}
              {effectiveShowFinePrint
                ? <ChevronUp className="h-3 w-3" />
                : <ChevronDown className="h-3 w-3" />
              }
            </span>
          </button>
          {effectiveShowFinePrint && (
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
