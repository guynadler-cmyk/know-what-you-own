import { ThemeToggle } from "./ThemeToggle";
import { TrendingUp } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Know What You Own</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-2 rounded-md"
                data-testid="link-how-it-works"
                onClick={() => console.log('Navigate to How it Works')}
              >
                How it Works
              </button>
              <button 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate px-3 py-2 rounded-md"
                data-testid="link-about"
                onClick={() => console.log('Navigate to About')}
              >
                About
              </button>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
