import { Link } from "wouter";
import wordmarkWithTagline from "@assets/ChatGPT_Image_Jan_12,_2026,_06_06_56_PM_1769108399893.png";

const footerLinks = {
  product: [
    { label: "Features", href: "/product" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "For Advisors", href: "/advisors" },
    { label: "FAQ", href: "/faq" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/about#contact" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background" data-testid="site-footer">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" data-testid="link-footer-logo">
              <img
                src={wordmarkWithTagline}
                alt="Restnvest - Informed investing, built to last"
                className="h-16 sm:h-20 object-contain dark:brightness-110"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Understand the businesses you invest in. AI-powered research for long-term thinkers.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3" data-testid="text-footer-product-heading">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3" data-testid="text-footer-company-heading">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3" data-testid="text-footer-legal-heading">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground" data-testid="text-footer-copyright">
              {new Date().getFullYear()} Restnvest. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center sm:text-right max-w-md" data-testid="text-footer-disclaimer">
              AI-generated summaries for informational purposes only. Not investment advice. Always do your own research.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
