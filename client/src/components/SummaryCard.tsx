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
  
  // What they do
  products: Product[];
  
  // Where/How they operate
  operations: {
    regions: string[];
    channels: string[];
    scale: string;
  };
  
  // Competition
  competitors: Competitor[];
  
  // Leadership
  leaders: Leader[];
  
  // Success metrics
  metrics: Metric[];
  
  // Metadata
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
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header Card */}
      <Card className="border-success/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-bold">{companyName}</h2>
                <Badge variant="outline" className="font-mono text-base px-3 py-1" data-testid="text-ticker">
                  {ticker}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">{tagline}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-filing-date">{filingDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>10-K • FY {fiscalYear}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a 
                  href={metadata.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline hover-elevate px-2 py-1 rounded"
                  data-testid="link-homepage"
                >
                  <Globe className="h-4 w-4" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
                {metadata.investorRelations && (
                  <a 
                    href={metadata.investorRelations}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline hover-elevate px-2 py-1 rounded"
                    data-testid="link-investor-relations"
                  >
                    <DollarSign className="h-4 w-4" />
                    Investor Relations
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* What They Do - Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            What They Do
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => (
              <div 
                key={index}
                className="flex flex-col items-center text-center p-4 rounded-lg bg-card border border-card-border hover-elevate transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <product.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                <p className="text-xs text-muted-foreground">{product.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Where & How - Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Where & How They Operate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Geographic Reach</h4>
              <div className="flex flex-wrap gap-2">
                {operations.regions.map((region, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Sales Channels</h4>
              <div className="flex flex-wrap gap-2">
                {operations.channels.map((channel, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Scale</h4>
              <p className="text-sm">{operations.scale}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Competition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Key Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{competitor.name}</p>
                    <p className="text-xs text-muted-foreground">{competitor.focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leadership */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leadership Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaders.map((leader, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {leader.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{leader.name}</p>
                      {leader.twitter && (
                        <a 
                          href={`https://x.com/${leader.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`link-twitter-${leader.twitter}`}
                        >
                          <SiX className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{leader.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Business Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-success" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* News & Resources */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent News */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Recent News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metadata.news.map((item, index) => (
                <a 
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-muted/50 hover-elevate transition-all group"
                  data-testid={`link-news-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Video Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              Video Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metadata.videos.map((video, index) => (
                <a 
                  key={index}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-muted/50 hover-elevate transition-all group"
                  data-testid={`link-video-${index}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {video.title}
                    </p>
                    <Youtube className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground">{video.channel}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card>
        <CardContent className="py-3">
          <p className="text-xs text-muted-foreground text-center">
            Source: SEC EDGAR 10-K Filing
            {cik && (
              <span className="ml-2">
                • CIK: <span className="font-mono">{cik}</span>
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
