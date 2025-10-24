import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Building2, MapPin, Users, TrendingUp, Briefcase, Award, DollarSign, ExternalLink, Youtube, Newspaper, Globe } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { SiX } from "react-icons/si";

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
  focus: string;
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
    channels: string[];
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
  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 pb-16 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-6 py-12">
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

      {/* What They Do */}
      <section className="space-y-12">
        <h2 className="text-4xl font-bold text-center">What they do</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-4 p-8"
            >
              <product.icon className="h-12 w-12 text-foreground stroke-[1.5]" />
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Where & How */}
      <section className="space-y-12">
        <h2 className="text-4xl font-bold text-center">Where & how</h2>
        <div className="grid gap-12 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">Global Reach</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {operations.regions.map((region, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-4 py-1.5">
                  {region}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">Sales</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {operations.channels.map((channel, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-4 py-1.5">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">Scale</h3>
            <p className="text-base text-muted-foreground">{operations.scale}</p>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-12">
        <h2 className="text-4xl font-bold text-center">Performance</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">{metric.label}</p>
              <p className="text-4xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-16 md:grid-cols-2 max-w-5xl mx-auto">
        {/* Competition */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Competition</h2>
          <div className="space-y-4">
            {competitors.map((competitor, index) => (
              <div key={index} className="space-y-1 py-4 border-b border-border last:border-0">
                <p className="font-semibold text-lg">{competitor.name}</p>
                <p className="text-base text-muted-foreground">{competitor.focus}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Leadership</h2>
          <div className="space-y-6">
            {leaders.map((leader, index) => (
              <div key={index} className="flex items-center gap-4 py-2">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-muted text-foreground font-semibold">
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

      {/* Resources */}
      <div className="grid gap-16 md:grid-cols-2 max-w-5xl mx-auto">
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">News</h2>
          <div className="space-y-4">
            {metadata.news.map((item, index) => (
              <a 
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-2 py-4 border-b border-border last:border-0 hover-elevate rounded px-2 -mx-2 transition-all group"
                data-testid={`link-news-${index}`}
              >
                <p className="font-medium group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Videos</h2>
          <div className="space-y-4">
            {metadata.videos.map((video, index) => (
              <a 
                key={index}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block space-y-2 py-4 border-b border-border last:border-0 hover-elevate rounded px-2 -mx-2 transition-all group"
                data-testid={`link-video-${index}`}
              >
                <p className="font-medium group-hover:text-primary transition-colors">
                  {video.title}
                </p>
                <p className="text-sm text-muted-foreground">{video.channel}</p>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm text-muted-foreground">
          Source: SEC EDGAR 10-K Filing
          {cik && ` • CIK ${cik}`}
        </p>
      </div>
    </div>
  );
}
