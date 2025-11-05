import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button 
            className="text-base font-semibold hover-elevate px-3 py-2 rounded-md transition-all"
            onClick={() => window.location.href = '/'}
            data-testid="link-logo"
          >
            Know What You Own
          </button>
          
          <div className="flex items-center gap-4">
            {!isLoading && (
              isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  Log Out
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-login"
                >
                  Sign In
                </Button>
              )
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
