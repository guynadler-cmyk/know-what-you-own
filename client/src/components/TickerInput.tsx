import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

interface TickerInputProps {
  onSubmit: (ticker: string) => void;
  isLoading?: boolean;
}

export function TickerInput({ onSubmit, isLoading = false }: TickerInputProps) {
  const [ticker, setTicker] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmed = ticker.trim().toUpperCase();
    
    if (!trimmed) {
      setError("Please enter a ticker symbol");
      return;
    }
    
    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      setError("Please enter a valid ticker (1-5 letters)");
      return;
    }
    
    setError("");
    onSubmit(trimmed);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value.toUpperCase());
    if (error) setError("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="text"
              value={ticker}
              onChange={handleInputChange}
              placeholder="Enter stock ticker (e.g., AAPL, TSLA)"
              className={`text-lg h-12 pr-12 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              disabled={isLoading}
              data-testid="input-ticker"
              maxLength={5}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {error && (
            <p className="text-sm text-destructive" data-testid="text-error">
              {error}
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 text-white"
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
              Analyze Business
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Try these examples:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'META', 'NVDA'].map((example) => (
            <button
              key={example}
              onClick={() => {
                setTicker(example);
                setError("");
              }}
              className="px-3 py-1 text-sm font-mono bg-card border border-card-border rounded-md hover-elevate active-elevate-2 transition-all"
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
