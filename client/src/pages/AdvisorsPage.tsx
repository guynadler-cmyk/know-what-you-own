import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import {
  Clock,
  FileText,
  MessageSquare,
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CalendarCheck,
  Search,
  Mail,
} from "lucide-react";

const useCases = [
  {
    icon: MessageSquare,
    title: "Answer client questions",
    description:
      "A client asks about a holding or a stock they saw in the news. In minutes, pull up a clear summary of the business, its financials, and competitive position — ready to share.",
  },
  {
    icon: FileText,
    title: "Newsletter research",
    description:
      "Building a weekly or monthly newsletter? Restnvest gives you structured analysis you can reference or adapt — business overview, key changes, and performance signals all in one place.",
  },
  {
    icon: BarChart3,
    title: "Quarterly review prep",
    description:
      "Preparing for client reviews? Quickly pull up-to-date analysis on every holding. Understand what changed, what the numbers say, and what the competitive landscape looks like.",
  },
  {
    icon: Search,
    title: "Quick due diligence",
    description:
      "Evaluating a new position? Get a structured five-stage breakdown — from business model to timing signals — in seconds instead of hours of reading filings.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Hours to minutes",
    description: "What used to take hours of reading filings and building summaries now takes minutes.",
  },
  {
    icon: Shield,
    title: "Consistent quality",
    description: "Every analysis follows the same professional framework, so nothing gets missed.",
  },
  {
    icon: Zap,
    title: "Always current",
    description: "Analysis pulls directly from the latest SEC filings — no stale data.",
  },
  {
    icon: Users,
    title: "Client-ready language",
    description: "Summaries are written in plain English your clients can actually understand.",
  },
];

export default function AdvisorsPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <SiteLayout>
      <Helmet>
        <title>For Financial Advisors - Restnvest</title>
        <meta
          name="description"
          content="Restnvest helps financial advisors research stocks faster, prepare client communications, and build quarterly reviews — powered by AI analysis of SEC filings."
        />
        <meta property="og:title" content="For Financial Advisors - Restnvest" />
        <meta
          property="og:description"
          content="Research faster. Communicate clearer. AI-powered stock analysis built for advisors."
        />
        <link rel="canonical" href="https://restnvest.com/advisors" />
      </Helmet>

      <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8" data-testid="section-advisors-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-advisors-eyebrow">
            For Financial Advisors
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-advisors-headline"
          >
            Research faster. Communicate clearer.
          </h1>
          <p
            className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-advisors-subheadline"
          >
            Restnvest helps you turn SEC filings into client-ready insights in minutes — so you spend less time reading and more time advising.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-advisors-demo">
              <CalendarCheck className="h-5 w-5" />
              Book a Demo
            </Button>
            <Link href="/app">
              <Button variant="outline" size="lg" className="rounded-full gap-2" data-testid="button-advisors-try">
                <Search className="h-4 w-4" />
                Try the Tool
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ContactFormDialog open={demoOpen} onOpenChange={setDemoOpen} />
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-advisors-problem">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-advisors-problem-headline">
            Your clients have questions. You need answers fast.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Between client calls, portfolio reviews, and market updates, there's never enough time to deeply research every holding. Restnvest gives you structured, professional-grade analysis on any public company — instantly.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-advisors-usecases">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-advisors-usecases-headline">
              Built for how you actually work
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you're prepping for a meeting or fielding a quick question, Restnvest fits into your workflow.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.title} data-testid={`card-usecase-${useCase.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary shrink-0">
                      <useCase.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{useCase.title}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed text-sm">{useCase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-advisors-benefits">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-advisors-benefits-headline">
              Why advisors choose Restnvest
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center" data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mx-auto mb-4">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-advisors-how">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-advisors-how-headline">
              How it works
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Search any public company",
                description: "Type a ticker or company name. Restnvest pulls the latest SEC 10-K filing automatically.",
              },
              {
                step: "2",
                title: "Get structured analysis",
                description: "In seconds, you'll see a five-stage breakdown: business overview, year-over-year changes, competitive landscape, financial performance, and timing signals.",
              },
              {
                step: "3",
                title: "Use it with clients",
                description: "Reference the analysis in calls, copy insights into emails, or use the structured framework to prepare your own commentary.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4" data-testid={`step-${item.step}`}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-advisors-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-advisors-cta-headline">
            See how Restnvest fits your practice
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            We'll walk you through the platform and show you how advisors are using it to save time and communicate more clearly with clients.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-advisors-cta-demo">
              <CalendarCheck className="h-5 w-5" />
              Book a Demo
            </Button>
            <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-advisors-cta-contact">
              <Mail className="h-4 w-4" />
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
