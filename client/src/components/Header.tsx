import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { ShareButton } from "./ShareButton";
import { InstallButton } from "./InstallButton";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Search, Bookmark, BookmarkCheck, RefreshCw, Loader2, LogIn } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavContext } from "@/contexts/NavContext";
import type { WatchlistSnapshot } from "@shared/schema";

function NavWatchlistActions({
  ticker,
  companyName,
  getSnapshot,
}: {
  ticker: string;
  companyName: string;
  getSnapshot: () => WatchlistSnapshot;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: checkData, isLoading: checkLoading } = useQuery<{
    saved: boolean;
    item?: { id: string; snapshotHistory?: any[] } | null;
  }>({
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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const snapshot = getSnapshot();
      const itemId = checkData?.item?.id;
      if (!itemId) throw new Error("No watchlist item found");
      await apiRequest("PATCH", `/api/watchlist/${itemId}/snapshot`, { snapshot });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist/check", ticker] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Snapshot updated",
        description: `${companyName}'s analysis snapshot has been refreshed.`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update snapshot.", variant: "destructive" });
    },
  });

  const isSaved = checkData?.saved;
  const historyCount = (checkData?.item?.snapshotHistory as any[])?.length || 0;

  if (authLoading || checkLoading) {
    return <div style={{ width: 60, height: 26, borderRadius: 5, background: "var(--lp-teal-pale)", opacity: 0.5 }} />;
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => signInWithGoogle().catch(console.error)}
        className="nav-icon-btn"
        data-testid="button-nav-signin"
      >
        <LogIn style={{ width: 11, height: 11 }} />
        Sign in
      </button>
    );
  }

  return (
    <>
      {isSaved ? (
        <Link href="/watchlist" data-testid="button-nav-saved" className={`nav-icon-btn active`} style={{ cursor: "pointer", textDecoration: "none" }}>
          <BookmarkCheck style={{ width: 11, height: 11 }} />
          {`Saved${historyCount > 0 ? ` (${historyCount + 1})` : ""}`}
        </Link>
      ) : (
        <button
          onClick={() => setDialogOpen(true)}
          className="nav-icon-btn"
          style={{ cursor: "pointer" }}
          data-testid="button-nav-saved"
        >
          <Bookmark style={{ width: 11, height: 11 }} />
          Save
        </button>
      )}

      {isSaved && (
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="nav-icon-btn"
          data-testid="button-nav-update"
        >
          {updateMutation.isPending ? (
            <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
          ) : (
            <RefreshCw style={{ width: 11, height: 11 }} />
          )}
          Update
        </button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save {companyName} ({ticker})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you interested in this stock? Any thoughts to remember..."
              className="resize-none"
              rows={3}
              maxLength={2000}
              data-testid="input-nav-watchlist-notes"
            />
            <p className="text-xs text-muted-foreground">{notes.length}/2000</p>
            <div className="flex justify-end gap-2">
              <button className="nav-icon-btn" onClick={() => setDialogOpen(false)}>
                Cancel
              </button>
              <button
                className="nav-icon-btn"
                style={{
                  background: "var(--lp-teal-deep)",
                  color: "white",
                  borderColor: "var(--lp-teal-deep)",
                }}
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                data-testid="button-nav-watchlist-confirm"
              >
                {saveMutation.isPending && (
                  <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Header() {
  const [location, navigate] = useLocation();
  const { analysisState } = useNavContext();
  const [navSearch, setNavSearch] = useState("");
  const navInputRef = useRef<HTMLInputElement>(null);

  const isAnalysisPage = analysisState !== null;
  const companyInitial = analysisState?.companyName
    ? analysisState.companyName.charAt(0).toUpperCase()
    : (analysisState?.ticker?.charAt(0) ?? "");

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = navSearch.trim().toUpperCase();
    if (ticker) {
      setNavSearch("");
      navigate(`/stocks/${ticker}`);
    }
  };

  const navRightActions = (
    <>
      <div className="nav-hide-mobile">
        <ShareButton variant="outline" size="sm" showText={true} />
      </div>
      <div className="nav-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <InstallButton />
        <Dialog>
          <DialogTrigger asChild>
            <button className="nav-icon-btn" data-testid="button-install-qr">
              <Smartphone style={{ width: 11, height: 11 }} />
              Install
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Install restnvest
              </DialogTitle>
            </DialogHeader>
            <QRCodeDisplay url={window.location.origin} showInstructions={true} />
          </DialogContent>
        </Dialog>
      </div>
      <ThemeToggle />
    </>
  );

  return (
    <header
      data-testid="site-header"
      style={{
        height: 52,
        background: "var(--lp-warm-white)",
        borderBottom: "1px solid var(--lp-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        padding: "0 clamp(10px, 3vw, 24px)",
        gap: 0,
        maxWidth: "100vw",
        overflow: "visible",
      }}
    >
      <Link
        href="/app"
        data-testid="link-logo"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--lp-ink)",
          letterSpacing: "-0.02em",
          textDecoration: "none",
          flexShrink: 0,
          marginRight: isAnalysisPage ? 12 : 28,
          cursor: "pointer",
        }}
      >
        rest<span style={{ color: "var(--lp-teal-brand)" }}>n</span>vest
      </Link>

      {isAnalysisPage && analysisState ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              border: "1px solid var(--lp-border)",
              borderRadius: 6,
              padding: "5px 10px",
              flexShrink: 0,
              marginRight: 12,
            }}
            data-testid="company-pill"
          >
            <div
              style={{
                width: 20,
                height: 20,
                background: "var(--lp-teal-deep)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: "white",
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                flexShrink: 0,
              }}
            >
              {companyInitial}
            </div>
            <span
              className="nav-company-name"
              data-testid="text-nav-company-name"
            >
              {analysisState.companyName}
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: "var(--lp-ink-ghost)",
              }}
              data-testid="text-nav-ticker"
            >
              {analysisState.ticker}
            </span>
          </div>

          <form
            onSubmit={handleNavSearch}
            className="nav-search-bar"
            style={{ minWidth: 0 }}
            data-testid="nav-search-form"
          >
            <Search style={{ width: 12, height: 12, color: "var(--lp-ink-ghost)", flexShrink: 0 }} />
            <input
              ref={navInputRef}
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search another company..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                color: "var(--lp-ink)",
                background: "transparent",
                minWidth: 0,
              }}
              data-testid="input-nav-search"
            />
            <button
              type="submit"
              style={{
                background: "var(--lp-teal-deep)",
                color: "white",
                border: "none",
                borderRadius: 5,
                padding: "0 12px",
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
                height: 26,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
              data-testid="button-nav-analyze"
            >
              <span className="hidden sm:inline">Analyze </span>→
            </button>
          </form>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {analysisState.getSnapshot && (
              <NavWatchlistActions
                ticker={analysisState.ticker}
                companyName={analysisState.companyName}
                getSnapshot={analysisState.getSnapshot}
              />
            )}
            <div
              style={{
                width: 1,
                height: 18,
                background: "var(--lp-border)",
                margin: "0 2px",
                flexShrink: 0,
              }}
            />
            {navRightActions}
          </div>
        </>
      ) : (
        <>
          <nav className="nav-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            {[
              { label: "Product", href: "/product" },
              { label: "How It Works", href: "/how-it-works" },
              { label: "Pricing", href: "/pricing" },
              { label: "For Advisors", href: "/advisors" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: 12,
                  color: location === href ? "var(--lp-teal-brand)" : "var(--lp-ink-light)",
                  textDecoration: "none",
                  padding: "5px 10px",
                  borderRadius: 5,
                  whiteSpace: "nowrap",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "color 0.15s",
                  cursor: "pointer",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {navRightActions}
          </div>
        </>
      )}
    </header>
  );
}
