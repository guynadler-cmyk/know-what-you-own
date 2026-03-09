import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { HeroThesisDemo } from "@/components/HeroThesisDemo";

import businessOverviewImg from "@assets/Business_Overview_1766161245319.png";
import changesImg from "@assets/Changes_Over_Time_1766161245320.png";
import competitionImg from "@assets/Competition_1766161245321.png";
import performanceImg from "@assets/Understand_Performance_1766161245322.png";
import technicalImg from "@assets/technical_analysis_1766161245321.png";

interface FeatureSection {
  headline: string;
  body: string;
  image: string;
  imageAlt: string;
  imageFirst: boolean;
}

const sections: FeatureSection[] = [
  {
    headline: "Know the business, not just the ticker",
    body: "Before you buy anything, understand what the company actually does, how it makes money, and whether the business model holds up.",
    image: businessOverviewImg,
    imageAlt: "Business overview showing investment thesis and strategic themes",
    imageFirst: false,
  },
  {
    headline: "See how the story changes over time",
    body: "Most investors miss how much a company changes year to year. Restnvest tracks what's new, what's been quietly dropped, and what's actually sticking — without you reading a single filing.",
    image: changesImg,
    imageAlt: "Changes over time tracking business evolution",
    imageFirst: true,
  },
  {
    headline: "Who else is in the room?",
    body: "Every business has competition. Restnvest shows you who they're up against and how they're positioned — so you're not surprised later.",
    image: competitionImg,
    imageAlt: "Competition analysis showing market competitors",
    imageFirst: false,
  },
  {
    headline: "Is this business financially strong?",
    body: "Revenue growth means nothing if the cash isn't real. Restnvest checks the numbers that actually matter — margins, debt, cash flow, reinvestment — and gives you a straight answer.",
    image: performanceImg,
    imageAlt: "Financial performance metrics and health score",
    imageFirst: true,
  },
  {
    headline: "You've done the homework. Now what?",
    body: "Restnvest pairs everything you've learned about the business with market signals — so you can think clearly about timing, sizing, and when to act.",
    image: technicalImg,
    imageAlt: "Technical analysis with aligned signals",
    imageFirst: false,
  },
];

const SECTION_PADDING = "py-20 sm:py-24 lg:py-28";
const BRIDGE_PADDING = "py-12 sm:py-16";

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
          {/* Headline + CTA — constrained to readable width */}
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
                Finding a good company is the easy part. Knowing what to do about it is where you get stuck. Restnvest gives you the process.
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

          {/* Live Investment Thesis Demo — full page width up to max-w-6xl */}
          <div className="mt-14 mx-auto max-w-6xl w-full px-0">
            <HeroThesisDemo />
          </div>
        </section>

        {/* Feature Sections with Mid-Page CTA after Section 3 */}
        {sections.map((section, index) => (
          <div key={index}>
            <section
              className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8 ${
                index % 2 === 0 ? "" : "bg-muted/30"
              }`}
              data-testid={`section-feature-${index + 1}`}
            >
              <div className="mx-auto max-w-6xl">
                <div
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    section.imageFirst ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* Text Column */}
                  <div
                    className={`space-y-6 ${
                      section.imageFirst ? "lg:col-start-2" : ""
                    }`}
                  >
                    <h2
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight"
                      data-testid={`text-headline-${index + 1}`}
                    >
                      {section.headline}
                    </h2>
                    <p
                      className="text-lg text-muted-foreground leading-relaxed"
                      data-testid={`text-body-${index + 1}`}
                    >
                      {section.body}
                    </p>
                  </div>

                  {/* Image Column */}
                  <div
                    className={`${section.imageFirst ? "lg:col-start-1" : ""}`}
                  >
                    <img
                      src={section.image}
                      alt={section.imageAlt}
                      className="w-full rounded-lg shadow-sm border border-border"
                      data-testid={`img-feature-${index + 1}`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Mid-Page CTA after Section 3 (Competition) */}
            {index === 2 && (
              <section 
                id="mid-cta" 
                className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8 bg-muted/30`}
                data-testid="section-mid-cta"
              >
                <div className="mx-auto max-w-2xl text-center">
                  <div className="space-y-2">
                    <h3 
                      className="text-xl sm:text-2xl font-semibold"
                      data-testid="text-mid-cta-headline"
                    >
                      Ready to see this on a stock you care about?
                    </h3>
                    <p 
                      className="text-muted-foreground"
                      data-testid="text-mid-cta-body"
                    >
                      Research any public company in seconds — no signup required.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Link href="/app">
                      <Button
                        size="lg"
                        className="rounded-full gap-2"
                        data-testid="button-mid-cta"
                      >
                        <Search className="h-5 w-5" />
                        Research a stock
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            )}
          </div>
        ))}

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
