import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, LogIn, LogOut, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { firebaseSignOut } from "@/lib/firebase";
import { queryClient, getQueryFn } from "@/lib/queryClient";
const headerLogoSrc = "/images/header-logo.webp";

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
  const [, setLocation] = useLocation();

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
        onClick={() => setLocation("/sign-in")}
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur border-b border-border max-w-[100vw] overflow-hidden"
      data-testid="site-header"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 h-16 max-w-[1200px] mx-auto gap-4">
        <Link href="/" data-testid="link-header-logo" className="flex items-center shrink-0">
          <img
            src={headerLogoSrc}
            alt="Restnvest"
            width={338}
            height={96}
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
          <Link href="/app" className="hidden md:block">
            <Button size="sm" className="rounded-full gap-2" data-testid="button-header-cta">
              <Search className="h-4 w-4" />
              Research a Stock
            </Button>
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
