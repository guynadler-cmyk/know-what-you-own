import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ArrowRight,
  Loader2,
  TrendingUp,
  Shield,
  Target,
  AlertTriangle,
  BarChart3,
  Users,
  Clock,
  Briefcase
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { analytics } from "@/lib/analytics";


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

  // Preview items for "What you'll get"
  const previewItems = [
    { label: "Strategic themes", icon: Target },
    { label: "Market size", icon: TrendingUp },
    { label: "Competitive edge", icon: Shield },
    { label: "Risks & red flags", icon: AlertTriangle },
    { label: "Business model", icon: Briefcase },
    { label: "Key metrics", icon: BarChart3 },
    { label: "Competitors", icon: Users },
    { label: "Recent changes", icon: Clock },
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
        {/* Hero Section */}
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
              Most tools give you charts. We give you clarity.
            </h1>
            
            <p 
              className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-hero-subheadline"
            >
              Restnvest turns investing into a simple, structured workflow — so you know what you own, why you own it, and what to do next.
            </p>
            
            <div className="pt-4">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
                data-testid="button-hero-cta"
                onClick={scrollToInput}
              >
                Try it instantly
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Ticker Input Section */}
        <section 
          id="ticker-input" 
          className="py-12 sm:py-16 px-4 bg-muted/30 scroll-mt-20"
          data-testid="section-ticker-input"
        >
          <div className="mx-auto max-w-xl space-y-6">
            <div className="rounded-2xl bg-background border border-border shadow-sm p-6 sm:p-8 space-y-6">
              <form onSubmit={handleTickerSubmit} className="space-y-4" ref={formDropdownRef}>
                <label className="block text-center text-lg font-medium mb-4">
                  Enter a ticker (e.g., AAPL, TSLA)
                </label>
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
              
              <p className="text-center text-sm text-muted-foreground" data-testid="text-no-signup">
                No sign-up needed. Just instant insight.
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Get Section */}
        <section 
          id="preview" 
          className="py-16 sm:py-20 px-4"
          data-testid="section-preview"
        >
          <div className="mx-auto max-w-3xl space-y-10">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-center"
              data-testid="text-preview-headline"
            >
              What you'll get in seconds
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {previewItems.map((item) => (
                <div 
                  key={item.label}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border"
                  data-testid={`preview-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why It Matters Section */}
        <section 
          id="philosophy" 
          className="py-16 sm:py-20 px-4 bg-muted/30"
          data-testid="section-philosophy"
        >
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              data-testid="text-philosophy-headline"
            >
              Information isn't insight. Clarity builds conviction.
            </h2>
            
            <p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              data-testid="text-philosophy-body"
            >
              Most investors give up not because they're wrong — but because they never understood what they owned in the first place. Restnvest helps you invest in businesses, not tickers — with a clear process you can actually stick with.
            </p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section 
          id="cta" 
          className="py-16 sm:py-24 px-4"
          data-testid="section-cta"
        >
          <div className="mx-auto max-w-xl text-center space-y-8">
            <h2 
              className="text-2xl sm:text-3xl font-bold"
              data-testid="text-cta-headline"
            >
              Start your first analysis now
            </h2>
            
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold gap-2"
              data-testid="button-cta-main"
              onClick={scrollToInput}
            >
              Try it instantly
              <ArrowRight className="h-5 w-5" />
            </Button>
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
