import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function ShareButton({ 
  variant = "outline", 
  size = "default",
  className = "",
  showText = true 
}: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'restnvest - Know What You Own',
      text: 'Understand any public company in minutes.',
      url: window.location.origin
    };

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
          fallbackCopy();
        }
      }
    } else {
      // Fallback: copy to clipboard
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    navigator.clipboard.writeText(window.location.origin)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Share link",
          description: window.location.origin,
          variant: "default",
        });
      });
  };

  return (
    <Button
      onClick={handleShare}
      variant={variant}
      size={size}
      className={className}
      data-testid="button-share"
    >
      {size === "icon" ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {showText && <span>Share</span>}
        </>
      )}
    </Button>
  );
}
