import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
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
  X,
  FileText,
  Gauge,
  AlertTriangle,
  Bell,
  Bot,
  Sparkles,
  Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { analytics } from "@/lib/analytics";


interface SearchResult {
  ticker: string;
  name: string;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Ticker input state
  const [tickerQuery, setTickerQuery] = useState("");
  const [tickerError, setTickerError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const justSelectedRef = useRef(false);
  const formDropdownRef = useRef<HTMLFormElement>(null);
  const aiSectionFormRef = useRef<HTMLFormElement>(null);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideMainForm = formDropdownRef.current && !formDropdownRef.current.contains(target);
      const isOutsideAiForm = aiSectionFormRef.current && !aiSectionFormRef.current.contains(target);
      if (isOutsideMainForm && isOutsideAiForm) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for tickers
  useEffect(() => {
    const trimmed = tickerQuery.trim();
    if (trimmed.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const abortController = new AbortController();
    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: abortController.signal
        });
        if (response.ok && !abortController.signal.aborted) {
          const results = await response.json();
          setSearchResults(results);
          if (!justSelectedRef.current) {
            setShowDropdown(results.length > 0);
          }
          setSelectedIndex(-1);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Search failed:", err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [tickerQuery]);

  const handleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tickerQuery.trim().toUpperCase();
    
    // Default demo behavior: if empty, use AAPL
    if (!trimmed) {
      setTickerError("");
      setShowDropdown(false);
      analytics.trackTickerSearch("AAPL");
      setLocation(`/app?ticker=AAPL`);
      return;
    }

    if (/^[A-Z]{1,5}$/.test(trimmed)) {
      setTickerError("");
      setShowDropdown(false);
      analytics.trackTickerSearch(trimmed);
      setLocation(`/app?ticker=${trimmed}`);
      return;
    }

    if (searchResults.length > 0) {
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      selectResult(searchResults[idx]);
      return;
    }

    setTickerError("Select a company from the suggestions");
  };

  const selectResult = (result: SearchResult) => {
    setTickerQuery(result.ticker);
    setShowDropdown(false);
    justSelectedRef.current = true;
    setTickerError("");
    analytics.trackTickerSearch(result.ticker);
    setLocation(`/app?ticker=${result.ticker}`);
  };

  const handleTickerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTickerQuery(e.target.value);
    justSelectedRef.current = false;
    if (tickerError) setTickerError("");
  };

  const handleTickerKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectResult(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
      analytics.trackLandingSection(sectionId);
    }
  };

