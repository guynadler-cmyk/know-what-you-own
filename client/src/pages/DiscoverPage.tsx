import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

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

const gradeColors: Record<string, string> = {
  A: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  B: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  C: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  F: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};


function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold ${gradeColors[grade] || gradeColors.C}`}
      data-testid={`badge-grade-${grade}`}
    >
      {grade}
    </span>
  );
}

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

function StockTile({ company, selectedTags }: { company: DiscoverCompany; selectedTags: string[] }) {
  const matchedTags = selectedTags.length > 0 ? getMatchedTags(selectedTags, company) : [];

  return (
    <Link href={`/stocks/${company.ticker}`}>
      <Card
        className="h-full p-4 hover-elevate cursor-pointer transition-colors flex flex-col"
        data-testid={`card-stock-${company.ticker}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              data-testid={`text-name-${company.ticker}`}
            >
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
                style={{ background: 'var(--lp-teal-pale, #e8f5f4)', color: 'var(--lp-teal-deep, #0d4a47)' }}
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
    </Link>
  );
}

function SkeletonTile() {
  return (
    <Card className="h-full p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
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

type SortMode = "highest" | "lowest" | "az" | "za";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("highest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data, isLoading } = useQuery<{ companies: DiscoverCompany[] }>({
    queryKey: ["/api/discover"],
  });

  const companies = data?.companies || [];

  const availableTags = useMemo(() => {
    const countMap = new Map<string, number>();
    const displayForm = new Map<string, string>();
    for (const c of companies) {
      const seen = new Set<string>();
      for (const tag of [...c.moatTags, ...c.themeTags]) {
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
      .map(([key]) => displayForm.get(key)!);
  }, [companies]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => setSelectedTags([]);

  const filtered = useMemo(() => {
    let list = [...companies];

    if (selectedTags.length > 0) {
      list = list.filter((c) =>
        selectedTags.some((tag) => tagMatchesCompany(tag, c))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.ticker.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q)
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
    }

    return list;
  }, [companies, searchQuery, gradeFilter, sortMode, selectedTags]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const c of companies) {
      if (counts[c.grade] !== undefined) counts[c.grade]++;
    }
    return counts;
  }, [companies]);

  const isScreenerActive = selectedTags.length > 0;

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

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-discover-hero">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-discover-headline"
          >
            Discover Companies
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Filter by investment themes and competitive moats to find companies that match your criteria.
          </p>
          <div className="mt-6">
            <Link href="/app">
              <Button size="lg" className="rounded-full gap-2" data-testid="button-discover-cta">
                <Search className="h-5 w-5" />
                Research a stock
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="px-4 sm:px-6 lg:px-8 pb-16"
        data-testid="section-discover-grid"
      >
        <div className="mx-auto max-w-7xl">

          {/* ── Tag Screener ── */}
          <div
            className="rounded-xl border mb-6 overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
            data-testid="screener-panel"
          >
            <div
              className="flex items-center gap-2.5 px-4 py-3 border-b"
              style={{ background: 'var(--lp-teal-deep, #0d4a47)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
              <span
                className="font-mono text-[11px] tracking-[0.04em]"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Screen by Theme or Moat
              </span>
              {isScreenerActive && (
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
                >
                  {selectedTags.length} active
                </span>
              )}
            </div>
            <div className="p-4 bg-white dark:bg-card">
              <div className="flex flex-wrap gap-2" data-testid="tag-library">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                      style={
                        active
                          ? { background: 'var(--lp-teal-deep, #0d4a47)', color: 'white', borderColor: 'var(--lp-teal-deep, #0d4a47)' }
                          : { background: 'transparent', color: 'var(--lp-ink-light)', borderColor: 'var(--border)' }
                      }
                      data-testid={`tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Active Filters ── */}
          {isScreenerActive && (
            <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="active-filters">
              <span className="text-xs text-muted-foreground font-medium">Filtered by:</span>
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium"
                  style={{ background: 'var(--lp-teal-pale, #e8f5f4)', color: 'var(--lp-teal-deep, #0d4a47)', borderColor: 'rgba(13,74,71,0.15)' }}
                  data-testid={`active-tag-${tag.replace(/\s+/g, '-').toLowerCase()}`}
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

          {/* ── Search + Sort bar ── */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6"
            data-testid="filter-bar"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ticker or company..."
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
                <SelectItem value="all">
                  All Grades ({companies.length})
                </SelectItem>
                {["A", "B", "C", "D", "F"].map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g} ({gradeCounts[g]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest">Highest Grade</SelectItem>
                <SelectItem value="lowest">Lowest Grade</SelectItem>
                <SelectItem value="az">A &rarr; Z</SelectItem>
                <SelectItem value="za">Z &rarr; A</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  ? "Try removing some tags or broadening your search."
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
                {filtered.length} {filtered.length === 1 ? "company" : "companies"}
                {isScreenerActive && (
                  <span className="ml-1 font-medium" style={{ color: 'var(--lp-teal-deep, #0d4a47)' }}>
                    matching your filters
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((company) => (
                  <StockTile key={company.ticker} company={company} selectedTags={selectedTags} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30"
        data-testid="section-how-it-works"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <Card key={i} className="p-5" data-testid={`card-how-${i}`}>
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 lg:px-8 text-center" data-testid="section-discover-footer-cta">
        <p className="text-muted-foreground text-sm">
          Informed investing, built to last.
        </p>
      </section>
    </SiteLayout>
  );
}
