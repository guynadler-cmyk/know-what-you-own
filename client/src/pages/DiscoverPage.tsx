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

function StockTile({ company }: { company: DiscoverCompany }) {
  return (
    <Link href={`/stocks/${company.ticker}`}>
      <Card
        className="h-full p-4 hover-elevate cursor-pointer transition-colors"
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
          className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed"
          data-testid={`text-tagline-${company.ticker}`}
        >
          {company.tagline}
        </p>

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

  const { data, isLoading } = useQuery<{ companies: DiscoverCompany[] }>({
    queryKey: ["/api/discover"],
  });

  const companies = data?.companies || [];

  const filtered = useMemo(() => {
    let list = [...companies];

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
  }, [companies, searchQuery, gradeFilter, sortMode]);

  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const c of companies) {
      if (counts[c.grade] !== undefined) counts[c.grade]++;
    }
    return counts;
  }, [companies]);

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
            Today's Research Picks
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every company graded by the Restnvest engine. Click any tile to
            explore the full 10-K analysis.
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
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No companies match your filters.</p>
              <p className="text-sm mt-1">Try a different search or clear the grade filter.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-results-count">
                {filtered.length} {filtered.length === 1 ? "company" : "companies"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((company) => (
                  <StockTile key={company.ticker} company={company} />
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
