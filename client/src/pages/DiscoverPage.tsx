import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Shield,
  Lightbulb,
  TrendingUp,
  Building2,
  BarChart3,
  Eye,
  Zap,
  X,
  SlidersHorizontal,
  Users,
  Sparkles,
  Tag,
  ChevronDown,
  ArrowLeft,
  GripVertical,
  Layers,
  Info,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiscoverCompany {
  ticker: string;
  name: string;
  tagline: string;
  grade: string;
  gradeScore: number;
  moatCount: number;
  themeCount: number;
  valueCount: number;
  topMoat: string;
  topTheme: string;
  topValue: string;
  analysisDepth: string;
  fiscalYear: string;
  moatTags: string[];
  themeTags: string[];
  quadrant: string;
}

interface SimilarResponse {
  ticker: string;
  baseName: string;
  similar: DiscoverCompany[];
}

type SortMode = "highest" | "lowest" | "az" | "za" | "moats" | "newest";
type FilterMode = "any" | "all";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const gradeColors: Record<string, string> = {
  A: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  B: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  C: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  F: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function tagMatchesCompany(tag: string, company: DiscoverCompany): boolean {
  const t = tag.toLowerCase();
  return (
    company.moatTags.some((m) => m.toLowerCase().includes(t) || t.includes(m.toLowerCase())) ||
    company.themeTags.some((th) => th.toLowerCase().includes(t) || t.includes(th.toLowerCase()))
  );
}

function getMatchedTags(selectedTags: string[], company: DiscoverCompany): string[] {
  return selectedTags.filter((tag) => tagMatchesCompany(tag, company));
}

function buildTagFreqs(companies: DiscoverCompany[], field: "moatTags" | "themeTags") {
  const countMap = new Map<string, number>();
  const displayForm = new Map<string, string>();
  for (const c of companies) {
    const seen = new Set<string>();
    for (const tag of c[field]) {
      const trimmed = tag.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (!displayForm.has(key)) displayForm.set(key, trimmed);
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
  }
  return Array.from(countMap.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ tag: displayForm.get(key)!, count }));
}

// ─── GradeBadge ──────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold flex-shrink-0 ${gradeColors[grade] || gradeColors.C}`}
      data-testid={`badge-grade-${grade}`}
    >
      {grade}
    </span>
  );
}

// ─── SimilarMiniCard ─────────────────────────────────────────────────────────

