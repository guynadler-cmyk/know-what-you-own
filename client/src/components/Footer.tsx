export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Data sourced from SEC EDGAR • Summaries powered by OpenAI
          </p>
          <p className="text-xs text-muted-foreground max-w-2xl">
            This tool provides AI-generated summaries of SEC filings for informational purposes only. 
            Not investment advice. Always consult the original filings and a financial advisor.
          </p>
          <div className="flex items-center gap-4">
            <button 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded"
              onClick={() => console.log('Navigate to Restnvest')}
              data-testid="link-restnvest"
            >
              Restnvest
            </button>
            <span className="text-muted-foreground">•</span>
            <button 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hover-elevate px-2 py-1 rounded"
              onClick={() => console.log('Navigate to Privacy')}
              data-testid="link-privacy"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
