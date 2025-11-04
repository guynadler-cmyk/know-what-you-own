import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Building2, MapPin, Users, TrendingUp, Briefcase, Award, DollarSign, ExternalLink, Youtube, Newspaper, Globe, ChevronDown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { SiX, SiYoutube } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";

interface Product {
  name: string;
  icon: LucideIcon;
  description: string;
}

interface Leader {
  name: string;
  role: string;
  initials: string;
  twitter?: string;
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

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
}

interface VideoResource {
  title: string;
  channel: string;
  url: string;
}

interface SummaryCardProps {
  companyName: string;
  ticker: string;
  filingDate: string;
  fiscalYear: string;
  tagline: string;
  
  products: Product[];
  
  operations: {
    regions: string[];
    channels: SalesChannel[];
    scale: string;
  };
  
  competitors: Competitor[];
  leaders: Leader[];
  metrics: Metric[];
  
  metadata: {
    homepage: string;
    investorRelations?: string;
    news: NewsItem[];
    videos: VideoResource[];
  };
  
  cik?: string;
}

function CompetitorQuickSummary({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['/api/analyze', ticker],
    enabled: !!ticker,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-muted rounded w-full mb-2"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border text-muted-foreground">
        <p>Unable to load competitor summary</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 bg-background/50 rounded-lg border border-border space-y-4">
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Summary</p>
        <p className="text-base leading-relaxed">{data.tagline}</p>
      </div>

      {data.products && data.products.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Products</p>
          <div className="flex flex-wrap gap-2">
            {data.products.slice(0, 4).map((product: Product, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {product.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Metrics</p>
          <div className="grid grid-cols-2 gap-3">
            {data.metrics.slice(0, 4).map((metric: Metric, i: number) => (
              <div key={i} className="text-sm">
                <span className="text-muted-foreground">{metric.label}:</span>{" "}
                <span className="font-semibold">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={() => window.open(`/?ticker=${ticker}`, '_blank')}
        data-testid={`button-dive-deeper-${ticker}`}
      >
        Dive Deeper
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

export function SummaryCard({ 
  companyName, 
  ticker, 
  filingDate, 
  fiscalYear,
  tagline,
  products,
  operations,
  competitors,
  leaders,
  metrics,
  metadata,
  cik 
}: SummaryCardProps) {
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  return (
    <TooltipProvider>
    <div className="w-full max-w-6xl mx-auto space-y-16 pb-16 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-6 py-8 border-b-2 border-border pb-12">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">{companyName}</h1>
        <p className="text-2xl sm:text-3xl text-muted-foreground font-light max-w-4xl mx-auto leading-relaxed">
          {tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          <Badge variant="outline" className="font-mono text-lg px-4 py-2" data-testid="text-ticker">
            {ticker}
          </Badge>
          <span className="text-muted-foreground">•</span>
          <p className="text-muted-foreground" data-testid="text-filing-date">
            {filingDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          <a 
            href={metadata.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-base"
            data-testid="link-homepage"
          >
            <Globe className="h-4 w-4" />
            Website
          </a>
          {metadata.investorRelations && (
            <>
              <span className="text-muted-foreground">•</span>
              <a 
                href={metadata.investorRelations}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-base"
                data-testid="link-investor-relations"
              >
                <DollarSign className="h-4 w-4" />
                Investors
              </a>
            </>
          )}
        </div>
      </div>

      {/* BUSINESS OVERVIEW CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Business Overview</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12 space-y-12">
          {/* What They Do */}
          <section className="space-y-8">
            <h3 className="text-3xl font-bold text-center">What they do</h3>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center text-center space-y-4 p-6"
                >
                  <product.icon className="h-12 w-12 text-foreground stroke-[1.5]" />
                  <h4 className="text-xl font-semibold">{product.name}</h4>
                  <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="w-full h-0.5 bg-border" />

          {/* Where & How */}
          <section className="space-y-8">
            <h3 className="text-3xl font-bold text-center">Where & how</h3>
            <div className="grid gap-12 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Global Reach</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {operations.regions.map((region, i) => (
                    <Badge key={i} variant="secondary" className="text-sm px-4 py-1.5">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Sales Channels</h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {operations.channels.map((channel, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div>
                          <Badge 
                            variant="secondary" 
                            className="text-sm px-4 py-1.5 cursor-help"
                            data-testid={`badge-channel-${i}`}
                          >
                            {channel.name}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{channel.explanation}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div className="space-y-4 text-center">
                <h4 className="text-lg font-semibold">Scale</h4>
                <p className="text-base text-muted-foreground">{operations.scale}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* PERFORMANCE CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Performance</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">{metric.label}</p>
                <p className="text-4xl font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MARKET CONTEXT CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Market Context</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12">
          <div className="grid gap-12 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Competition */}
            <section className="space-y-6">
              <h3 className="text-2xl font-bold pb-3 border-b border-border">Competition</h3>
              <div className="space-y-4">
                {competitors.map((competitor, index) => (
                  competitor.ticker ? (
                    <Collapsible
                      key={index}
                      open={expandedCompetitor === competitor.ticker}
                      onOpenChange={(open) => setExpandedCompetitor(open ? competitor.ticker! : null)}
                    >
                      <div className="rounded-lg border border-border hover-elevate">
                        <CollapsibleTrigger asChild>
                          <div 
                            className="w-full cursor-pointer p-4 space-y-1"
                            data-testid={`competitor-${index}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-lg text-primary">
                                  {competitor.name}
                                </p>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {competitor.ticker}
                                </Badge>
                              </div>
                              <ChevronDown 
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  expandedCompetitor === competitor.ticker ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <p className="text-base text-muted-foreground text-left">{competitor.focus}</p>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4">
                            <CompetitorQuickSummary ticker={competitor.ticker} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ) : (
                    <div 
                      key={index} 
                      className="space-y-1 py-3"
                      data-testid={`competitor-${index}`}
                    >
                      <p className="font-semibold text-lg">{competitor.name}</p>
                      <p className="text-base text-muted-foreground">{competitor.focus}</p>
                    </div>
                  )
                ))}
              </div>
            </section>

            {/* Leadership */}
            <section className="space-y-6">
              <h3 className="text-2xl font-bold pb-3 border-b border-border">Leadership</h3>
              <div className="space-y-4">
                {leaders.map((leader, index) => (
                  <div key={index} className="flex items-center gap-4 py-2">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-background text-foreground font-semibold">
                        {leader.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{leader.name}</p>
                        {leader.twitter && (
                          <a 
                            href={`https://x.com/${leader.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`link-twitter-${leader.twitter}`}
                          >
                            <SiX className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{leader.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* RESOURCES CLUSTER */}
      <div className="border-2 border-border rounded-2xl">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Resources</h2>
        </div>
        <div className="bg-muted/20 p-8 sm:p-12">
          <div className="grid gap-12 md:grid-cols-2 max-w-5xl mx-auto">
            <section className="space-y-6">
              <h3 className="text-2xl font-bold pb-3 border-b border-border">News</h3>
              <div className="space-y-3">
                {metadata.news.map((item, index) => (
                  <a 
                    key={index}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg hover-elevate active-elevate-2 transition-all group"
                    data-testid={`link-news-${index}`}
                  >
                    <div className="shrink-0 mt-1">
                      <Newspaper className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-2xl font-bold pb-3 border-b border-border">Videos</h3>
              <div className="space-y-3">
                {metadata.videos.map((video, index) => (
                  <a 
                    key={index}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg hover-elevate active-elevate-2 transition-all group"
                    data-testid={`link-video-${index}`}
                  >
                    <div className="shrink-0 mt-1">
                      <SiYoutube className="h-6 w-6 text-[#FF0000] group-hover:text-[#CC0000] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {video.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{video.channel}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Source: Official company report
        </p>
      </div>
    </div>
    </TooltipProvider>
  );
}
