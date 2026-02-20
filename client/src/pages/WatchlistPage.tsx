import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bookmark, Search, Trash2, Pencil, Check, X, ExternalLink, LogIn, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistItem } from "@shared/schema";

function SnapshotBadges({ snapshot }: { snapshot: WatchlistItem["snapshot"] }) {
  const badges = [];

  if (snapshot?.performance) {
    const p = snapshot.performance;
    const revGrowth = p.revenueChangePercent;
    if (revGrowth !== undefined && revGrowth !== null) {
      badges.push(
        <Badge key="rev" variant="secondary" className="gap-1 text-xs">
          {revGrowth > 0 ? <TrendingUp className="h-3 w-3" /> : revGrowth < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          Rev {revGrowth > 0 ? "+" : ""}{revGrowth.toFixed(0)}%
        </Badge>
      );
    }
  }

  if (snapshot?.valuation) {
    const v = snapshot.valuation;
    if (v.verdict) {
      badges.push(
        <Badge key="val" variant="secondary" className="text-xs">
          {v.verdict}
        </Badge>
      );
    }
  }

  if (snapshot?.timing) {
    const t = snapshot.timing;
    if (t.trendLabel) {
      badges.push(
        <Badge key="trend" variant="secondary" className="text-xs">
          {t.trendLabel}
        </Badge>
      );
    }
  }

  if (snapshot?.strategy) {
    const s = snapshot.strategy;
    if (s.convictionLabel) {
      badges.push(
        <Badge key="conv" variant="secondary" className="text-xs">
          {s.convictionLabel}
        </Badge>
      );
    }
  }

  if (badges.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-2">{badges}</div>;
}

function WatchlistCard({ item, onRemove, onNotesUpdated }: {
  item: WatchlistItem;
  onRemove: (id: string) => void;
  onNotesUpdated: () => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(item.notes || "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/watchlist/${item.id}/notes`, {
        notes: notesDraft.trim() || null,
      });
    },
    onSuccess: () => {
      setEditingNotes(false);
      onNotesUpdated();
      toast({ title: "Notes updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update notes.", variant: "destructive" });
    },
  });

  const savedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="group" data-testid={`card-watchlist-${item.ticker}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <img
                src={`https://logo.clearbit.com/${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
                alt=""
                className="h-6 w-6 rounded-full bg-muted"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <h3 className="font-semibold text-lg">{item.ticker}</h3>
              <span className="text-sm text-muted-foreground truncate">{item.companyName}</span>
            </div>
            <SnapshotBadges snapshot={item.snapshot} />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate(`/app?ticker=${item.ticker}`)}
              title="Re-analyze"
              data-testid={`button-reanalyze-${item.ticker}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
              title="Remove"
              data-testid={`button-remove-${item.ticker}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {editingNotes ? (
          <div className="mt-3 space-y-2">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="resize-none text-sm"
              rows={3}
              maxLength={2000}
              autoFocus
              data-testid={`input-notes-${item.ticker}`}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{notesDraft.length}/2000</span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setEditingNotes(false); setNotesDraft(item.notes || ""); }}
                  data-testid={`button-cancel-notes-${item.ticker}`}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => updateNotesMutation.mutate()}
                  disabled={updateNotesMutation.isPending}
                  data-testid={`button-save-notes-${item.ticker}`}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            {item.notes ? (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-sm text-muted-foreground text-left w-full hover-elevate rounded-md p-2 -m-2"
                data-testid={`button-edit-notes-${item.ticker}`}
              >
                {item.notes}
              </button>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-sm text-muted-foreground/60 italic hover-elevate rounded-md p-2 -m-2"
                data-testid={`button-add-notes-${item.ticker}`}
              >
                <Pencil className="h-3 w-3 inline mr-1" />
                Add notes...
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">Saved {savedDate}</p>
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {item.ticker}?</DialogTitle>
            <DialogDescription>
              This will remove {item.companyName} from your watchlist. You can always save it again later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { onRemove(item.id); setConfirmDelete(false); }} data-testid="button-confirm-delete">
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: items, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["/api/watchlist"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/watchlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove.", variant: "destructive" });
    },
  });

  const handleNotesUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
  };

  return (
    <SiteLayout>
      <Helmet>
        <title>My Watchlist | Restnvest</title>
        <meta name="description" content="Your saved stock analyses and investment notes." />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Watchlist</h1>
          <p className="text-muted-foreground mt-1">Stocks you're tracking, with your analysis snapshots and notes.</p>
        </div>

        {authLoading || isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : !isAuthenticated ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center gap-4">
              <LogIn className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold mb-1">Sign in to see your watchlist</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Save stocks during analysis so you can come back to them with your notes and snapshot data.
                </p>
              </div>
              <Button className="gap-2" data-testid="button-watchlist-signin" onClick={() => signInWithGoogle().catch(console.error)}>
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        ) : items && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onRemove={(id) => removeMutation.mutate(id)}
                onNotesUpdated={handleNotesUpdated}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center gap-4">
              <Bookmark className="h-12 w-12 text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold mb-1">Your watchlist is empty</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  When you find a stock you're interested in, save it from the analysis page to track it here.
                </p>
              </div>
              <Button onClick={() => navigate("/app")} className="gap-2" data-testid="button-start-analyzing">
                <Search className="h-4 w-4" />
                Start analyzing
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SiteLayout>
  );
}
