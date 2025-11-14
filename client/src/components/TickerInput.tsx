import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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
      setError("Enter a ticker");
      return;
    }
    
    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      setError("Invalid ticker");
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
    <div className="w-full max-w-xl mx-auto space-y-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Input
            type="text"
            value={ticker}
            onChange={handleInputChange}
            placeholder="Which company?"
            className={`text-2xl h-16 text-center font-mono tracking-wide border-2 rounded-xl ${
              error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'
            }`}
            disabled={isLoading}
            data-testid="input-ticker"
            maxLength={5}
          />
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
            'Analyze'
          )}
        </Button>
      </form>
      
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">Test your knowledge with hot AI stocks:</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['IOT', 'PATH', 'AI', 'PLTR', 'SMCI'].map((example) => (
            <button
              key={example}
              onClick={() => {
                setTicker(example);
                setError("");
              }}
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
