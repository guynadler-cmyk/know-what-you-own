import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

import businessOverviewImg from "@assets/Business_Overview_1766161245319.png";
import changesImg from "@assets/Changes_Over_Time_1766161245320.png";
import competitionImg from "@assets/Competition_1766161245321.png";
import performanceImg from "@assets/Understand_Performance_1766161245322.png";
import technicalImg from "@assets/technical_analysis_1766161245321.png";
import headerLogo from "@assets/ChatGPT_Image_Jan_22,_2026,_12_16_06_PM_1769109403610.png";
import wordmarkWithTagline from "@assets/ChatGPT_Image_Jan_12,_2026,_06_06_56_PM_1769108399893.png";

interface FeatureSection {
  headline: string;
  body: string;
  image: string;
  imageAlt: string;
  imageFirst: boolean;
}

const sections: FeatureSection[] = [
  {
    headline: "Know what you're actually investing in",
    body: "Restnvest breaks companies down into what they build, who they serve, and how they operate — so you understand the business behind the ticker.",
    image: businessOverviewImg,
    imageAlt: "Business overview showing investment thesis and strategic themes",
    imageFirst: false,
  },
  {
    headline: "See how the story changes over time",
    body: "Companies evolve. Restnvest tracks what's new, what's sustained, and what's fading — so you can follow the business narrative without reading filings.",
    image: changesImg,
    imageAlt: "Changes over time tracking business evolution",
    imageFirst: true,
  },
  {
    headline: "Understand the competitive landscape",
    body: "Every business operates in a market. Restnvest shows who the real competitors are, helping you understand positioning and differentiation.",
    image: competitionImg,
    imageAlt: "Competition analysis showing market competitors",
    imageFirst: false,
  },
  {
    headline: "Is this business financially strong?",
    body: "Restnvest summarizes revenue growth, profitability, cash flow, debt, and reinvestment into clear signals — helping you decide if a business is worth holding.",
    image: performanceImg,
    imageAlt: "Financial performance metrics and health score",
    imageFirst: true,
  },
  {
    headline: "Turn understanding into confident action",
    body: "Restnvest pairs business fundamentals with technical analysis to help you think clearly about timing, risk, and potential entry or exit — without noise.",
    image: technicalImg,
    imageAlt: "Technical analysis with aligned signals",
    imageFirst: false,
  },
];

const SECTION_PADDING = "py-20 sm:py-24 lg:py-28";
const BRIDGE_PADDING = "py-12 sm:py-16";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
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

      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f8f9fa] dark:bg-background/95 backdrop-blur border-b border-[#e0e0e0] dark:border-border overflow-visible">
        <div className="flex justify-between items-start px-4 sm:px-8 h-16 max-w-[1200px] mx-auto">
          <Link href="/" data-testid="link-logo" className="flex items-start -mt-2">
            <img 
              src={headerLogo} 
              alt="Restnvest - Informed investing, built to last" 
              className="h-48 md:h-64 w-auto object-contain"
            />
          </Link>
          <div className="pt-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section 
          id="hero" 
          className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
          data-testid="section-hero"
        >
          <div className="mx-auto max-w-3xl text-center">
            <div className="space-y-4">
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
                data-testid="text-hero-headline"
              >
                Invest with clarity and conviction
              </h1>
              <p 
                className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                data-testid="text-hero-subheadline"
              >
                Restnvest turns complex business performance and market signals into a clear, structured view — so you can understand what you own, why you own it, and when to act.
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
                  Research a stock
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
        </section>

        {/* Narrative Bridge */}
        <section 
          id="bridge" 
          className={`${BRIDGE_PADDING} px-4 sm:px-6 lg:px-8 bg-muted/30`}
          data-testid="section-bridge"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p 
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed"
              data-testid="text-bridge"
            >
              Restnvest guides you through an investment the same way a professional would — from understanding the business, to tracking how it evolves, to evaluating strength, and finally acting with confidence.
            </p>
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
                Invest with clarity. Act with confidence.
              </h2>
              <p 
                className="text-lg text-muted-foreground leading-relaxed"
                data-testid="text-final-cta-body"
              >
                See the full picture behind any stock — business fundamentals, financial strength, and technical signals — all in one place.
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
                  Research a stock
                </Button>
              </Link>
              <p 
                className="text-sm text-muted-foreground"
                data-testid="text-final-tagline"
              >
                Built for long-term thinkers
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-background" data-testid="footer">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center" data-testid="text-footer-brand">
              <img 
                src={wordmarkWithTagline} 
                alt="Restnvest - Informed investing, built to last" 
                className="h-24 sm:h-32 object-contain dark:brightness-110"
              />
            </div>
            <p className="text-xs text-muted-foreground" data-testid="text-footer-disclaimer">
              For informational purposes only. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
