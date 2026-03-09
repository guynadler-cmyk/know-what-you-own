import { useState, useEffect, useRef } from "react";
import { Loader2, Search } from "lucide-react";
import { SampleAnalysisCard } from "@/components/SampleAnalysisCard";

interface TickerInputProps {
  onSubmit: (ticker: string) => void;
  isLoading?: boolean;
}

interface SearchResult {
  ticker: string;
  name: string;
}

const SAMPLE_TICKERS = ["PLTR", "NVDA", "AAPL"];

export function TickerInput({ onSubmit, isLoading = false }: TickerInputProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const justSelectedRef = useRef(false);
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
          signal: abortController.signal,
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
        if (err.name !== "AbortError") console.error("Search failed:", err);
      } finally {
        if (!abortController.signal.aborted) setIsSearching(false);
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
    if (!trimmed) { setError("Enter a company name or ticker"); return; }
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
    justSelectedRef.current = true;
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    justSelectedRef.current = false;
    if (error) setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, searchResults.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, -1)); }
    else if (e.key === "Enter" && selectedIndex >= 0) { e.preventDefault(); selectResult(searchResults[selectedIndex]); }
    else if (e.key === "Escape") setShowDropdown(false);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* search bar */}
      <div className="w-full" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-[10px] border transition-all"
              style={{
                background: "white",
                borderWidth: "1.5px",
                borderColor: "rgba(42,140,133,0.18)",
                boxShadow: "0 4px 24px rgba(13,74,71,0.07)",
              }}
            >
              {isSearching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" style={{ color: "var(--lp-ink-ghost)" }} />
              ) : (
                <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--lp-ink-ghost)" }} />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchResults.length > 0 && !justSelectedRef.current && setShowDropdown(true)}
                placeholder="Company name or ticker..."
                className="flex-1 bg-transparent border-none outline-none text-sm py-2.5"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--lp-ink)", fontSize: 14 }}
                disabled={isLoading}
                data-testid="input-ticker"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-[7px] px-5 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 flex-shrink-0"
                style={{ background: "var(--lp-teal-deep)", fontFamily: "'DM Sans', sans-serif" }}
                data-testid="button-analyze"
              >
                {isLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</>
                ) : (
                  "Analyze →"
                )}
              </button>
            </div>

            {/* dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div
                className="absolute z-50 w-full mt-1.5 rounded-xl border overflow-hidden shadow-lg"
                style={{ background: "white", borderColor: "rgba(42,140,133,0.12)" }}
                data-testid="dropdown-search-results"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={result.ticker}
                    type="button"
                    onClick={() => selectResult(result)}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover-elevate ${
                      index === selectedIndex ? "bg-muted" : ""
                    }`}
                    data-testid={`dropdown-item-${result.ticker.toLowerCase()}`}
                  >
                    <span className="font-mono font-semibold text-sm min-w-[60px]" style={{ color: "var(--lp-teal-brand)" }}>
                      {result.ticker}
                    </span>
                    <span className="text-sm truncate" style={{ color: "var(--lp-ink-ghost)" }}>
                      {result.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mt-2" data-testid="text-error">
              {error}
            </p>
          )}
        </form>
      </div>

      {/* trust line */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 mb-12">
        {["No signup required", "Takes seconds", "Real company data", "88+ companies pre-analyzed"].map((item, i, arr) => (
          <span key={item} className="flex items-center gap-3">
            <span className="text-[11px] font-light" style={{ color: "var(--lp-ink-ghost)" }}>
              {item}
            </span>
            {i < arr.length - 1 && (
              <span style={{ color: "rgba(42,140,133,0.25)" }}>·</span>
            )}
          </span>
        ))}
      </div>

      {/* sample analysis cards */}
      <p className="text-[11px] mb-4" style={{ color: "var(--lp-ink-ghost)" }}>
        Try a recent analysis
      </p>
      <div className="grid gap-3.5 w-full" style={{ gridTemplateColumns: "repeat(3, 280px)", justifyContent: "center" }}>
        {SAMPLE_TICKERS.map(ticker => (
          <SampleAnalysisCard key={ticker} ticker={ticker} />
        ))}
      </div>
    </div>
  );
}
