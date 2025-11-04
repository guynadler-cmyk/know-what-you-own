import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Building2, MapPin, Users, TrendingUp, Briefcase, Award, DollarSign, ExternalLink, Youtube, Newspaper, Globe } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { SiX, SiYoutube } from "react-icons/si";
import { CompetitorSummaryDialog } from "./CompetitorSummaryDialog";

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
  const [selectedCompetitor, setSelectedCompetitor] = useState<{ name: string; ticker?: string } | null>(null);

  return (
    <TooltipProvider>
      <CompetitorSummaryDialog
        competitorName={selectedCompetitor?.name || ""}
        competitorTicker={selectedCompetitor?.ticker}
        open={!!selectedCompetitor}
        onOpenChange={(open) => !open && setSelectedCompetitor(null)}
      />
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
                        <Badge 
                          variant="secondary" 
                          className="text-sm px-4 py-1.5 cursor-help"
                          data-testid={`badge-channel-${i}`}
                        >
                          {channel.name}
                        </Badge>
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
                  <div 
                    key={index} 
                    className={`space-y-1 py-3 ${competitor.ticker ? 'cursor-pointer hover-elevate active-elevate-2 rounded-lg p-4 -m-1 transition-all' : ''}`}
                    onClick={() => competitor.ticker && setSelectedCompetitor(competitor)}
                    data-testid={`competitor-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-lg ${competitor.ticker ? 'text-primary hover:underline' : ''}`}>
                        {competitor.name}
                      </p>
                      {competitor.ticker && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {competitor.ticker}
                        </Badge>
                      )}
                    </div>
                    <p className="text-base text-muted-foreground">{competitor.focus}</p>
                  </div>
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
