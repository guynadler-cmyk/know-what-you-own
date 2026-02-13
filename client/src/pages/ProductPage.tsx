import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Building2,
  TrendingUp,
  Users,
  BarChart3,
  LineChart,
  Target,
  ArrowRight,
} from "lucide-react";

import businessOverviewImg from "@assets/Business_Overview_1766161245319.png";
import changesImg from "@assets/Changes_Over_Time_1766161245320.png";
import competitionImg from "@assets/Competition_1766161245321.png";
import performanceImg from "@assets/Understand_Performance_1766161245322.png";
import technicalImg from "@assets/technical_analysis_1766161245321.png";

const stages = [
  {
    icon: Building2,
    number: "01",
    title: "Business Overview",
    subtitle: "Understand what the company actually does",
    description:
      "Restnvest reads the company's SEC 10-K filing and distills it into a clear narrative. You'll see what the business builds, who it serves, how it makes money, and the strategic themes driving its future — all in plain English.",
    features: [
      "AI-generated investment thesis",
      "Strategic themes and competitive moats",
      "Revenue model breakdown",
      "Market opportunity assessment",
    ],
    image: businessOverviewImg,
    imageAlt: "Business overview showing investment thesis and strategic themes",
  },
  {
    icon: TrendingUp,
    number: "02",
    title: "Changes Over Time",
    subtitle: "Track how the business story evolves",
    description:
      "Companies change. Restnvest compares filings year over year, highlighting what's new, what's sustained, and what's fading. You stay on top of the narrative without reading hundreds of pages.",
    features: [
      "Year-over-year comparison",
      "New developments highlighted",
      "Sustained strengths tracked",
      "Fading themes flagged",
    ],
    image: changesImg,
    imageAlt: "Changes over time tracking business evolution",
  },
  {
    icon: Users,
    number: "03",
    title: "Competitive Landscape",
    subtitle: "Know who else is in the arena",
    description:
      "Every business operates in a market with real competitors. Restnvest maps the competitive landscape so you understand positioning, differentiation, and where the real threats lie.",
    features: [
      "Direct competitor identification",
      "Market positioning analysis",
      "Differentiation factors",
      "Competitive moat evaluation",
    ],
    image: competitionImg,
    imageAlt: "Competition analysis showing market competitors",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Financial Performance",
    subtitle: "Is this business financially strong?",
    description:
      "Revenue growth, profitability, cash flow, debt levels, and reinvestment rates — all summarized into clear signals. Restnvest helps you decide whether the business has the financial health to back its story.",
    features: [
      "Revenue and growth metrics",
      "Profitability indicators",
      "Cash flow analysis",
      "Debt and leverage assessment",
    ],
    image: performanceImg,
    imageAlt: "Financial performance metrics and health score",
  },
  {
    icon: LineChart,
    number: "05",
    title: "Timing & Strategy",
    subtitle: "Turn understanding into confident action",
    description:
      "Restnvest pairs fundamental analysis with technical indicators — trend, momentum, and stretch signals — so you can think clearly about timing. Then build a structured investment plan with conviction-based position sizing.",
    features: [
      "Trend and momentum analysis",
      "Entry/exit signal assessment",
      "Conviction-based position sizing",
      "Structured tranche planning",
    ],
    image: technicalImg,
    imageAlt: "Technical analysis with aligned signals",
  },
];

export default function ProductPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>Product - Restnvest</title>
        <meta
          name="description"
          content="Explore how Restnvest transforms SEC 10-K filings into clear, actionable investment research across five structured analysis stages."
        />
        <meta property="og:title" content="Product - Restnvest" />
        <meta
          property="og:description"
          content="AI-powered stock research across five analysis stages: business overview, changes, competition, performance, and timing."
        />
        <link rel="canonical" href="https://restnvest.com/product" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-product-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-product-eyebrow">
            The Restnvest Platform
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-product-headline"
          >
            Five stages to investment clarity
          </h1>
          <p
            className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-product-subheadline"
          >
            Restnvest guides you through the same structured process a professional analyst uses — from understanding the business to acting with confidence.
          </p>
        </div>
      </section>

      {stages.map((stage, index) => (
        <section
          key={stage.number}
          className={`py-16 sm:py-20 px-4 sm:px-6 lg:px-8 ${
            index % 2 !== 0 ? "bg-muted/30" : ""
          }`}
          data-testid={`section-stage-${stage.number}`}
        >
          <div className="mx-auto max-w-6xl">
            <div
              className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                index % 2 !== 0 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <div className={`space-y-6 ${index % 2 !== 0 ? "lg:col-start-2" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary">
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Stage {stage.number}
                  </span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-tight"
                  data-testid={`text-stage-title-${stage.number}`}
                >
                  {stage.title}
                </h2>
                <p className="text-lg text-primary/80 font-medium">{stage.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed">{stage.description}</p>
                <ul className="space-y-2">
                  {stage.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={index % 2 !== 0 ? "lg:col-start-1" : ""}>
                <img
                  src={stage.image}
                  alt={stage.imageAlt}
                  className="w-full rounded-lg shadow-sm border border-border"
                  data-testid={`img-stage-${stage.number}`}
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-product-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-product-cta-headline">
            See it in action
          </h2>
          <p className="mt-3 text-lg text-muted-foreground" data-testid="text-product-cta-body">
            Research any public company in seconds. No signup required.
          </p>
          <div className="mt-8">
            <Link href="/app">
              <Button size="lg" className="rounded-full gap-2" data-testid="button-product-cta">
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
