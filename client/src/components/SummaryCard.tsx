import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Building2, MapPin, Users, TrendingUp, Briefcase, Award, DollarSign } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Product {
  name: string;
  icon: LucideIcon;
  description: string;
}

interface Leader {
  name: string;
  role: string;
  initials: string;
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
                    <p className="font-medium text-sm">{leader.name}</p>
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
