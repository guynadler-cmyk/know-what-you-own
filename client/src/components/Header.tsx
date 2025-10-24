import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button 
            className="text-base font-semibold hover-elevate px-3 py-2 rounded-md transition-all"
            onClick={() => window.location.reload()}
            data-testid="link-logo"
          >
            Know What You Own
          </button>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
