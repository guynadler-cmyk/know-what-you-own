import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, X } from "lucide-react";
import ChatGPT_Image_Jan_22__2026__01_43_07_PM_cropped from "@assets/ChatGPT Image Jan 22, 2026, 01_43_07 PM_cropped.png";

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "For Advisors", href: "/advisors" },
  { label: "For Institutions", href: "/institutions" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur border-b border-border"
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
                <div className="mt-auto p-4 border-t border-border">
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
