import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Search, 
  Scale, 
  Target, 
  TrendingUp, 
  Shield,
  Briefcase,
  Sprout,
  Building2,
  ArrowRight,
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Problem", id: "problem" },
    { label: "Approach", id: "approach" },
    { label: "Product", id: "product" },
    { label: "For You", id: "audience" },
    { label: "Why It Works", id: "why-it-works" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Sticky Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-lg font-semibold hover-elevate px-3 py-2 rounded-md transition-all"
              data-testid="link-logo"
            >
              restnvest
            </button>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate"
                  data-testid={`nav-${link.id}`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => scrollToSection('cta')}
                className="hidden sm:flex rounded-full"
                data-testid="nav-cta"
              >
                Try Restnvest
              </Button>
              <ThemeToggle />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover-elevate"
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="px-4 py-3 text-left text-muted-foreground hover:text-foreground transition-colors rounded-md hover-elevate"
                    data-testid={`nav-mobile-${link.id}`}
                  >
                    {link.label}
                  </button>
                ))}
                <Button
                  onClick={() => scrollToSection('cta')}
                  className="mt-2 rounded-full"
                  data-testid="nav-mobile-cta"
                >
                  Try Restnvest
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative py-24 sm:py-32 lg:py-40 px-4">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Sensible investing beats optimal — because you'll actually stick with it.
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Information isn't enough. Action builds wealth. Sustainable habits keep it growing.
            </p>
            
            <div className="pt-8">
              <Button
                size="lg"
                onClick={() => scrollToSection('cta')}
                className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                data-testid="hero-cta"
              >
                <ArrowRight className="h-5 w-5" />
                Try Restnvest
              </Button>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-20 sm:py-28 px-4 bg-muted/30">
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Most investing advice is built for theory. Not for humans.
              </h2>
            </div>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <div className="flex-shrink-0 w-2 h-2 mt-3 rounded-full bg-primary" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Institutions optimize for averages. But people don't live in averages.
                </p>
              </div>
              
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <div className="flex-shrink-0 w-2 h-2 mt-3 rounded-full bg-primary" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  What's "optimal" is often fragile in real life — too abstract, too volatile, too hard to stick with.
                </p>
              </div>
              
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <div className="flex-shrink-0 w-2 h-2 mt-3 rounded-full bg-primary" />
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Retail investors get stuck in churn. The industry keeps winning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Restnvest Approach Section */}
        <section id="approach" className="py-20 sm:py-28 px-4">
          <div className="mx-auto max-w-6xl space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Sensible &gt; Optimal
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Restnvest turns investing into a process you can actually follow — not a guessing game.
              </p>
            </div>
            
            {/* 5 Steps Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-primary">Step 1</div>
                  <p className="font-medium">Understand the business</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-primary">Step 2</div>
                  <p className="font-medium">Evaluate the deal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-primary">Step 3</div>
                  <p className="font-medium">Plan your investment</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-primary">Step 4</div>
                  <p className="font-medium">Make your move</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl hover-elevate col-span-2 sm:col-span-1">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-primary">Step 5</div>
                  <p className="font-medium">Protect what you own</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Demo Section */}
        <section id="product" className="py-20 sm:py-28 px-4 bg-muted/30">
          <div className="mx-auto max-w-6xl space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                What the app actually does
              </h2>
            </div>
            
            {/* Demo Screenshots Grid */}
            <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-muted border border-border flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">App Screenshot</p>
                  </div>
                </div>
                <p className="text-center text-lg text-muted-foreground font-medium">
                  See how the company makes money
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-muted border border-border flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scale className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">App Screenshot</p>
                  </div>
                </div>
                <p className="text-center text-lg text-muted-foreground font-medium">
                  Evaluate value vs price
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-muted border border-border flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">App Screenshot</p>
                  </div>
                </div>
                <p className="text-center text-lg text-muted-foreground font-medium">
                  Set your entry and exit rules
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-muted border border-border flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">App Screenshot</p>
                  </div>
                </div>
                <p className="text-center text-lg text-muted-foreground font-medium">
                  Track your portfolio with logic, not emotion
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Section */}
        <section id="audience" className="py-20 sm:py-28 px-4">
          <div className="mx-auto max-w-5xl space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Built for people who want to build wealth — not chase hype.
              </h2>
            </div>
            
            {/* Audience Cards */}
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Professionals</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Managing family wealth with intention and discipline
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">First-time Investors</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Starting their long-term investing journey the right way
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Business Owners</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Building retirement plans outside of their business
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why It Works Section */}
        <section id="why-it-works" className="py-20 sm:py-28 px-4 bg-muted/30">
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Compounding only works if you stay invested.
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium">Avoid panic selling</p>
              </div>
              
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium">Stick with winners</p>
              </div>
              
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium">Build habits that compound</p>
              </div>
              
              <div className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium">Own companies, not tickers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section id="cta" className="py-24 sm:py-32 px-4">
          <div className="mx-auto max-w-2xl text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Start investing sensibly
            </h2>
            
            <Button
              size="lg"
              className="rounded-full px-10 py-7 text-xl font-semibold gap-2"
              data-testid="cta-button"
            >
              <ArrowRight className="h-6 w-6" />
              Try Restnvest
            </Button>
            
            <p className="text-sm text-muted-foreground pt-4">
              No credit card required. Start understanding your investments today.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="text-sm font-semibold text-foreground">
              restnvest — Sensible Investing
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>

            <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              For informational purposes only. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