function SimilarMiniCard({
  company,
  baseMoatTags,
  baseThemeTags,
}: {
  company: DiscoverCompany;
  baseMoatTags: string[];
  baseThemeTags: string[];
}) {
  const [, navigate] = useLocation();
  const overlapTags = [
    ...company.moatTags.filter((t) => baseMoatTags.includes(t)),
    ...company.themeTags.filter((t) => baseThemeTags.includes(t)),
  ].slice(0, 2);

  return (
    <Card
      className="p-3 hover-elevate cursor-pointer flex-shrink-0 w-44 flex flex-col gap-1.5"
      onClick={() => navigate(`/stocks/${company.ticker}`)}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{company.name}</p>
        <GradeBadge grade={company.grade} />
      </div>
      <Badge variant="secondary" className="text-[10px] self-start">{company.ticker}</Badge>
      {overlapTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {overlapTags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium leading-tight"
              style={{ background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── ByTagMiniCard ────────────────────────────────────────────────────────────

function ByTagMiniCard({
  company,
  focusedTag,
}: {
  company: { ticker: string; name: string; tagline: string; fiscalYear: string; moatTags: string[]; themeTags: string[]; matchType: "moat" | "theme" | "both" };
  focusedTag: string;
}) {
  const [, navigate] = useLocation();
  const matchTypeLabel =
    company.matchType === "both" ? "Moat + Theme" : company.matchType === "moat" ? "Moat" : "Theme";
  const otherTags = [
    ...company.moatTags.filter((t) => t !== focusedTag).slice(0, 1),
    ...company.themeTags.filter((t) => t !== focusedTag).slice(0, 1),
  ].slice(0, 2);

  return (
    <Card
      className="p-3 hover-elevate cursor-pointer flex-shrink-0 w-48 flex flex-col gap-1.5"
      onClick={() => navigate(`/stocks/${company.ticker}`)}
      data-testid={`card-bytag-${company.ticker}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{company.name}</p>
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap"
          style={{ background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)" }}
        >
          {matchTypeLabel}
        </span>
      </div>
      <Badge variant="secondary" className="text-[10px] self-start">{company.ticker}</Badge>
      {company.tagline && (
        <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{company.tagline}</p>
      )}
      {otherTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {otherTags.map((t) => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 rounded-sm font-medium leading-tight"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── StockTile ───────────────────────────────────────────────────────────────

function StockTile({
  company,
  selectedTags,
  onFindSimilar,
}: {
  company: DiscoverCompany;
  selectedTags: string[];
  onFindSimilar: (ticker: string) => void;
}) {
  const [, navigate] = useLocation();
  const matchedTags = selectedTags.length > 0 ? getMatchedTags(selectedTags, company) : [];

  return (
    <div className="relative h-full group" data-testid={`card-stock-${company.ticker}`}>
      <Card
        className="h-full p-4 hover-elevate cursor-pointer flex flex-col"
        onClick={() => navigate(`/stocks/${company.ticker}`)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" data-testid={`text-name-${company.ticker}`}>
              {company.name}
            </p>
            <Badge variant="secondary" className="text-xs mt-1">
              {company.ticker}
            </Badge>
          </div>
          <GradeBadge grade={company.grade} />
        </div>

        <p
          className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-1"
          data-testid={`text-tagline-${company.ticker}`}
        >
          {company.tagline}
        </p>

        {matchedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {matchedTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                style={{ background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1" title="Competitive Moats">
            <Shield className="h-3 w-3" />
            {company.moatCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Investment Themes">
            <Lightbulb className="h-3 w-3" />
            {company.themeCount}
          </span>
          <span className="inline-flex items-center gap-1" title="Value Drivers">
            <TrendingUp className="h-3 w-3" />
            {company.valueCount}
          </span>
        </div>
      </Card>

      <button
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--lp-teal-deep, #0d4a47)" }}
        onClick={(e) => { e.stopPropagation(); onFindSimilar(company.ticker); }}
        data-testid={`button-find-similar-${company.ticker}`}
        title="Find similar companies"
      >
        <Users className="h-3 w-3" />
        Similar
      </button>
    </div>
  );
}

// ─── SkeletonTile ─────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <Card className="h-full p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse flex-shrink-0" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-8 bg-muted rounded animate-pulse" />
        <div className="h-3 w-8 bg-muted rounded animate-pulse" />
        <div className="h-3 w-8 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const howItWorks = [
  {
    icon: Building2,
    title: "Understand the Business",
    desc: "AI reads the full 10-K filing and extracts what the company does, who it serves, and how it makes money.",
  },
  {
    icon: BarChart3,
    title: "Track Changes Over Time",
    desc: "See what's new, what's fading, and what has stayed consistent across years of filings.",
  },
  {
    icon: Eye,
    title: "Evaluate Strength",
    desc: "Review competitive moats, value drivers, and market positioning to assess durability.",
  },
  {
    icon: Zap,
    title: "Act with Confidence",
    desc: "Combine business understanding with market signals to make informed investment decisions.",
  },
];

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function TagPill({
  tag,
  count,
  active,
  onClick,
}: {
  tag: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
      style={
        active
          ? { background: "var(--lp-teal-deep, #0d4a47)", color: "white", borderColor: "var(--lp-teal-deep, #0d4a47)" }
          : { background: "transparent", color: "var(--lp-ink-light)", borderColor: "var(--border)" }
      }
      data-testid={`tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
    >
      {tag}
      {count !== undefined && (
        <span
          className="text-[10px] opacity-60 font-normal"
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── DroppableZone ───────────────────────────────────────────────────────────

function DroppableZone({ id, children, className, style: zoneStyle }: { id: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        ...zoneStyle,
        outline: isOver ? "2px solid var(--lp-teal-brand, #1a6b67)" : undefined,
        outlineOffset: isOver ? "-2px" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ─── DraggableTag ────────────────────────────────────────────────────────────

function DraggableTag({ id, tag, count, side }: { id: string; tag: string; count?: number; side: "available" | "selected" }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const isSelected = side === "selected";
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium cursor-grab active:cursor-grabbing select-none"
      data-testid={`dnd-tag-${side}-${tag.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <GripVertical className="h-3 w-3 opacity-40 flex-shrink-0" />
      <span
        style={
          isSelected
            ? { color: "var(--lp-teal-deep, #0d4a47)" }
            : { color: "var(--lp-ink-light)" }
        }
      >
        {tag}
      </span>
      {count !== undefined && (
        <span className="text-[10px] opacity-60 font-normal">{count}</span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ByTagCompany {
  ticker: string;
  name: string;
  tagline: string;
  fiscalYear: string;
  moatTags: string[];
  themeTags: string[];
  matchType: "moat" | "theme" | "both";
}

export default function DiscoverPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("highest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("any");
  const [similarTicker, setSimilarTicker] = useState<string | null>(null);
  const [focusedTag, setFocusedTag] = useState<string | null>(null);
  const [originTicker, setOriginTicker] = useState<string | null>(null);
  const [originName, setOriginName] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themes = params.get("themes");
    const moatsParam = params.get("moats");
    const tagsParam = params.get("tags");
    const origin = params.get("origin");
    const name = params.get("name");

    const tags: string[] = [];
    if (tagsParam) tags.push(...tagsParam.split(",").map((t) => t.trim()).filter(Boolean));
    if (themes) tags.push(...themes.split(",").map((t) => t.trim()).filter(Boolean));
    if (moatsParam) tags.push(...moatsParam.split(",").map((t) => t.trim()).filter(Boolean));
    const uniqueTags = [...new Set(tags)];
    if (uniqueTags.length > 0) setSelectedTags(uniqueTags);
    if (origin) setOriginTicker(origin);
    if (name) setOriginName(name);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<{ companies: DiscoverCompany[] }>({
    queryKey: ["/api/discover"],
  });

  const { data: similarData, isLoading: similarLoading } = useQuery<SimilarResponse>({
    queryKey: [`/api/discover/similar?ticker=${similarTicker}`],
    enabled: !!similarTicker,
  });

  const { data: byTagData, isLoading: byTagLoading } = useQuery<{ tag: string; companies: ByTagCompany[] }>({
    queryKey: [`/api/discover/by-tag?tag=${encodeURIComponent(focusedTag || "")}`],
    enabled: !!focusedTag,
  });

  const companies = data?.companies || [];

  // ── Tag frequency memos ───────────────────────────────────────────────────

  const moatTagFreqs = useMemo(() => buildTagFreqs(companies, "moatTags"), [companies]);
  const themeTagFreqs = useMemo(() => buildTagFreqs(companies, "themeTags"), [companies]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
    setFilterMode("any");
    setOriginTicker(null);
    setOriginName(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const tag = activeId.replace(/^(avail|sel):/, "");
    const isFromAvailable = activeId.startsWith("avail:");
    const isOverSelected = overId === "selected-drop-zone" || overId.startsWith("sel:");
    const isOverAvailable = overId === "available-drop-zone" || overId.startsWith("avail:");

    if (isFromAvailable && isOverSelected) {
      if (!selectedTags.includes(tag)) {
        setSelectedTags((prev) => [...prev, tag]);
      }
    } else if (!isFromAvailable && isOverAvailable) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    }
  };

  // ── Filtered + sorted companies ───────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...companies];

    if (selectedTags.length > 0) {
      list = list.filter((c) =>
        filterMode === "all"
          ? selectedTags.every((tag) => tagMatchesCompany(tag, c))
          : selectedTags.some((tag) => tagMatchesCompany(tag, c))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.moatTags.some((t) => t.toLowerCase().includes(q)) ||
          c.themeTags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (gradeFilter !== "all") {
      list = list.filter((c) => c.grade === gradeFilter);
    }

    switch (sortMode) {
      case "highest":
        list.sort((a, b) => b.gradeScore - a.gradeScore);
        break;
      case "lowest":
        list.sort((a, b) => a.gradeScore - b.gradeScore);
        break;
      case "az":
        list.sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
      case "za":
        list.sort((a, b) => b.ticker.localeCompare(a.ticker));
        break;
      case "moats":
        list.sort((a, b) => b.moatCount - a.moatCount || b.gradeScore - a.gradeScore);
        break;
      case "newest":
        list.sort((a, b) => Number(b.fiscalYear) - Number(a.fiscalYear) || b.gradeScore - a.gradeScore);
        break;
    }

    return list;
  }, [companies, searchQuery, gradeFilter, sortMode, selectedTags, filterMode]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const c of companies) {
      if (counts[c.grade] !== undefined) counts[c.grade]++;
    }
    return counts;
  }, [companies]);

  // ── Related tags ──────────────────────────────────────────────────────────

  const relatedTags = useMemo(() => {
    if (selectedTags.length === 0) return [];
    const freq = new Map<string, number>();
    for (const c of filtered) {
      for (const tag of [...c.moatTags, ...c.themeTags]) {
        const key = tag.toLowerCase();
        if (selectedTags.some((s) => s.toLowerCase() === key)) continue;
        freq.set(tag, (freq.get(tag) || 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [filtered, selectedTags]);

  // ── Insights ──────────────────────────────────────────────────────────────

  const insights = useMemo(() => {
    if (filtered.length === companies.length && selectedTags.length === 0) return null;
    const moatFreq = new Map<string, number>();
    const themeFreq = new Map<string, number>();
    const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const c of filtered) {
      for (const t of c.moatTags) moatFreq.set(t, (moatFreq.get(t) || 0) + 1);
      for (const t of c.themeTags) themeFreq.set(t, (themeFreq.get(t) || 0) + 1);
      if (grades[c.grade] !== undefined) grades[c.grade]++;
    }
    const topMoat = Array.from(moatFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    const topTheme = Array.from(themeFreq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    return { topMoat, topTheme, grades };
  }, [filtered, companies, selectedTags]);

  const isScreenerActive = selectedTags.length > 0;

  // ── Tag Clusters ──────────────────────────────────────────────────────────

  const clusters = useMemo(() => {
    if (companies.length === 0) return [];

    const cooccur = new Map<string, Map<string, number>>();
    const tagFreq = new Map<string, number>();
    const tagDisplay = new Map<string, string>();

    for (const c of companies) {
      const tags: string[] = [];
      const seen = new Set<string>();
      for (const t of [...c.moatTags, ...c.themeTags]) {
        const trimmed = t.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tags.push(key);
        if (!tagDisplay.has(key)) tagDisplay.set(key, trimmed);
        tagFreq.set(key, (tagFreq.get(key) || 0) + 1);
      }
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const a = tags[i];
          const b = tags[j];
          if (!cooccur.has(a)) cooccur.set(a, new Map());
          if (!cooccur.has(b)) cooccur.set(b, new Map());
          cooccur.get(a)!.set(b, (cooccur.get(a)!.get(b) || 0) + 1);
          cooccur.get(b)!.set(a, (cooccur.get(b)!.get(a) || 0) + 1);
        }
      }
    }

    const sortedTags = Array.from(tagFreq.entries())
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);

    const assigned = new Set<string>();
    const result: { name: string; tags: string[]; count: number }[] = [];

    for (const seed of sortedTags) {
      if (assigned.has(seed)) continue;
      if (result.length >= 4) break;

      const comap = cooccur.get(seed) || new Map<string, number>();
      const partners = Array.from(comap.entries())
        .filter(([key]) => !assigned.has(key) && (tagFreq.get(key) || 0) >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key]) => key);

      if (partners.length < 2) continue;

      const clusterKeys = [seed, ...partners];
      clusterKeys.forEach((k) => assigned.add(k));

      const clusterSet = new Set(clusterKeys);
      const count = companies.filter((c) => {
        const compTags = new Set(
          [...c.moatTags, ...c.themeTags].map((t) => t.toLowerCase().trim())
        );
        let matches = 0;
        for (const key of Array.from(clusterSet)) {
          if (compTags.has(key)) matches++;
        }
        return matches >= 2;
      }).length;

      result.push({
        name: tagDisplay.get(seed)!,
        tags: clusterKeys.map((k) => tagDisplay.get(k)!).filter(Boolean),
        count,
      });
    }

    return result;
  }, [companies]);

  // ── Tag Frequency Chart ───────────────────────────────────────────────────

  const freqChartData = useMemo(() => {
    const source = filtered.length < companies.length ? filtered : companies;
    const freq = new Map<string, number>();
    const displayForm = new Map<string, string>();

    for (const c of source) {
      const seen = new Set<string>();
      for (const tag of [...c.moatTags, ...c.themeTags]) {
        const trimmed = tag.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        if (!displayForm.has(key)) displayForm.set(key, trimmed);
        freq.set(key, (freq.get(key) || 0) + 1);
      }
    }

    const entries = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxCount = entries[0]?.[1] || 1;

    return entries.map(([key, count]) => ({
      tag: displayForm.get(key)!,
      count,
      pct: count / maxCount,
    }));
  }, [filtered, companies]);

  // ── Find similar company data ─────────────────────────────────────────────

  const similarCompanyBase = similarTicker
    ? companies.find((c) => c.ticker === similarTicker)
    : null;

  return (
    <SiteLayout>
      <Helmet>
        <title>Discover Stocks - Restnvest</title>
        <meta
          name="description"
          content="Browse AI-graded stock research. Explore 10-K analyses for 100+ companies with competitive moat scores, investment themes, and value drivers."
        />
        <link rel="canonical" href="https://restnvest.com/discover" />
      </Helmet>

      {/* ── Hero ── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-discover-hero">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-discover-headline"
          >
            Discover Companies
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#0c4a3a',
                color: '#c8f0e4',
                padding: '3px 10px',
                borderRadius: 20,
                verticalAlign: 'middle',
                marginLeft: 10,
                display: 'inline-block',
              }}
              data-testid="badge-early-access"
            >
              Early access
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Filter by competitive moats and investment themes to find companies that match your criteria.
          </p>
          <div
            className="mx-auto max-w-xl mt-5"
            style={{
              border: '0.5px solid #9FE1CB',
              background: '#E1F5EE',
              borderRadius: 10,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              textAlign: 'left',
            }}
            data-testid="callout-early-access"
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#0c4a3a', marginTop: 2 }}
            >
              <Info style={{ width: 11, height: 11, color: '#fff' }} />
            </div>
            <p style={{ fontSize: '12.5px', color: '#04342C', lineHeight: 1.55, margin: 0 }}>
              This feature is in early access. We're actively improving the discovery engine — tag coverage, accuracy, and filtering are works in progress. Some companies may be missing or incomplete.{' '}
              <a
                href="mailto:feedback@restnvest.com"
                style={{ color: '#04342C', textDecoration: 'underline' }}
                data-testid="link-send-feedback"
              >
                Send feedback →
              </a>
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full gap-2"
              data-testid="button-discover-cta"
              onClick={() => navigate("/app")}
            >
              <Search className="h-5 w-5" />
              Research a stock
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full gap-2"
              data-testid="button-discover-map"
              onClick={() => navigate("/discover/map")}
            >
              <Layers className="h-5 w-5" />
              Investment Map
            </Button>
          </div>
        </div>
      </section>

      {originTicker && (
        <section className="px-4 sm:px-6 lg:px-8" data-testid="section-origin-banner">
          <div className="mx-auto max-w-7xl">
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg mb-6"
              style={{ background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)" }}
              data-testid="origin-banner"
            >
              <span className="text-sm font-medium" data-testid="text-origin-banner">
                Showing companies similar to <strong>{originName || originTicker}</strong>
              </span>
              <div className="flex items-center gap-3">
                <Link href={`/stocks/${originTicker}`}>
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 cursor-pointer"
                    data-testid="link-back-to-origin"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to {originTicker} analysis
                  </span>
                </Link>
                <button
                  onClick={() => { setOriginTicker(null); setOriginName(null); }}
                  className="p-1 rounded hover-elevate"
                  data-testid="button-dismiss-origin"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 sm:px-6 lg:px-8 pb-16" data-testid="section-discover-grid">
        <div className="mx-auto max-w-7xl">

          {/* ── Tag Clusters ── */}
          {clusters.length > 0 && (
            <div className="mb-8" data-testid="clusters-section">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Popular Theme Clusters
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {clusters.map((cluster, i) => (
                  <Card
                    key={i}
                    className="flex-shrink-0 p-3 w-48"
                    data-testid={`cluster-card-${i}`}
                  >
                    <p className="text-xs font-semibold mb-0.5 truncate">{cluster.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2.5">{cluster.count} companies</p>
                    <div className="flex flex-wrap gap-1">
                      {cluster.tags.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className="text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors"
                            style={
                              active
                                ? { background: "var(--lp-teal-deep, #0d4a47)", color: "white", borderColor: "var(--lp-teal-deep, #0d4a47)" }
                                : { background: "transparent", color: "var(--lp-ink-light)", borderColor: "var(--border)" }
                            }
                            data-testid={`cluster-tag-${tag.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── Tag Frequency Chart ── */}
          {companies.length > 0 && (
            <>
            <div className="border-t my-8" style={{ borderColor: "var(--border)" }} />
            <div className="mb-8" data-testid="freq-chart-section">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3" />
                Tag Frequency
                {filtered.length < companies.length && (
                  <span className="normal-case tracking-normal text-[9px] opacity-70 ml-0.5">(filtered)</span>
                )}
              </p>
              <div className="space-y-2.5">
                {freqChartData.map(({ tag, count, pct }) => {
                  const isActive = focusedTag === tag;
                  return (
                    <button
                      key={tag}
                      className="flex items-center gap-3 w-full text-left group hover-elevate rounded"
                      style={{ padding: "2px 4px", margin: "-2px -4px" }}
                      onClick={() => setFocusedTag(isActive ? null : tag)}
                      data-testid={`button-freq-tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                      title={`See all companies with "${tag}"`}
                    >
                      <span
                        className="text-xs flex-shrink-0 truncate transition-colors"
                        style={{
                          width: "140px",
                          color: isActive ? "var(--lp-teal-deep, #0d4a47)" : undefined,
                          fontWeight: isActive ? 600 : undefined,
                        }}
                        title={tag}
                      >
                        {tag}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct * 100}%`,
                            background: isActive ? "var(--lp-teal-brand, #1a6b67)" : "var(--lp-teal-deep, #0d4a47)",
                          }}
                        />
                      </div>
                      <span
                        className="text-xs text-muted-foreground flex-shrink-0 text-right"
                        style={{ width: "28px" }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </>
          )}

          {/* ── Section divider ── */}
          {companies.length > 0 && (
            <div className="border-t my-8" style={{ borderColor: "var(--border)" }} />
          )}

          {/* ── Tag Screener Panel ── */}
          <div
            className="rounded-xl border mb-8 overflow-hidden"
            style={{ borderColor: "var(--border)" }}
            data-testid="screener-panel"
          >
            {/* Header */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 border-b"
              style={{ background: "var(--lp-teal-deep, #0d4a47)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} />
              <span
                className="font-mono text-[11px] tracking-[0.04em]"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Screen by Moat or Theme
              </span>
              <div className="ml-auto flex items-center gap-2">
                {isScreenerActive && (
                  <>
                    {/* ANY / ALL toggle */}
                    <div
                      className="flex rounded-full border overflow-hidden text-[10px] font-mono"
                      style={{ borderColor: "rgba(255,255,255,0.2)" }}
                      data-testid="toggle-filter-mode"
                    >
                      <button
                        className="px-2.5 py-1 transition-colors"
                        style={
                          filterMode === "any"
                            ? { background: "rgba(255,255,255,0.2)", color: "white" }
                            : { background: "transparent", color: "rgba(255,255,255,0.5)" }
                        }
                        onClick={() => setFilterMode("any")}
                        data-testid="toggle-any"
                      >
                        ANY
                      </button>
                      <button
                        className="px-2.5 py-1 transition-colors"
                        style={
                          filterMode === "all"
                            ? { background: "rgba(255,255,255,0.2)", color: "white" }
                            : { background: "transparent", color: "rgba(255,255,255,0.5)" }
                        }
                        onClick={() => setFilterMode("all")}
                        data-testid="toggle-all"
                      >
                        ALL
                      </button>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}
                    >
                      {selectedTags.length} active
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Body: two grouped rows */}
            <div className="p-4 bg-white dark:bg-card space-y-4">
              {/* Moats row */}
              {moatTagFreqs.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Competitive Moats
                  </p>
                  <div className="flex flex-wrap gap-2" data-testid="tag-library">
                    {moatTagFreqs.map(({ tag, count }) => (
                      <TagPill
                        key={tag}
                        tag={tag}
                        count={count}
                        active={selectedTags.includes(tag)}
                        onClick={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* Themes row */}
              {themeTagFreqs.length > 0 && (
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3 w-3" /> Investment Themes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {themeTagFreqs.map(({ tag, count }) => (
                      <TagPill
                        key={tag}
                        tag={tag}
                        count={count}
                        active={selectedTags.includes(tag)}
                        onClick={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Active Filters ── */}
          {isScreenerActive && (
            <div className="flex flex-wrap items-center gap-2 mb-3" data-testid="active-filters">
              <span className="text-xs text-muted-foreground font-medium">
                Filtered by ({filterMode === "all" ? "ALL" : "ANY"}):
              </span>
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium"
                  style={{ background: "var(--lp-teal-pale, #e8f5f4)", color: "var(--lp-teal-deep, #0d4a47)", borderColor: "rgba(13,74,71,0.15)" }}
                  data-testid={`active-tag-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {tag}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={clearTags}
                className="text-xs text-muted-foreground underline underline-offset-2 ml-1"
                data-testid="button-clear-filters"
              >
                Clear all
              </button>
            </div>
          )}

          {/* ── Related Tags ── */}
          {isScreenerActive && relatedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="related-tags-row">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Related:
              </span>
              {relatedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
                  style={{ background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}

          {/* ── Insights Bar ── */}
          {insights && (
            <div
              className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-lg mb-5 text-xs"
              style={{ background: "var(--muted)", opacity: 0.9 }}
              data-testid="insights-bar"
            >
              {insights.topMoat && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wide">Top Moat</span>
                  <span className="font-medium ml-0.5">{insights.topMoat}</span>
                </span>
              )}
              {insights.topMoat && insights.topTheme && (
                <span className="text-muted-foreground/40">|</span>
              )}
              {insights.topTheme && (
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wide">Top Theme</span>
                  <span className="font-medium ml-0.5">{insights.topTheme}</span>
                </span>
              )}
              {insights.topTheme && (
                <span className="text-muted-foreground/40">|</span>
              )}
              <span className="flex items-center gap-1.5 flex-wrap">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                {["A", "B", "C", "D", "F"].map((g) =>
                  insights.grades[g] > 0 ? (
                    <span key={g} className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColors[g]}`}>
                      {g} {insights.grades[g]}
                    </span>
                  ) : null
                )}
              </span>
            </div>
          )}

          {/* ── Search + Sort bar ── */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            data-testid="filter-bar"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ticker, company, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-search"
              />
            </div>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-grade-filter">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades ({companies.length})</SelectItem>
                {["A", "B", "C", "D", "F"].map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g} ({gradeCounts[g]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-full sm:w-[170px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest">Highest Grade</SelectItem>
                <SelectItem value="lowest">Lowest Grade</SelectItem>
                <SelectItem value="moats">Most Moats</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="az">A &rarr; Z</SelectItem>
                <SelectItem value="za">Z &rarr; A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Build Your Discovery DnD Panel ── */}
          {companies.length > 0 && (
            <Collapsible>
              <div
                className="rounded-xl border mb-6 overflow-hidden"
                style={{ borderColor: "var(--border)" }}
                data-testid="build-discovery-panel"
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center gap-2.5 px-4 py-3 w-full text-left"
                    style={{ background: "var(--muted)" }}
                    data-testid="button-toggle-build-discovery"
                  >
                    <Layers className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-[11px] tracking-[0.04em] text-muted-foreground">
                      Build Your Discovery
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto transition-transform" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-card">
                      <div data-testid="dnd-available-tags">
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          Available Tags
                        </p>
                        <SortableContext
                          items={[
                            ...moatTagFreqs.filter((f) => !selectedTags.includes(f.tag)).map((f) => `avail:${f.tag}`),
                            ...themeTagFreqs.filter((f) => !selectedTags.includes(f.tag)).map((f) => `avail:${f.tag}`),
                          ]}
                          strategy={rectSortingStrategy}
                        >
                          <DroppableZone
                            id="available-drop-zone"
                            className="min-h-[60px] rounded-lg border border-dashed p-2 flex flex-wrap gap-2"
                            style={{ borderColor: "var(--border)" }}
                          >
                            {moatTagFreqs
                              .filter((f) => !selectedTags.includes(f.tag))
                              .map((f) => (
                                <DraggableTag key={`avail:${f.tag}`} id={`avail:${f.tag}`} tag={f.tag} count={f.count} side="available" />
                              ))}
                            {themeTagFreqs
                              .filter((f) => !selectedTags.includes(f.tag))
                              .map((f) => (
                                <DraggableTag key={`avail:${f.tag}`} id={`avail:${f.tag}`} tag={f.tag} count={f.count} side="available" />
                              ))}
                            {moatTagFreqs.filter((f) => !selectedTags.includes(f.tag)).length === 0 &&
                             themeTagFreqs.filter((f) => !selectedTags.includes(f.tag)).length === 0 && (
                              <span className="text-xs text-muted-foreground py-2 px-1">All tags selected</span>
                            )}
                          </DroppableZone>
                        </SortableContext>
                      </div>
                      <div data-testid="dnd-selected-tags">
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          Selected Tags
                          {selectedTags.length > 0 && (
                            <button
                              onClick={clearTags}
                              className="text-[10px] text-muted-foreground underline underline-offset-2 ml-auto normal-case tracking-normal font-normal"
                              data-testid="button-dnd-clear-all"
                            >
                              Clear All
                            </button>
                          )}
                        </p>
                        <SortableContext
                          items={selectedTags.map((t) => `sel:${t}`)}
                          strategy={rectSortingStrategy}
                        >
                          <DroppableZone
                            id="selected-drop-zone"
                            className="min-h-[60px] rounded-lg border border-dashed p-2 flex flex-wrap gap-2"
                            style={{ borderColor: selectedTags.length > 0 ? "var(--lp-teal-deep, #0d4a47)" : "var(--border)" }}
                          >
                            {selectedTags.map((tag) => (
                              <div key={`sel:${tag}`} className="inline-flex items-center gap-1">
                                <DraggableTag id={`sel:${tag}`} tag={tag} side="selected" />
                                <button
                                  onClick={() => toggleTag(tag)}
                                  className="p-0.5 rounded hover-elevate"
                                  style={{ color: "var(--lp-teal-deep, #0d4a47)" }}
                                  data-testid={`button-dnd-remove-${tag.replace(/\s+/g, "-").toLowerCase()}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {selectedTags.length === 0 && (
                              <span className="text-xs text-muted-foreground py-2 px-1">Drag tags here to filter</span>
                            )}
                          </DroppableZone>
                        </SortableContext>
                      </div>
                    </div>
                    <DragOverlay>
                      {activeDragId ? (
                        <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium bg-background shadow-md">
                          <GripVertical className="h-3 w-3 opacity-40 flex-shrink-0" />
                          <span>{activeDragId.replace(/^(avail|sel):/, "")}</span>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* ── Similar Companies Panel ── */}
          {similarTicker && (
            <div
              className="rounded-xl border mb-6 overflow-hidden"
              style={{ borderColor: "var(--lp-teal-deep, #0d4a47)", borderWidth: "1.5px" }}
              data-testid="similar-panel"
            >
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "var(--lp-teal-pale, #e8f5f4)" }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" style={{ color: "var(--lp-teal-deep, #0d4a47)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--lp-teal-deep, #0d4a47)" }}>
                    Companies similar to{" "}
                    <strong>{similarData?.baseName || similarTicker}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setSimilarTicker(null)}
                  className="p-1 rounded hover-elevate"
                  style={{ color: "var(--lp-teal-deep, #0d4a47)" }}
                  data-testid="button-close-similar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-card">
                {similarLoading ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44 h-28 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !similarData?.similar?.length ? (
                  <p className="text-sm text-muted-foreground py-2">No similar companies found.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {similarData.similar.map((c) => (
                      <SimilarMiniCard
                        key={c.ticker}
                        company={c}
                        baseMoatTags={similarCompanyBase?.moatTags || []}
                        baseThemeTags={similarCompanyBase?.themeTags || []}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── By-Tag Panel ── */}
          {focusedTag && (
            <div
              className="rounded-xl border mb-6 overflow-hidden"
              style={{ borderColor: "var(--lp-teal-deep, #0d4a47)", borderWidth: "1.5px" }}
              data-testid="by-tag-panel"
            >
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "var(--lp-teal-pale, #e8f5f4)" }}
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--lp-teal-deep, #0d4a47)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--lp-teal-deep, #0d4a47)" }}>
                    Companies with{" "}<strong>&ldquo;{focusedTag}&rdquo;</strong>
                  </span>
                </div>
                <button
                  onClick={() => setFocusedTag(null)}
                  className="p-1 rounded hover-elevate"
                  style={{ color: "var(--lp-teal-deep, #0d4a47)" }}
                  data-testid="button-close-by-tag"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-3 bg-white dark:bg-card">
                {byTagLoading ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44 h-24 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !byTagData?.companies?.length ? (
                  <p className="text-sm text-muted-foreground py-2">No companies found for this tag.</p>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {byTagData.companies.map((c) => (
                      <ByTagMiniCard key={c.ticker} company={c} focusedTag={focusedTag} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Results grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonTile key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground" data-testid="empty-state">
              <p className="text-lg font-medium mb-1">No companies match.</p>
              <p className="text-sm">
                {isScreenerActive
                  ? filterMode === "all"
                    ? "Try switching to ANY mode, or remove some tags."
                    : "Try removing some tags or broadening your search."
                  : "Try a different search or clear the grade filter."}
              </p>
              {isScreenerActive && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearTags} data-testid="button-empty-clear">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
                {isScreenerActive ? (
                  <>
                    <span className="font-medium" style={{ color: "var(--lp-teal-deep, #0d4a47)" }}>
                      {filtered.length} {filtered.length === 1 ? "company matches" : "companies match"} your strategy
                    </span>
                    <span className="ml-1">
                      ({filterMode === "all" ? "ALL" : "ANY"} of {selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  <>{filtered.length} {filtered.length === 1 ? "company" : "companies"}</>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((company) => (
                  <StockTile
                    key={company.ticker}
                    company={company}
                    selectedTags={selectedTags}
                    onFindSimilar={(ticker) => setSimilarTicker(ticker === similarTicker ? null : ticker)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        data-testid="section-how-it-works"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <Card key={i} className="p-5" data-testid={`card-how-${i}`}>
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 text-center" data-testid="section-discover-footer-cta">
        <p className="text-muted-foreground text-sm">Informed investing, built to last.</p>
      </section>
    </SiteLayout>
  );
}
