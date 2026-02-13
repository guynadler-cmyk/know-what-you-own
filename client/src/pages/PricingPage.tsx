import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Check, Search, ArrowRight, Clock } from "lucide-react";

const freeTierFeatures = [
  "Full 10-K business analysis",
  "AI-powered investment thesis",
  "Competitive landscape mapping",
  "Financial performance summary",
  "Technical analysis signals",
  "Conviction-based plan builder",
  "No account required",
  "Unlimited searches",
];

const proTierFeatures = [
  "Everything in Free, plus:",
  "Multi-year filing comparison",
  "Portfolio watchlist tracking",
  "Custom alerts and notifications",
  "Advanced financial modeling",
  "Earnings call analysis",
  "Export to PDF reports",
  "Priority AI processing",
  "Email research digests",
];

export default function PricingPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>Pricing - Restnvest</title>
        <meta
          name="description"
          content="Restnvest pricing plans. Start for free with full AI-powered stock research. Pro tier coming soon with advanced features."
        />
        <meta property="og:title" content="Pricing - Restnvest" />
        <meta
          property="og:description"
          content="Free AI-powered stock research. No signup required. Pro tier coming soon."
        />
        <link rel="canonical" href="https://restnvest.com/pricing" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-pricing-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-pricing-eyebrow">
            Pricing
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-pricing-headline"
          >
            Serious research, no barrier to entry
          </h1>
          <p
            className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-pricing-subheadline"
          >
            Restnvest is free to use today — and always will be for core research. We're building a Pro tier for investors who want to go deeper.
          </p>
        </div>
      </section>

      <section className="pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8" data-testid="section-pricing-tiers">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <Card className="relative" data-testid="card-tier-free">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-xl">Free</CardTitle>
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Full-featured research for every investor. No strings attached.
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <Link href="/app">
                  <Button className="w-full rounded-full gap-2 mb-6" data-testid="button-free-cta">
                    <Search className="h-4 w-4" />
                    Start Researching
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {freeTierFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="relative border-primary/30" data-testid="card-tier-pro">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="gap-1">
                  <Clock className="h-3 w-3" />
                  Coming Soon
                </Badge>
              </div>
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-xl">Pro</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-muted-foreground/50">---</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  For investors who want portfolio-level insights and advanced tools.
                </p>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <Button variant="outline" className="w-full rounded-full gap-2 mb-6" disabled data-testid="button-pro-cta">
                  Notify Me When Available
                </Button>
                <ul className="space-y-3">
                  {proTierFeatures.map((feature, i) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${i === 0 ? "text-primary" : "text-muted-foreground/40"}`} />
                      <span className="text-muted-foreground/60">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-pricing-faq">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8" data-testid="text-pricing-faq-headline">
            Common questions about pricing
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Will the free tier stay free?",
                a: "Yes. Core research features — full 10-K analysis, competitive landscape, financial performance, and the plan builder — will always be free. We believe every investor deserves access to quality research.",
              },
              {
                q: "What will Pro include?",
                a: "Pro will offer portfolio-level features like watchlists, multi-year comparisons, custom alerts, and exportable PDF reports. We're building based on what our users tell us they need.",
              },
              {
                q: "How can I influence what goes into Pro?",
                a: "Use Restnvest and let us know what features would make your investing process better. Your feedback directly shapes our roadmap.",
              },
            ].map((item) => (
              <div key={item.q} className="space-y-1.5">
                <h3 className="font-semibold text-sm">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
