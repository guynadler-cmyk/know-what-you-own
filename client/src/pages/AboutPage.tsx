import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Search, ArrowRight, Shield, Eye, Lightbulb, Heart } from "lucide-react";

const values = [
  {
    icon: Eye,
    title: "Clarity over complexity",
    description:
      "Financial information shouldn't require a finance degree to understand. We distill the essential truths from dense filings into language anyone can act on.",
  },
  {
    icon: Shield,
    title: "Honesty by design",
    description:
      "We'll never tell you what to buy. Restnvest presents facts, analysis, and frameworks — the decisions are always yours. That's by design, not by limitation.",
  },
  {
    icon: Lightbulb,
    title: "Education through use",
    description:
      "Every time you research a company with Restnvest, you're learning how professional analysts think. The tool teaches by doing, not by lecturing.",
  },
  {
    icon: Heart,
    title: "Built for the long term",
    description:
      "We're not chasing hype cycles or meme stocks. Restnvest is for people who want to understand businesses deeply and hold with conviction — the approach that actually builds wealth.",
  },
];

export default function AboutPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>About - Restnvest</title>
        <meta
          name="description"
          content="Learn about Restnvest's mission to make professional-grade investment research accessible to every investor through AI-powered analysis."
        />
        <meta property="og:title" content="About Restnvest" />
        <meta
          property="og:description"
          content="Our mission: make professional-grade investment research accessible to every investor."
        />
        <link rel="canonical" href="https://restnvest.com/about" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-about-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-about-eyebrow">
            About Restnvest
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-about-headline"
          >
            Investing should reward understanding, not access
          </h1>
          <p
            className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-about-subheadline"
          >
            We're building the research tool we wish existed when we started investing.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8" data-testid="section-about-story">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Restnvest started with a simple frustration: understanding a public company shouldn't require a Bloomberg terminal, a finance degree, or hours of reading dense SEC filings.
            </p>
            <p>
              The information is public. It's sitting right there in the SEC's EDGAR database, freely available to anyone. But the barrier was never access — it was comprehension. A typical 10-K filing runs hundreds of pages of legal and financial language that most individual investors never read. The result? People invest in companies they don't truly understand.
            </p>
            <p>
              We're a small team of builders who believe technology should close that gap. By combining direct access to SEC filings with advanced AI analysis, Restnvest transforms raw financial documents into structured, plain-English research that follows the same framework used by professional analysts.
            </p>
            <p>
              We're not a trading platform. We don't manage money. We don't tell you what to buy. We give you the clarity to make your own informed decisions — and the framework to act on them with conviction.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-about-values">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-10" data-testid="text-about-values-headline">
            What we believe
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} data-testid={`card-value-${value.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                      <value.icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{value.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-about-mission">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4" data-testid="text-about-mission-headline">
            Our mission
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            To make professional-grade investment research accessible to every investor — not just the ones who can afford expensive tools and subscriptions. Quality information should be the starting point, not the privilege.
          </p>
        </div>
      </section>

      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-about-contact">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-about-contact-headline">
            Get in touch
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Have feedback, ideas, or just want to say hello? We'd love to hear from you. We read every message.
          </p>
          <div className="mt-6">
            <Button variant="outline" size="lg" className="rounded-full" asChild data-testid="button-contact-email">
              <a href="mailto:product@restnvest.com">
                product@restnvest.com
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-about-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-about-cta-headline">
            See what we've built
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            The best way to understand Restnvest is to try it.
          </p>
          <div className="mt-8">
            <Link href="/app">
              <Button size="lg" className="rounded-full gap-2" data-testid="button-about-cta">
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
