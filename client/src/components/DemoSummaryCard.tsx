import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Product {
  name: string;
  icon: LucideIcon;
  description: string;
}

interface Leader {
  name: string;
  role: string;
  initials: string;
  twitter?: string;
}

interface VideoResource {
  title: string;
  channel: string;
  url: string;
}

interface DemoSummaryCardProps {
  companyName: string;
  ticker: string;
  tagline: string;
  products: Product[];
  leaders: Leader[];
  metadata: {
    homepage: string;
    videos: VideoResource[];
  };
}

export function DemoSummaryCard({ 
  companyName, 
  ticker,
  tagline,
  products,
  leaders,
  metadata
}: DemoSummaryCardProps) {
  // Find CEO from leaders
  const ceo = leaders.find(l => l.role.toLowerCase().includes('ceo') || l.role.toLowerCase().includes('chief executive'));
  
  // Get first video
  const firstVideo = metadata.videos[0];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-16 animate-fade-in">
      {/* Company Header */}
      <div className="text-center space-y-6 py-8 border-b-2 border-border pb-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">{companyName}</h1>
        <p className="text-xl sm:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
          {tagline}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          <Badge variant="outline" className="font-mono text-lg px-4 py-2" data-testid="demo-ticker">
            {ticker}
          </Badge>
        </div>
        <div className="pt-4">
          <a 
            href={metadata.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-lg"
            data-testid="demo-homepage-link"
          >
            Visit Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Products Section */}
      <div className="border-2 border-border rounded-lg">
        <div className="bg-muted px-8 py-4 border-b-2 border-border">
          <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Products & Services</h2>
        </div>
        <div className="bg-muted/20 p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {products.map((product, index) => {
              const Icon = product.icon;
              return (
                <div key={index} className="space-y-3" data-testid={`demo-product-${index}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{product.name}</h3>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CEO Section */}
      {ceo && (
        <div className="border-2 border-border rounded-lg">
          <div className="bg-muted px-8 py-4 border-b-2 border-border">
            <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Leadership</h2>
          </div>
          <div className="bg-muted/20 p-8">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <p className="text-lg font-semibold" data-testid="demo-ceo-name">{ceo.name}</p>
              <p className="text-base text-muted-foreground">{ceo.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Section */}
      {firstVideo && (
        <div className="border-2 border-border rounded-lg">
          <div className="bg-muted px-8 py-4 border-b-2 border-border">
            <h2 className="text-2xl font-bold text-center uppercase tracking-wide">Learn More</h2>
          </div>
          <div className="bg-muted/20 p-8">
            <div className="max-w-2xl mx-auto">
              <a
                href={firstVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-background hover-elevate active-elevate-2 transition-all"
                data-testid="demo-video-link"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1 line-clamp-2">{firstVideo.title}</h4>
                  <p className="text-sm text-muted-foreground">{firstVideo.channel}</p>
                </div>
                <ExternalLink className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="text-center py-12 space-y-6">
        <div className="inline-block px-6 py-3 rounded-lg bg-muted/50 mb-4">
          <p className="text-lg text-muted-foreground">
            Want to see the full analysis?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Competitors, metrics, risks, and more...
          </p>
        </div>
        
        <div>
          <Button 
            size="lg"
            className="rounded-full px-10 py-6 text-lg font-semibold"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-see-full-analysis"
          >
            See Full Analysis – Sign Up Free
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          No credit card required
        </p>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Source: Official company report
        </p>
      </div>
    </div>
  );
}
