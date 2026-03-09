import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { HeroThesisDemo } from "@/components/HeroThesisDemo";
import { HeroTemporalDemo } from "@/components/HeroTemporalDemo";
import { HeroFinancialDemo } from "@/components/HeroFinancialDemo";
import { HeroTimingDemo } from "@/components/HeroTimingDemo";

const SECTION_PADDING = "py-20 sm:py-24 lg:py-28";

export default function LandingPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>Restnvest – Smarter Investing</title>
        <meta name="description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI. Research stocks with confidence." />
        <meta property="og:title" content="Restnvest – Smarter Investing" />
        <meta property="og:description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI. Research stocks with confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://restnvest.com/" />
        <meta property="og:image" content="https://restnvest.com/icons/icon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Restnvest – Smarter Investing" />
        <meta name="twitter:description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI." />
        <link rel="canonical" href="https://restnvest.com/" />
      </Helmet>

      {/* Hero Section */}
      <section
        id="hero"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        data-testid="section-hero"
      >
        {/* Headline + CTA */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="space-y-4">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
              data-testid="text-hero-headline"
            >
              You look at your portfolio and think: what was I thinking?
            </h1>
            <p
              className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-subheadline"
            >
              Stop being embarrassed by your portfolio.<br />
              Invest like the person you're trying to become.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-full gap-2"
                data-testid="button-hero-cta"
              >
                <Search className="h-5 w-5" />
                Research a stock →
              </Button>
            </Link>
            <p
              className="text-sm text-muted-foreground"
              data-testid="text-hero-microcopy"
            >
              No signup required · Takes seconds
            </p>
          </div>
        </div>

        {/* Live Investment Thesis Demo */}
        <div className="mt-14 mx-auto max-w-6xl w-full px-0">
          <HeroThesisDemo />
        </div>
      </section>

      {/* Demo Section 1 — Changes Over Time */}
      <section
        id="demo-temporal"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8 bg-muted/30`}
        data-testid="section-demo-temporal"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              See how the story changes over time
            </h2>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Track what's new, what's been quietly dropped, and what's actually sticking — without reading a single filing.
            </p>
          </div>
          <HeroTemporalDemo />
        </div>
      </section>

      {/* Demo Section 2 — Financial Analysis */}
      <section
        id="demo-financial"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        data-testid="section-demo-financial"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              Is this business financially strong?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Revenue growth means nothing if the cash isn't real. Restnvest checks the numbers that actually matter — margins, debt, cash flow, reinvestment — and gives you a straight answer.
            </p>
          </div>
          <HeroFinancialDemo />
        </div>
      </section>

      {/* Demo Section 3 — Technical Analysis */}
      <section
        id="demo-timing"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8 bg-muted/30`}
        data-testid="section-demo-timing"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
              You've done the homework. Now what?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Restnvest pairs everything you've learned about the business with market signals — so you can think clearly about timing and when to act.
            </p>
          </div>
          <HeroTimingDemo />
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        id="cta"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8 bg-muted/30`}
        data-testid="section-final-cta"
      >
        <div className="mx-auto max-w-2xl text-center">
          <div className="space-y-3">
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              data-testid="text-final-cta-headline"
            >
              Your next investment should have a reason behind it.
            </h2>
            <p
              className="text-lg text-muted-foreground leading-relaxed"
              data-testid="text-final-cta-body"
            >
              Research any public company in seconds — business, finances, competition, and signals, all in one place.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-full gap-2"
                data-testid="button-final-cta"
              >
                <Search className="h-5 w-5" />
                Research a stock →
              </Button>
            </Link>
            <p
              className="text-sm text-muted-foreground"
              data-testid="text-final-tagline"
            >
              Built for investors who think before they buy.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
