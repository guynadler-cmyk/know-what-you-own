import { ThemeToggle } from "./ThemeToggle";
import { ShareButton } from "./ShareButton";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Smartphone } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <button 
            className="text-base font-semibold hover-elevate px-3 py-2 rounded-md transition-all hidden sm:block"
            onClick={() => window.location.href = '/'}
            data-testid="link-logo"
          >
            Know What You Own
          </button>
          
          <div className="flex items-center gap-3 ml-auto">
            <ShareButton variant="outline" size="sm" showText={true} />
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  data-testid="button-install"
                >
                  <Smartphone className="h-4 w-4" />
                  Install
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Install restnvest
                  </DialogTitle>
                </DialogHeader>
                <QRCodeDisplay 
                  url={window.location.origin}
                  showInstructions={true}
                />
              </DialogContent>
            </Dialog>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
