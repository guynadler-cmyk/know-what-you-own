import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Search, X, LogIn, LogOut, User, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, firebaseSignOut } from "@/lib/firebase";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import ChatGPT_Image_Jan_22__2026__01_43_07_PM_cropped from "@assets/ChatGPT Image Jan 22, 2026, 01_43_07 PM_cropped.png";

const navLinks = [
  { label: "Discover", href: "/discover" },
  { label: "Product", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "For Advisors", href: "/advisors" },
  { label: "For Credit Unions & Advisors", href: "/institutions" },
  { label: "About", href: "/about" },
];

function UserMenu() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const { data: watchlistItems } = useQuery<any[]>({
    queryKey: ["/api/watchlist"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const watchlistCount = watchlistItems?.length ?? 0;

  if (isLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        data-testid="button-sign-in"
        onClick={() => signInWithGoogle().catch(console.error)}
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in with Google</span>
      </Button>
    );
  }

  const initials = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("") || user.email?.charAt(0).toUpperCase() || "?";

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
          <Avatar className="h-8 w-8">
            {user.profile_image_url && (
              <AvatarImage src={user.profile_image_url} alt={displayName} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none" data-testid="text-user-name">{displayName}</p>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/watchlist" className="cursor-pointer" data-testid="link-watchlist">
            <Bookmark className="mr-2 h-4 w-4" />
            My Watchlist
            {watchlistCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs no-default-active-elevate">{watchlistCount}</Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          data-testid="button-sign-out"
          onClick={() => {
            firebaseSignOut().then(() => {
              queryClient.clear();
            }).catch(console.error);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const { data: watchlistData } = useQuery<any[]>({
    queryKey: ["/api/watchlist"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
  const mobileWatchlistCount = watchlistData?.length ?? 0;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur border-b border-border max-w-[100vw] overflow-hidden"
      data-testid="site-header"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 max-w-[1200px] mx-auto gap-4">
        <Link href="/" data-testid="link-header-logo" className="flex items-center shrink-0">
          <img
            src={ChatGPT_Image_Jan_22__2026__01_43_07_PM_cropped}
            alt="Restnvest"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1" data-testid="nav-desktop">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={isActive ? "bg-muted text-foreground" : "text-muted-foreground"}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/app" className="hidden sm:block">
            <Button size="sm" className="rounded-full gap-2" data-testid="button-header-cta">
              <Search className="h-4 w-4" />
              Research a Stock
            </Button>
          </Link>
          <ThemeToggle />
          <UserMenu />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                data-testid="button-mobile-menu"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between gap-2 p-4 border-b border-border">
                  <span className="text-sm font-semibold" data-testid="text-mobile-menu-title">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    data-testid="button-mobile-close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex flex-col p-4 gap-1" data-testid="nav-mobile">
                  {navLinks.map((link) => {
                    const isActive = location === link.href;
                    return (
                      <Link key={link.href} href={link.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                          onClick={() => setMobileOpen(false)}
                          data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {link.label}
                        </Button>
                      </Link>
                    );
                  })}
                  <Link href="/faq">
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${location === "/faq" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                      onClick={() => setMobileOpen(false)}
                      data-testid="link-mobile-faq"
                    >
                      FAQ
                    </Button>
                  </Link>
                </nav>
                <div className="mt-auto p-4 border-t border-border space-y-2">
                  {isAuthenticated && user ? (
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="h-8 w-8">
                        {user.profile_image_url && (
                          <AvatarImage src={user.profile_image_url} alt="Profile" />
                        )}
                        <AvatarFallback className="text-xs">
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .map((n) => n!.charAt(0).toUpperCase())
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid="text-mobile-user-name">
                          {[user.first_name, user.last_name].filter(Boolean).join(" ") || "User"}
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {isAuthenticated ? (
                    <>
                      <Link href="/watchlist">
                        <Button
                          variant="ghost"
                          className={`w-full justify-start gap-2 ${location === "/watchlist" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                          onClick={() => setMobileOpen(false)}
                          data-testid="link-mobile-watchlist"
                        >
                          <Bookmark className="h-4 w-4" />
                          My Watchlist
                          {mobileWatchlistCount > 0 && (
                            <Badge variant="secondary" className="ml-auto text-xs no-default-active-elevate">{mobileWatchlistCount}</Badge>
                          )}
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        data-testid="button-mobile-sign-out"
                        onClick={() => {
                          firebaseSignOut().then(() => {
                            queryClient.clear();
                            setMobileOpen(false);
                          }).catch(console.error);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      data-testid="button-mobile-sign-in"
                      onClick={() => {
                        signInWithGoogle().then(() => setMobileOpen(false)).catch(console.error);
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      Sign in with Google
                    </Button>
                  )}
                  <Link href="/app">
                    <Button
                      className="w-full rounded-full gap-2"
                      onClick={() => setMobileOpen(false)}
                      data-testid="button-mobile-cta"
                    >
                      <Search className="h-4 w-4" />
                      Research a Stock
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
