import { ThemeToggle } from "./ThemeToggle";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { ShareButton } from "./ShareButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  showInstallButton?: boolean;
}

export function Header({ showInstallButton = false }: HeaderProps) {
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
          
          <div className="flex items-center gap-2">
            <ShareButton variant="ghost" size="icon" showText={false} />
            
            {showInstallButton && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    data-testid="button-install-app"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Install App</DialogTitle>
                  </DialogHeader>
                  <QRCodeDisplay 
                    url={window.location.origin}
                    showInstructions={true}
                    title="Install restnvest"
                  />
                </DialogContent>
              </Dialog>
            )}
            
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
