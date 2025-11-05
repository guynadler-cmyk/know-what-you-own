export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <div className="text-sm font-semibold text-foreground">
            restnvest – Sensible Investing
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>

          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-generated summaries for informational purposes. Not investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
