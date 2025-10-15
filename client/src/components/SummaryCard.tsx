import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, FileText } from "lucide-react";

interface SummaryCardProps {
  companyName: string;
  ticker: string;
  filingDate: string;
  fiscalYear: string;
  summary: string;
  cik?: string;
}

export function SummaryCard({ 
  companyName, 
  ticker, 
  filingDate, 
  fiscalYear,
  summary,
  cik 
}: SummaryCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Card className="border-success/20">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-2xl">{companyName}</CardTitle>
                <Badge variant="outline" className="font-mono text-sm" data-testid="text-ticker">
                  {ticker}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-filing-date">{filingDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>10-K • FY {fiscalYear}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-base leading-relaxed text-foreground" data-testid="text-summary">
              {summary}
            </p>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Source: SEC EDGAR 10-K Filing
              {cik && (
                <span className="ml-2">
                  • CIK: <span className="font-mono">{cik}</span>
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
