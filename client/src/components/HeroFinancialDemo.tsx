import { useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuadrantExplorer, generateQuadrantData } from "@/components/QuadrantExplorer";
import { FinancialScorecard } from "@/components/FinancialScorecard";
import { CompanyLogo } from "@/components/CompanyLogo";
import { SAMPLE_FINANCIAL_METRICS, SAMPLE_BALANCE_SHEET_METRICS } from "@/data/sampleFinancialData";

export function HeroFinancialDemo() {
  const quadrantData = useMemo(
    () => generateQuadrantData(SAMPLE_FINANCIAL_METRICS, SAMPLE_BALANCE_SHEET_METRICS),
    []
  );

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-financial-demo">
      <Card>
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <CompanyLogo
              homepage="https://www.apple.com"
              companyName="Apple Inc"
              ticker="AAPL"
              size="md"
            />
            <div className="text-left">
              <h2 className="text-2xl font-bold">Apple Inc</h2>
              <p className="text-sm text-muted-foreground">AAPL</p>
            </div>
          </div>
          <CardTitle className="text-2xl">Understand Performance</CardTitle>
        </CardHeader>
        <CardContent className="pb-8">
          <QuadrantExplorer
            financialMetrics={SAMPLE_FINANCIAL_METRICS}
            balanceSheetMetrics={SAMPLE_BALANCE_SHEET_METRICS}
          />
          <FinancialScorecard quadrantData={quadrantData} />
        </CardContent>
      </Card>

      <div className="flex justify-center mt-6" data-testid="hero-financial-sample-label">
        <p className="text-sm text-muted-foreground">
          This is a sample analysis.{" "}
          <Link href="/app">
            <span className="text-primary hover:underline cursor-pointer">
              Run your own for real-time data →
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
