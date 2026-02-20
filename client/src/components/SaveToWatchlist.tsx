import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bookmark, BookmarkCheck, RefreshCw, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistSnapshot } from "@shared/schema";

interface SaveToWatchlistProps {
  ticker: string;
  companyName: string;
  getSnapshot: () => WatchlistSnapshot;
}

export function SaveToWatchlist({ ticker, companyName, getSnapshot }: SaveToWatchlistProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: checkData, isLoading: checkLoading } = useQuery<{ saved: boolean; item?: { id: string; snapshotHistory?: any[] } | null }>({
    queryKey: ["/api/watchlist/check", ticker],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated && !!ticker,
    staleTime: 30 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const snapshot = getSnapshot();
      await apiRequest("POST", "/api/watchlist", {
        ticker,
        companyName,
        notes: notes.trim() || null,
        snapshot,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", ticker] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setDialogOpen(false);
      setNotes("");
      toast({ title: "Saved to watchlist", description: `${companyName} has been added to your watchlist.` });
    },
    onError: (error: Error) => {
      if (/409/.test(error.message)) {
        toast({ title: "Already saved", description: `${companyName} is already in your watchlist.` });
        setDialogOpen(false);
        return;
      }
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    },
  });

  const updateSnapshotMutation = useMutation({
    mutationFn: async () => {
      const snapshot = getSnapshot();
      const itemId = checkData?.item?.id;
      if (!itemId) throw new Error("No watchlist item found");
      await apiRequest("PATCH", `/api/watchlist/${itemId}/snapshot`, { snapshot });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", ticker] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Snapshot updated", description: `${companyName}'s analysis snapshot has been refreshed. Previous snapshot saved to history.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update snapshot. Please try again.", variant: "destructive" });
    },
  });

  const isSaved = checkData?.saved;
  const historyCount = (checkData?.item?.snapshotHistory as any[])?.length || 0;

  if (authLoading) {
    return <div className="h-9 w-24 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-2"
        data-testid="button-save-watchlist-login"
        onClick={() => signInWithGoogle().catch(console.error)}
      >
        <LogIn className="h-4 w-4" />
        Sign in to save
      </Button>
    );
  }

  if (isSaved) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2 text-primary"
          disabled
          data-testid="button-watchlist-saved"
        >
          <BookmarkCheck className="h-4 w-4" />
          Saved{historyCount > 0 ? ` (${historyCount + 1})` : ""}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2"
          onClick={() => updateSnapshotMutation.mutate()}
          disabled={updateSnapshotMutation.isPending}
          data-testid="button-update-snapshot"
        >
          {updateSnapshotMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Update Snapshot
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-2"
        onClick={() => setDialogOpen(true)}
        disabled={checkLoading}
        data-testid="button-save-watchlist"
      >
        <Bookmark className="h-4 w-4" />
        Save to Watchlist
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save {companyName} ({ticker})</DialogTitle>
            <DialogDescription>
              A snapshot of your current analysis will be saved with this stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why are you interested in this stock? Any thoughts to remember..."
                className="resize-none"
                rows={3}
                maxLength={2000}
                data-testid="input-watchlist-notes"
              />
              <p className="text-xs text-muted-foreground mt-1">{notes.length}/2000</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-watchlist-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2"
                data-testid="button-watchlist-confirm"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
