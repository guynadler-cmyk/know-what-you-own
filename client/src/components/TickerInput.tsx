import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface TickerInputProps {
  onSubmit: (ticker: string) => void;
  isLoading?: boolean;
}

interface SearchResult {
  ticker: string;
  name: string;
}

export function TickerInput({ onSubmit, isLoading = false }: TickerInputProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
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
          setShowDropdown(results.length > 0);
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
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = query.trim().toUpperCase();
    
    if (!trimmed) {
      setError("Enter a company name or ticker");
      return;
    }

    if (/^[A-Z]{1,5}$/.test(trimmed)) {
      setError("");
      setShowDropdown(false);
      onSubmit(trimmed);
      return;
    }

    if (searchResults.length > 0) {
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      selectResult(searchResults[idx]);
      return;
    }

    setError("Select a company from the suggestions");
  };

  const selectResult = (result: SearchResult) => {
    setQuery(result.ticker);
    setShowDropdown(false);
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (error) setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const setExampleTicker = (ticker: string) => {
    setQuery(ticker);
    setError("");
    setShowDropdown(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3 relative" ref={dropdownRef}>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Company name or ticker..."
              className={`text-2xl h-16 text-center font-mono tracking-wide border-2 rounded-xl pr-12 ${
                error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'
              }`}
              disabled={isLoading}
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
              data-testid="dropdown-search-results"
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
          
          {error && (
            <p className="text-sm text-destructive text-center" data-testid="text-error">
              {error}
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-14 text-lg rounded-full font-semibold"
          disabled={isLoading}
          data-testid="button-analyze"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Analyze
            </>
          )}
        </Button>
      </form>
      
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">Test your knowledge with hot AI stocks:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['IOT', 'PATH', 'AI', 'PLTR', 'SMCI'].map((example) => (
            <button
              key={example}
              onClick={() => setExampleTicker(example)}
              className="px-6 py-2 text-base font-mono text-primary bg-muted border border-border rounded-full hover-elevate active-elevate-2 transition-all"
              data-testid={`button-example-${example.toLowerCase()}`}
              disabled={isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
