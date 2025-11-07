import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TickerInput } from "@/components/TickerInput";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { ShareButton } from "@/components/ShareButton";
import { DemoCarousel } from "@/components/DemoCarousel";
import { Button } from "@/components/ui/button";
import { useIsPWAInstalled } from "@/hooks/useIsPWAInstalled";
import { CheckCircle, TrendingUp, Shield, Heart } from "lucide-react";

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
                See it in action
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Swipe through real company analyses — see the investment tags, thesis, and insights you'll get instantly.
              </p>
            </div>
            
            <DemoCarousel />
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 sm:py-24 px-4 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
              Why Business Analyzer?
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-8 sm:gap-12">
              {/* Benefit 1 */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Know what a company actually does</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Plain-English explanations of products, services, and how they make money.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Understand the money</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  See how profitable the company is — and where the money goes.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Spot red flags early</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We surface key risks, recent changes, and warning signs automatically.
                </p>
              </div>

              {/* Benefit 4 */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Invest with long-term confidence</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Insights that help you hold through downturns — not panic sell.
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
