import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show the install button
      setShowButton(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setShowButton(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      
      // Show success toast
      toast({
        title: "Installation complete!",
        description: "restnvest has been added to your device.",
      });
      
      // Show success dialog with instructions
      setShowSuccessDialog(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      toast({
        title: "Installation unavailable",
        description: "App installation is not available at this time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsInstalling(true);
      
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] User response to the install prompt: ${outcome}`);

      if (outcome === 'accepted') {
        toast({
          title: "Installing app...",
          description: "restnvest is being added to your device.",
        });
      } else {
        // User dismissed the prompt
        toast({
          title: "Installation cancelled",
          description: "Refresh the page to see the install option again.",
        });
        setIsInstalling(false);
      }

      // Clear the deferred prompt and hide button after any choice
      // The event can only be used once and won't fire again in this session
      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('[PWA] Installation error:', error);
      toast({
        title: "Installation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsInstalling(false);
    }
  };

  if (!showButton) {
    return null;
  }

  return (
    <>
      <Button 
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={isInstalling}
        data-testid="button-install-pwa"
      >
        {isInstalling ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Installing...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Install App
          </>
        )}
      </Button>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent data-testid="dialog-install-success">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-6 w-6 text-primary" data-testid="icon-success" />
            </div>
            <DialogTitle className="text-center">App Installed Successfully!</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Find restnvest on your device</p>
                  <p className="text-sm">Look for the restnvest icon on your home screen or app drawer.</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium text-foreground mb-2">Quick tip:</p>
                <p className="text-sm">On most devices, you can tap and hold the app icon to add it to your home screen for faster access.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              data-testid="button-close-dialog"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
