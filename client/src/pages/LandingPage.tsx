import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TickerInput } from "@/components/TickerInput";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { ShareButton } from "@/components/ShareButton";
import { DemoCarousel } from "@/components/DemoCarousel";
import { Button } from "@/components/ui/button";
import { useIsPWAInstalled } from "@/hooks/useIsPWAInstalled";
import { Clock, Zap, ShieldCheck, Smartphone } from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const isPWAInstalled = useIsPWAInstalled();

  const handleTickerSubmit = (ticker: string) => {
    setLocation(`/app?ticker=${encodeURIComponent(ticker)}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 px-4">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-block">
              <span className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-6">
                Understand what you own.
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Know the company.
              <br />
              <span className="text-muted-foreground">Not just the stock.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We turn public company information into simple, powerful insights you can actually use.
            </p>
            
            <div className="pt-8">
              <TickerInput onSubmit={handleTickerSubmit} isLoading={false} />
              <p className="text-sm text-muted-foreground mt-4">
                Try it now – Get a free company summary
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <ShareButton variant="outline" />
            </div>
          </div>
        </section>

        {/* See it in Action Section */}
        <section className="py-16 sm:py-24 px-4">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">
                From 100+ page filing to instant clarity
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI reads official company reports submitted to regulators, extracts management's strategic vision, and ranks what matters most—saving you hours of research.
              </p>
            </div>
            
            <DemoCarousel />
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 sm:py-24 px-4 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
              Your analysis. Right now.
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
              {/* Benefit 1: Speed */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Instant results</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Enter a ticker, get your full analysis in under 60 seconds. No waiting, no subscriptions.
                </p>
              </div>

              {/* Benefit 2: Clarity */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Decision-ready clarity</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Get the investment case summarized—no jargon, no fluff, just what matters for your decision.
                </p>
              </div>

              {/* Benefit 3: Trust */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Confidence you can trust</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Sourced directly from official filings—the same documents Wall Street analysts rely on.
                </p>
              </div>

              {/* Benefit 4: Accessibility */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Access from anywhere</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Works on any device. Install as an app on your phone for instant access on the go.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Section - Only show if PWA is not installed */}
        {!isPWAInstalled && (
          <section className="py-20 px-4 bg-muted/20">
            <div className="mx-auto max-w-4xl space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Take it with you
                </h2>
                <p className="text-xl text-muted-foreground">
                  Install restnvest on your phone for easy access anywhere
                </p>
              </div>
              
              <QRCodeDisplay 
                url={window.location.origin}
                showInstructions={true}
              />
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to invest with clarity?
            </h2>
            <p className="text-xl text-muted-foreground">
              Enter any stock ticker to see what we can do.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              data-testid="button-cta-scroll-top"
            >
              Try It Free
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
