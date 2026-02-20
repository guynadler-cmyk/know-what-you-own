import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bookmark, Search, Trash2, Pencil, Check, X, ExternalLink,
  LogIn, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Clock, History,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WatchlistItem, WatchlistSnapshot, HistoricalSnapshot } from "@shared/schema";

function SnapshotBadges({ snapshot, size = "default" }: { snapshot: WatchlistSnapshot; size?: "default" | "sm" }) {
  const badges = [];
  const textClass = size === "sm" ? "text-[10px]" : "text-xs";

  if (snapshot?.performance) {
    const p = snapshot.performance;
    const revGrowth = p.revenueChangePercent;
    if (revGrowth !== undefined && revGrowth !== null) {
      badges.push(
        <Badge key="rev" variant="secondary" className={`gap-1 ${textClass}`}>
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
        <Badge key="val" variant="secondary" className={textClass}>
          {v.verdict}
        </Badge>
      );
    }
  }

  if (snapshot?.timing) {
    const t = snapshot.timing;
    if (t.trendLabel) {
      badges.push(
        <Badge key="trend" variant="secondary" className={textClass}>
          {t.trendLabel}
        </Badge>
      );
    }
  }

  if (snapshot?.strategy) {
    const s = snapshot.strategy;
    if (s.convictionLabel) {
      badges.push(
        <Badge key="conv" variant="secondary" className={textClass}>
          {s.convictionLabel}
        </Badge>
      );
    }
  }

  if (badges.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5">{badges}</div>;
}

function SnapshotHistoryTimeline({ history, currentSnapshot, currentDate }: {
  history: HistoricalSnapshot[];
  currentSnapshot: WatchlistSnapshot;
  currentDate: string;
}) {
  const allSnapshots = [
    ...history.map(h => ({ snapshot: h.snapshot, date: h.savedAt, isCurrent: false })),
    { snapshot: currentSnapshot, date: currentDate, isCurrent: true },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {allSnapshots.map((entry, index) => {
        const date = new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const time = new Date(entry.date).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        return (
          <div
            key={index}
            className={`relative pl-6 pb-3 ${index < allSnapshots.length - 1 ? "border-l border-border ml-2" : "ml-2"}`}
          >
            <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${entry.isCurrent ? "bg-primary" : "bg-muted-foreground/40"}`} />
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium">{date} at {time}</span>
              {entry.isCurrent && (
                <Badge variant="secondary" className="text-[10px]">Current</Badge>
              )}
            </div>
            <SnapshotBadges snapshot={entry.snapshot} size="sm" />
          </div>
        );
      })}
    </div>
  );
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
  const [showHistory, setShowHistory] = useState(false);

  const history = (item.snapshotHistory as HistoricalSnapshot[] | null) || [];
  const hasHistory = history.length > 0;

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

  const createdTime = new Date(item.createdAt).getTime();
  const updatedTime = new Date(item.updatedAt).getTime();

  const savedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const updatedDate = new Date(item.updatedAt).toLocaleDateString("en-US", {
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
              <h3 className="font-semibold text-lg" data-testid={`text-ticker-${item.ticker}`}>{item.ticker}</h3>
              <span className="text-sm text-muted-foreground truncate">{item.companyName}</span>
              {hasHistory && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <History className="h-3 w-3" />
                  {history.length + 1} snapshots
                </Badge>
              )}
            </div>
            <div className="mt-2">
              <SnapshotBadges snapshot={item.snapshot} />
            </div>
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

        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Saved {savedDate}
            </span>
            {updatedTime > createdTime + 60000 && (
              <span>Updated {updatedDate}</span>
            )}
          </div>
          {hasHistory && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => setShowHistory(!showHistory)}
              data-testid={`button-toggle-history-${item.ticker}`}
            >
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showHistory ? "Hide history" : "View history"}
            </Button>
          )}
        </div>

        {showHistory && hasHistory && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <History className="h-4 w-4" />
              Snapshot History
            </h4>
            <SnapshotHistoryTimeline
              history={history}
              currentSnapshot={item.snapshot}
              currentDate={typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toISOString()}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {item.ticker}?</DialogTitle>
            <DialogDescription>
              This will remove {item.companyName} from your watchlist{hasHistory ? `, including ${history.length} historical snapshot${history.length > 1 ? "s" : ""}` : ""}. You can always save it again later.
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

type SortOption = "newest" | "oldest" | "alpha-asc" | "alpha-desc";

export default function WatchlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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

  const filteredAndSorted = useMemo(() => {
    if (!items) return [];
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.ticker.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "alpha-asc":
        result.sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
      case "alpha-desc":
        result.sort((a, b) => b.ticker.localeCompare(a.ticker));
        break;
    }

    return result;
  }, [items, searchQuery, sortBy]);

  return (
    <SiteLayout>
      <Helmet>
        <title>My Watchlist | Restnvest</title>
        <meta name="description" content="Your saved stock analyses and investment notes." />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-watchlist-title">My Watchlist</h1>
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
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticker, company, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-watchlist-search"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-watchlist-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently updated</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="alpha-asc">A to Z</SelectItem>
                  <SelectItem value="alpha-desc">Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredAndSorted.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSorted.map((item) => (
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
                <CardContent className="flex flex-col items-center py-12 text-center gap-3">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No stocks match "{searchQuery}"</p>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} data-testid="button-clear-search">
                    Clear search
                  </Button>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6" data-testid="text-watchlist-count">
              {items.length} stock{items.length !== 1 ? "s" : ""} in your watchlist
            </p>
          </>
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
