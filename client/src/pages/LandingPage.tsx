import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ArrowRight,
  Loader2,
  Target,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { analytics } from "@/lib/analytics";
import { motion } from "framer-motion";


interface SearchResult {
  ticker: string;
  name: string;
}

export default function LandingPage() {
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

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formDropdownRef.current && !formDropdownRef.current.contains(event.target as Node)) {
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

  const scrollToInput = () => {
    const element = document.getElementById('ticker-input');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Benefit cards for "Key Outcomes"
  const benefitCards = [
    { 
      icon: Target, 
      text: "Strategic themes that actually matter" 
    },
    { 
      icon: TrendingUp, 
      text: "Market size and competitive moats" 
    },
    { 
      icon: MessageSquare, 
      text: "Clear, human-readable guidance — no noise" 
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
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
        {/* Hero Section — Emotional contrast */}
        <section 
          id="hero" 
          className="py-16 sm:py-24 lg:py-32 px-4"
          data-testid="section-hero"
        >
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]"
              data-testid="text-hero-headline"
            >
              Investing should build wealth — not wear you down.
            </h1>
            
            <p 
              className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-subheadline"
            >
              If you've ever felt like you're just winging it while everyone else seems to have a plan — you're not alone. Most people aren't short on information. They're stuck without a system.
            </p>
            
            <div className="pt-4">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                data-testid="button-hero-cta"
                onClick={scrollToInput}
              >
                Try Restnvest (no signup)
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* The New Way — Personal validation */}
        <section 
          id="new-way" 
          className="py-16 sm:py-20 px-4 bg-muted/30"
          data-testid="section-new-way"
        >
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              data-testid="text-new-way-headline"
            >
              It's not your fault.
            </h2>
            
            <p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-new-way-body"
            >
              Retail investors are expected to act like pros — but given no tools to think like them. Restnvest changes that. Our AI agents work like a team of analysts, turning chaotic filings and market noise into clear, structured insights you can actually act on.
            </p>
          </div>
        </section>

        {/* Try It Instantly — Interactive preview */}
        <section 
          id="ticker-input" 
          className="py-12 sm:py-16 px-4 scroll-mt-20"
          data-testid="section-ticker-input"
        >
          <div className="mx-auto max-w-xl space-y-6">
            <p 
              className="text-center text-lg text-muted-foreground"
              data-testid="text-ticker-intro"
            >
              See what Restnvest's research agents uncover — just type a ticker.
            </p>
            
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
                      data-testid="input-ticker"
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
                      data-testid="dropdown-results"
                    >
                      {searchResults.map((result, index) => (
                        <button
                          key={result.ticker}
                          type="button"
                          onClick={() => selectResult(result)}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover-elevate ${
                            index === selectedIndex ? 'bg-muted' : ''
                          }`}
                          data-testid={`dropdown-item-${result.ticker.toLowerCase()}`}
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
                    <p className="text-sm text-destructive text-center" data-testid="text-error">
                      {tickerError}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-full font-semibold gap-2"
                  data-testid="button-analyze"
                >
                  <Search className="h-5 w-5" />
                  Analyze
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Key Outcomes — Visual clarity */}
        <section 
          id="outcomes" 
          className="py-16 sm:py-20 px-4 bg-muted/30"
          data-testid="section-outcomes"
        >
          <div className="mx-auto max-w-3xl space-y-10">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-center"
              data-testid="text-outcomes-headline"
            >
              What you'll get — instantly.
            </h2>
            
            <div className="grid sm:grid-cols-3 gap-6">
              {benefitCards.map((card, index) => (
                <motion.div 
                  key={card.text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center gap-4 p-6 rounded-xl bg-background border border-border text-center"
                  data-testid={`card-outcome-${index + 1}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-base font-medium">{card.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA — Invitation to go deeper */}
        <section 
          id="cta" 
          className="py-16 sm:py-24 px-4"
          data-testid="section-cta"
        >
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              data-testid="text-cta-headline"
            >
              You've tried doing it all on your own.
            </h2>
            
            <p 
              className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
              data-testid="text-cta-body"
            >
              It's time to invest with structure, confidence, and clarity. Let Restnvest's AI team do the heavy lifting — so you can focus on the decisions that count.
            </p>
            
            <div className="pt-4">
              <Link href="/app">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                  data-testid="button-cta-main"
                >
                  Try Restnvest — it's free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-background" data-testid="footer">
        <div className="mx-auto max-w-3xl px-4 py-8">
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