  const navLinks = [
    { label: "Problem", id: "problem" },
    { label: "Approach", id: "approach" },
    { label: "AI", id: "ai-section" },
    { label: "For You", id: "audience" },
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
            <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
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
              <Link href="/app">
                <Button
                  className="hidden sm:flex rounded-full"
                  data-testid="nav-cta"
                >
                  Try Restnvest
                </Button>
              </Link>
              <ThemeToggle />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md hover-elevate"
                data-testid="button-mobile-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-border" data-testid="nav-mobile">
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
                <Link href="/app">
                  <Button
                    className="mt-2 rounded-full w-full"
                    data-testid="nav-mobile-cta"
                  >
                    Try Restnvest
                  </Button>
                </Link>
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          id="hero" 
          className="relative py-16 sm:py-20 lg:py-24 px-4 scroll-mt-20"
          data-testid="section-hero"
        >
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
              data-testid="text-hero-headline"
            >
              Investing that makes sense. Finally.
            </h1>
            
            <p 
              className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              data-testid="text-hero-subheadline"
            >
              AI agents do the heavy lifting — you stay in control. Restnvest turns chaotic data into clear, structured guidance — so you can invest like a pro, without acting like one.
            </p>
            
            <div className="pt-4 space-y-3">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                data-testid="button-hero-cta"
                onClick={() => {
                  const el = document.getElementById('analysis-input');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Try it instantly
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Unified Discovery & Analysis Section */}
        <section 
          id="analysis-input" 
          className="mt-16 mb-16 py-12 sm:py-16 px-4 bg-muted/30 scroll-mt-20"
          data-testid="section-analysis-input"
        >
          <div className="mx-auto max-w-xl space-y-8">
            {/* What You'll Discover Heading */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-semibold" data-testid="text-analysis-heading">
                  What You'll Discover Instantly
                </h2>
              </div>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                Get instant insight on any company — no jargon, no guesswork. Just enter a ticker to discover themes, moats, and market shifts in seconds.
              </p>
            </div>
            
            {/* Discovery Badges */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {['Strategic Themes', 'Market Size', 'Competitive Moats', 'Value Creation', 'Recent Shifts', 'Competitors', 'Leadership'].map((item) => (
                <div
                  key={item}
                  className="bg-background border border-border px-3 py-1.5 text-sm rounded-full shadow-sm text-center"
                  data-testid={`badge-discovery-${item.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item}
                </div>
              ))}
            </div>
            
            {/* Analysis Form */}
            <div className="rounded-2xl bg-background border border-border shadow-sm p-6 sm:p-8 space-y-6">
              <form onSubmit={handleTickerSubmit} className="space-y-4" ref={formDropdownRef}>
                <div className="space-y-3 relative">
                  <div className="relative">
                    <Input
                      type="text"
                      value={tickerQuery}
                      onChange={handleTickerInputChange}
                      onKeyDown={handleTickerKeyDown}
                      onFocus={() => searchResults.length > 0 && !justSelectedRef.current && setShowDropdown(true)}
                      placeholder="Company name or ticker..."
                      className={`text-lg sm:text-xl h-14 sm:h-16 text-center font-mono tracking-wide border-2 rounded-xl pr-12 ${
                        tickerError ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'
                      }`}
                      data-testid="input-hero-ticker"
                      autoComplete="off"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {showDropdown && searchResults.length > 0 && (
                    <div 
                      className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
                      data-testid="dropdown-hero-results"
                    >
                      {searchResults.map((result, index) => (
                        <button
                          key={result.ticker}
                          type="button"
                          onClick={() => selectResult(result)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover-elevate ${
                            index === selectedIndex ? 'bg-muted' : ''
                          }`}
                          data-testid={`dropdown-hero-item-${result.ticker.toLowerCase()}`}
                        >
                          <span className="font-mono font-semibold text-primary min-w-[60px]">
                            {result.ticker}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {result.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {tickerError && (
                    <p className="text-sm text-destructive text-center" data-testid="text-hero-error">
                      {tickerError}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full font-semibold gap-2"
                  data-testid="button-hero-analyze"
                >
                  Analyze
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Hot stocks:</p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {['IOT', 'PATH', 'AI', 'PLTR', 'SMCI'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setTickerQuery(example);
                        setTickerError("");
                        setShowDropdown(false);
                        justSelectedRef.current = true;
                      }}
                      className="px-4 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-mono text-primary bg-background border border-border rounded-full hover-elevate active-elevate-2 transition-all"
                      data-testid={`button-hero-example-${example.toLowerCase()}`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-1">No signup. Just type a ticker and go.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section - Quadrant Layout */}
        <section 
          id="problem" 
          className="py-24 sm:py-32 px-4 bg-muted/30 scroll-mt-20"
          data-testid="section-problem"
        >
          <div className="mx-auto max-w-6xl space-y-16">
            {/* Section Header */}
            <div className="text-center space-y-6">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary rounded-full">
                The Problem
              </span>
              <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                data-testid="text-problem-headline"
              >
                Most investing advice is built for theory. Not for humans.
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Traditional advice assumes you're a spreadsheet. But real life is messy, emotional, and unpredictable.
              </p>
            </div>
            
            {/* Quadrant Grid with Central Visual */}
            <div className="relative">
              {/* Grid Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* Top Left - Averages */}
                <div className="p-8 rounded-2xl bg-background border border-border shadow-sm space-y-4" data-testid="card-problem-1">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Averages</span>
                  <h3 className="text-xl font-semibold">Built for institutions, not you</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-problem-1">
                    Institutions optimize for averages. But people don't live in averages — your goals, timeline, and risk tolerance are unique.
                  </p>
                </div>
                
                {/* Top Right - Fragile */}
                <div className="p-8 rounded-2xl bg-background border border-border shadow-sm space-y-4" data-testid="card-problem-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Fragile</span>
                  <h3 className="text-xl font-semibold">Optimal doesn't survive real life</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-problem-2">
                    What's "optimal" is often fragile in real life. It's too abstract, too volatile, too hard to stick with when markets get rough.
                  </p>
                </div>
                
                {/* Bottom Left - Churn */}
                <div className="p-8 rounded-2xl bg-background border border-border shadow-sm space-y-4" data-testid="card-problem-3">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Churn</span>
                  <h3 className="text-xl font-semibold">Buy high, sell low, repeat</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-problem-3">
                    Retail investors get stuck in churn — chasing trends, panic selling, and missing the compounding that builds wealth.
                  </p>
                </div>
                
                {/* Bottom Right - Noise */}
                <div className="p-8 rounded-2xl bg-background border border-border shadow-sm space-y-4" data-testid="card-problem-4">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Noise</span>
                  <h3 className="text-xl font-semibold">Information overload, clarity deficit</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-problem-4">
                    Endless news, conflicting opinions, and complex jargon. The industry keeps winning while you drown in noise.
                  </p>
                </div>
              </div>
              
            </div>
            
            {/* CTA Below Grid */}
            <div className="flex flex-col items-center pt-12 space-y-4">
              <p className="text-xl font-medium">Ready to act differently?</p>
              <Link href="/app">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                  data-testid="button-problem-cta"
                >
                  Start analyzing
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Restnvest Approach Section */}
        <section 
          id="approach" 
          className="py-24 sm:py-32 px-4 scroll-mt-20"
          data-testid="section-approach"
        >
          <div className="mx-auto max-w-6xl space-y-20">
            <div className="text-center space-y-6">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary rounded-full">
                Our Approach
              </span>
              <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                data-testid="text-approach-headline"
              >
                Sensible &gt; Optimal
              </h2>
              <p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
                data-testid="text-approach-subheadline"
              >
                Restnvest turns investing into a process you can actually follow. It's no longer a guessing game.
              </p>
            </div>
            
            {/* Alternating Steps Layout */}
            <div className="space-y-16 lg:space-y-24">
              {/* Step 1: Understand - Text Left, Visual Right */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center" data-testid="card-step-1">
                <div className="space-y-6">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Step 1</span>
                  <h3 className="text-2xl sm:text-3xl font-semibold" data-testid="text-step-1">Understand the business</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Before you invest a dollar, know what you're buying. AI reads through SEC filings and earnings calls to give you a plain-English summary of how the company makes money.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Summarized by AI</span>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm p-6 rounded-2xl bg-muted/50 border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Search className="h-5 w-5 text-primary" />
                        <span className="font-medium">Business Overview</span>
                      </div>
                      <div className="space-y-3">
                        <div className="h-3 bg-primary/20 rounded-full w-full" />
                        <div className="h-3 bg-primary/10 rounded-full w-4/5" />
                        <div className="h-3 bg-primary/10 rounded-full w-3/4" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">Revenue</span>
                        <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">Model</span>
                        <span className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full">Risks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2: Evaluate - Visual Left, Text Right */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center" data-testid="card-step-2">
                <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                  <div className="w-full max-w-sm p-6 rounded-2xl bg-muted/50 border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Scale className="h-5 w-5 text-primary" />
                        <span className="font-medium">Valuation Analysis</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fair Value</span>
                        <span className="font-semibold text-primary">$142</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Price</span>
                        <span className="font-semibold">$128</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-primary rounded-full" />
                      </div>
                      <p className="text-xs text-center text-primary font-medium">11% undervalued</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Step 2</span>
                  <h3 className="text-2xl sm:text-3xl font-semibold" data-testid="text-step-2">Evaluate the deal</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Is this stock worth the price? Our AI scores the valuation so you can see if you're getting a fair deal — or paying too much for hype.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Fair value scored</span>
                  </div>
                </div>
              </div>
              
              {/* Step 3: Plan - Text Left, Visual Right */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center" data-testid="card-step-3">
                <div className="space-y-6">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Step 3</span>
                  <h3 className="text-2xl sm:text-3xl font-semibold" data-testid="text-step-3">Plan your investment</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Set your own rules: how much to buy, at what price, and when to sell. A plan removes emotion from the equation and keeps you disciplined.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm p-6 rounded-2xl bg-muted/50 border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Target className="h-5 w-5 text-primary" />
                        <span className="font-medium">Investment Plan</span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entry price</span>
                          <span className="font-medium">$125 or below</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Position size</span>
                          <span className="font-medium">5% of portfolio</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exit trigger</span>
                          <span className="font-medium">Thesis breaks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 4: Execute - Visual Left, Text Right */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center" data-testid="card-step-4">
                <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                  <div className="w-full max-w-sm p-6 rounded-2xl bg-muted/50 border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-medium">Trade Execution</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Plan conditions met</p>
                          <p className="text-xs text-muted-foreground">Price dropped to $124</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full rounded-full">Execute Trade</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Step 4</span>
                  <h3 className="text-2xl sm:text-3xl font-semibold" data-testid="text-step-4">Make your move</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    When conditions align with your plan, you act with confidence. No second-guessing, no FOMO — just executing what you already decided.
                  </p>
                </div>
              </div>
              
              {/* Step 5: Protect - Text Left, Visual Right */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center" data-testid="card-step-5">
                <div className="space-y-6">
                  <span className="text-xs font-semibold tracking-wider uppercase text-primary">Step 5</span>
                  <h3 className="text-2xl sm:text-3xl font-semibold" data-testid="text-step-5">Protect what you own</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Your investment thesis can break. AI monitors your holdings and alerts you when something changes — so you can exit on your terms, not panic.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Exit rules monitored</span>
                  </div>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <div className="w-full max-w-sm p-6 rounded-2xl bg-muted/50 border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-medium">Portfolio Watch</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm">AAPL - Thesis intact</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm">MSFT - Thesis intact</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-destructive/5 rounded-lg border border-destructive/20">
                          <div className="w-2 h-2 rounded-full bg-destructive" />
                          <span className="text-sm">XYZ - Review needed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Powered Section */}
        <section 
          id="ai-section" 
          className="py-24 sm:py-32 px-4 bg-muted/30 scroll-mt-20"
          data-testid="section-ai"
        >
          <div className="mx-auto max-w-6xl space-y-16">
            <div className="text-center space-y-6">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary rounded-full">
                AI-Powered
              </span>
              <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                data-testid="text-ai-headline"
              >
                Let AI do the hard work. You just follow the plan.
              </h2>
              <p 
                className="text-xl text-muted-foreground max-w-3xl mx-auto"
                data-testid="text-ai-subheadline"
              >
                Restnvest uses a quiet army of AI agents to read filings, summarize earnings calls, and analyze risks — so you get clarity, not chaos.
              </p>
            </div>
            
            {/* AI Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-ai-1"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold" data-testid="text-ai-feature-1-title">Business insights, simplified</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-feature-1-desc">
                    AI reads the filings and earnings calls so you don't have to.
                  </p>
                </div>
              </div>
              
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-ai-2"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold" data-testid="text-ai-feature-2-title">Fair value scoring</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-feature-2-desc">
                    Understand if a stock is overvalued, undervalued, or just right.
                  </p>
                </div>
              </div>
              
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-ai-3"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold" data-testid="text-ai-feature-3-title">Risk signals</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-feature-3-desc">
                    AI surfaces red flags and hidden risks — automatically.
                  </p>
                </div>
              </div>
              
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-ai-4"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold" data-testid="text-ai-feature-4-title">Plan-aware alerts</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-feature-4-desc">
                    Get nudges based on your goals and rules — not the market's mood.
                  </p>
                </div>
              </div>
            </div>
            
            {/* AI Agents Visual */}
            <div className="relative py-12" data-testid="ai-visual">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {/* Document input */}
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">10-K Filings</span>
                </div>
                
                {/* Arrow */}
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                
                {/* AI Processing - animated */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">AI Agents</span>
                </div>
                
                {/* Arrow */}
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                
                {/* Output - insights */}
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Your Plan</span>
                </div>
              </div>
            </div>
            
            {/* Try It Now - Ticker Input */}
            <div className="w-full max-w-xl mx-auto space-y-8 pt-8" data-testid="ai-section-ticker-input">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">See it in action</h3>
                <p className="text-muted-foreground">Try analyzing any public company right now</p>
              </div>
              
              <form onSubmit={handleTickerSubmit} className="space-y-6" ref={aiSectionFormRef}>
                <div className="space-y-3 relative">
                  <div className="relative">
                    <Input
                      type="text"
                      value={tickerQuery}
                      onChange={handleTickerInputChange}
                      onKeyDown={handleTickerKeyDown}
                      onFocus={() => searchResults.length > 0 && !justSelectedRef.current && setShowDropdown(true)}
                      placeholder="Company name or ticker..."
                      className={`text-2xl h-16 text-center font-mono tracking-wide border-2 rounded-xl pr-12 ${
                        tickerError ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'
                      }`}
                      data-testid="input-ai-ticker"
                      autoComplete="off"
                    />
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {showDropdown && searchResults.length > 0 && (
                    <div 
                      className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
                      data-testid="dropdown-ai-results"
                    >
                      {searchResults.map((result, index) => (
                        <button
                          key={result.ticker}
                          type="button"
                          onClick={() => selectResult(result)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover-elevate ${
                            index === selectedIndex ? 'bg-muted' : ''
                          }`}
                          data-testid={`dropdown-ai-item-${result.ticker.toLowerCase()}`}
                        >
                          <span className="font-mono font-semibold text-primary min-w-[60px]">
                            {result.ticker}
                          </span>
                          <span className="text-muted-foreground truncate">
                            {result.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {tickerError && (
                    <p className="text-sm text-destructive text-center" data-testid="text-ai-error">
                      {tickerError}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg rounded-full font-semibold"
                  data-testid="button-ai-analyze"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Analyze
                </Button>
              </form>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">Try these hot AI stocks:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {['IOT', 'PATH', 'AI', 'PLTR', 'SMCI'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setTickerQuery(example);
                        setTickerError("");
                        setShowDropdown(false);
                        justSelectedRef.current = true;
                      }}
                      className="px-6 py-2 text-base font-mono text-primary bg-background border border-border rounded-full hover-elevate active-elevate-2 transition-all"
                      data-testid={`button-example-${example.toLowerCase()}`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audience Section */}
        <section 
          id="audience" 
          className="py-24 sm:py-32 px-4 scroll-mt-20"
          data-testid="section-audience"
        >
          <div className="mx-auto max-w-5xl space-y-16">
            <div className="text-center space-y-6">
              <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary rounded-full">
                For You
              </span>
              <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                data-testid="text-audience-headline"
              >
                Built for people who want to build wealth, not chase hype.
              </h2>
            </div>
            
            {/* Audience Cards */}
            <div className="grid sm:grid-cols-3 gap-8">
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-audience-professionals"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold" data-testid="text-audience-professionals-title">Professionals</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-audience-professionals-desc">
                  Managing family wealth with intention and discipline
                </p>
              </div>
              
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-audience-firsttime"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold" data-testid="text-audience-firsttime-title">First-time Investors</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-audience-firsttime-desc">
                  Starting their long-term investing journey the right way
                </p>
              </div>
              
              <div 
                className="flex flex-col items-center text-center space-y-4 p-8 rounded-xl border border-border bg-background hover-elevate"
                data-testid="card-audience-business"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold" data-testid="text-audience-business-title">Business Owners</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="text-audience-business-desc">
                  Building retirement plans outside of their business
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why It Works Section */}
        <section 
          id="why-it-works" 
          className="py-20 sm:py-28 px-4 bg-muted/30 scroll-mt-20"
          data-testid="section-why-it-works"
        >
          <div className="mx-auto max-w-4xl space-y-12">
            <div className="text-center space-y-4">
              <h2 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
                data-testid="text-why-headline"
              >
                Compounding only works if you stay invested.
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div 
                className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border"
                data-testid="card-benefit-1"
              >
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium" data-testid="text-benefit-1">Avoid panic selling</p>
              </div>
              
              <div 
                className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border"
                data-testid="card-benefit-2"
              >
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium" data-testid="text-benefit-2">Stick with winners</p>
              </div>
              
              <div 
                className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border"
                data-testid="card-benefit-3"
              >
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium" data-testid="text-benefit-3">Build habits that compound</p>
              </div>
              
              <div 
                className="flex gap-4 items-start p-6 rounded-xl bg-background border border-border"
                data-testid="card-benefit-4"
              >
                <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-lg font-medium" data-testid="text-benefit-4">Own companies, not tickers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section 
          id="cta" 
          className="py-24 sm:py-32 px-4 scroll-mt-20"
          data-testid="section-cta"
        >
          <div className="mx-auto max-w-2xl text-center space-y-8">
            <h2 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
              data-testid="text-cta-headline"
            >
              Start investing sensibly
            </h2>
            
            <Link href="/app" className="pt-4 inline-block">
              <Button
                size="lg"
                className="rounded-full px-10 py-7 text-xl font-semibold gap-2"
                data-testid="button-cta-main"
              >
                <ArrowRight className="h-6 w-6" />
                Try Restnvest
              </Button>
            </Link>
            
            <p 
              className="text-sm text-muted-foreground pt-4"
              data-testid="text-cta-disclaimer"
            >
              No credit card required. Start understanding your investments today.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background" data-testid="footer">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="text-sm font-semibold text-foreground" data-testid="text-footer-brand">
              restnvest — Sensible Investing
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-about">About</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-terms">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-privacy">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors" data-testid="link-contact">Contact</a>
            </div>

            <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed" data-testid="text-footer-disclaimer">
              For informational purposes only. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
