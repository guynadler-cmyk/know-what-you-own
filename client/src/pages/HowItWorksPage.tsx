import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Search, ArrowRight, FileSearch, Brain, ClipboardList } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: FileSearch,
    title: "Search any ticker",
    description:
      "Enter a stock ticker for any publicly traded U.S. company. Restnvest pulls the most recent 10-K filing directly from the SEC's EDGAR database — the same source every professional analyst uses.",
    detail: "We access filings in real-time, so you always get the latest available data. No stale information, no third-party middlemen.",
  },
  {
    number: "2",
    icon: Brain,
    title: "AI analyzes the filing",
    description:
      "Our AI reads the entire 10-K document and extracts the information that matters. It identifies the business model, competitive landscape, financial health, and strategic direction — then translates it all into clear, structured English.",
    detail: "Powered by advanced language models, the analysis follows a professional investment framework covering business fundamentals, performance metrics, and market positioning.",
  },
  {
    number: "3",
    icon: ClipboardList,
    title: "Review and plan",
    description:
      "Walk through five structured stages of analysis — from understanding the business to building a conviction-based investment plan. Each stage builds on the last, giving you a complete picture before you make any decision.",
    detail: "You're in control the entire time. Restnvest presents the information; you make the calls. Export your plan, share your research, or come back anytime.",
  },
];

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>How It Works - Restnvest</title>
        <meta
          name="description"
          content="Learn how Restnvest works in three simple steps: search a ticker, get AI-powered analysis, and build your investment plan."
        />
        <meta property="og:title" content="How It Works - Restnvest" />
        <meta
          property="og:description"
          content="Three steps to smarter investing: search, analyze, plan. No signup required."
        />
        <link rel="canonical" href="https://restnvest.com/how-it-works" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-hiw-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-hiw-eyebrow">
            How It Works
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-hiw-headline"
          >
            From ticker to thesis in minutes
          </h1>
          <p
            className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-hiw-subheadline"
          >
            Restnvest does the heavy lifting so you can focus on what matters — making informed decisions about the companies you care about.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8" data-testid="section-hiw-steps">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-1 lg:gap-0">
            {steps.map((step, index) => (
              <div key={step.number} className="relative" data-testid={`step-${step.number}`}>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute left-[2.25rem] top-[5.5rem] bottom-[-1rem] w-px bg-border" />
                )}
                <div className="flex gap-6 lg:gap-8">
                  <div className="shrink-0">
                    <div className="flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="flex-1 pb-12 lg:pb-16">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Step {step.number}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">
                      {step.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {step.description}
                    </p>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-hiw-details">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10" data-testid="text-hiw-details-headline">
            Built on trusted sources
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Card data-testid="card-source-sec">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">SEC EDGAR Data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All company filings come directly from the SEC's official EDGAR database — the same source used by Wall Street analysts and institutional investors.
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-source-ai">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Advanced AI Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Powered by state-of-the-art language models that read and understand financial documents, extracting insights with professional-grade accuracy.
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-source-framework">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Professional Framework</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our five-stage analysis mirrors the approach used by equity analysts — adapted for individual investors who want clarity without the complexity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-hiw-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-hiw-cta-headline">
            Try it yourself
          </h2>
          <p className="mt-3 text-lg text-muted-foreground" data-testid="text-hiw-cta-body">
            Pick any stock. See the full analysis. No account needed.
          </p>
          <div className="mt-8">
            <Link href="/app">
              <Button size="lg" className="rounded-full gap-2" data-testid="button-hiw-cta">
                <Search className="h-5 w-5" />
                Research a Stock
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
