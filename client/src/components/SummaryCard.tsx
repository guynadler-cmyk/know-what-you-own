import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, Package, TrendingUp, Users, Globe, Zap, Target, AlertTriangle } from "lucide-react";

interface SummarySection {
  icon: React.ReactNode;
  title: string;
  items: string[];
}

interface SummaryCardProps {
  companyName: string;
  ticker: string;
  filingDate: string;
  fiscalYear: string;
  tagline: string;
  sections: SummarySection[];
  cik?: string;
}

export function SummaryCard({ 
  companyName, 
  ticker, 
  filingDate, 
  fiscalYear,
  tagline,
  sections,
  cik 
}: SummaryCardProps) {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Card className="border-success/20">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-bold">{companyName}</h2>
                <Badge variant="outline" className="font-mono text-base px-3 py-1" data-testid="text-ticker">
                  {ticker}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">{tagline}</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <Card key={index} className="hover-elevate transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {section.icon}
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

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
