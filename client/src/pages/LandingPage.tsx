import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Package, TrendingUp, Users, BarChart3, Target } from "lucide-react";
import { Link } from "wouter";

interface FeatureSection {
  headline: string;
  body: string;
  icon: typeof Package;
  imageFirst: boolean;
}

const sections: FeatureSection[] = [
  {
    headline: "Know what you're actually investing in",
    body: "Restnvest breaks companies down into what they build, who they serve, and how they operate — so you understand the business behind the ticker.",
    icon: Package,
    imageFirst: false,
  },
  {
    headline: "See how the story changes over time",
    body: "Companies evolve. Restnvest tracks what's new, what's sustained, and what's fading — so you can follow the business narrative without reading filings.",
    icon: TrendingUp,
    imageFirst: true,
  },
  {
    headline: "Understand the competitive landscape",
    body: "Every business operates in a market. Restnvest shows who the real competitors are, helping you understand positioning and differentiation.",
    icon: Users,
    imageFirst: false,
  },
  {
    headline: "Is this business financially strong?",
    body: "Restnvest summarizes revenue growth, profitability, cash flow, debt, and reinvestment into clear signals — helping you decide if a business is worth holding.",
    icon: BarChart3,
    imageFirst: true,
  },
  {
    headline: "Turn understanding into confident action",
    body: "Restnvest pairs business fundamentals with technical analysis to help you think clearly about timing, risk, and potential entry or exit — without noise.",
    icon: Target,
    imageFirst: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <span 
              className="text-lg font-semibold"
              data-testid="link-logo"
            >
              restnvest
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 pt-14">
        {/* Feature Sections */}
        {sections.map((section, index) => (
          <section
            key={index}
            className={`py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${
              index % 2 === 1 ? "bg-muted/30" : ""
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

                {/* Image Placeholder Column */}
                <div
                  className={`${section.imageFirst ? "lg:col-start-1" : ""}`}
                >
                  <div 
                    className="w-full aspect-[4/3] rounded-lg border border-border bg-muted/50 flex items-center justify-center"
                    data-testid={`img-placeholder-${index + 1}`}
                  >
                    <section.icon className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Final CTA Section */}
        <section
          id="cta"
          className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
          data-testid="section-cta"
        >
          <div className="mx-auto max-w-2xl text-center">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                data-testid="button-cta-research"
              >
                Research a stock
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-background" data-testid="footer">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="text-sm font-semibold" data-testid="text-footer-brand">
              restnvest
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
