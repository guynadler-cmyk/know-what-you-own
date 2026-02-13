import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { ContactFormDialog } from "@/components/ContactFormDialog";
import {
  Layers,
  Palette,
  Rocket,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CalendarCheck,
  Mail,
  Building2,
  Puzzle,
  BarChart3,
  Sparkles,
} from "lucide-react";

const valueProps = [
  {
    icon: Sparkles,
    title: "Introduce AI without building it",
    description:
      "Add AI-powered stock research to your platform without the cost and complexity of building it yourself. Restnvest handles the analysis engine — you get the client-facing results.",
  },
  {
    icon: Palette,
    title: "Co-branded experience",
    description:
      "Your clients interact with Restnvest research inside your environment, styled to match your brand. It feels native — because it is.",
  },
  {
    icon: TrendingUp,
    title: "Improve self-directed outcomes",
    description:
      "When clients understand what they own, they make better decisions — fewer panic sells, stronger conviction, and better long-term results in self-directed accounts.",
  },
  {
    icon: Users,
    title: "Increase client satisfaction",
    description:
      "Offering professional-grade research tools signals that your platform is serious about helping clients succeed — not just facilitating transactions.",
  },
];

const howItWorks = [
  {
    step: "1",
    icon: Puzzle,
    title: "Embed",
    description:
      "Integrate Restnvest's research experience directly into your platform. Clients access AI-powered analysis without leaving your environment.",
  },
  {
    step: "2",
    icon: Palette,
    title: "Co-brand",
    description:
      "Customize the experience to match your institution's visual identity. Your logo, your colors, your clients' trust.",
  },
  {
    step: "3",
    icon: Rocket,
    title: "Launch",
    description:
      "Go live with AI-powered research for your clients. We handle the analysis engine, data pipeline, and ongoing improvements.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Differentiate your platform",
    description: "Stand out from competitors by offering AI-powered research that clients can't get elsewhere.",
  },
  {
    icon: Shield,
    title: "No compliance headaches",
    description: "Restnvest presents facts and analysis — never investment advice. Designed to complement, not conflict with, your compliance framework.",
  },
  {
    icon: BarChart3,
    title: "Drive engagement",
    description: "Clients who research more, trade more thoughtfully, and stay longer. Better tools mean stickier relationships.",
  },
  {
    icon: Building2,
    title: "Enterprise-ready",
    description: "Built for scale with secure data handling, reliable uptime, and a team that understands financial services.",
  },
];

export default function InstitutionsPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <SiteLayout>
      <Helmet>
        <title>For Institutions - Restnvest</title>
        <meta
          name="description"
          content="Embed AI-powered stock research into your platform. Restnvest offers a co-branded experience that helps your clients understand the businesses they invest in."
        />
        <meta property="og:title" content="For Institutions - Restnvest" />
        <meta
          property="og:description"
          content="Bring AI-powered research to your clients. Co-branded, embedded, and built for financial institutions."
        />
        <link rel="canonical" href="https://restnvest.com/institutions" />
      </Helmet>

      <section className="py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8" data-testid="section-institutions-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-institutions-eyebrow">
            For Institutions
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-institutions-headline"
          >
            Embed AI-powered research into your platform
          </h1>
          <p
            className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-institutions-subheadline"
          >
            Give your clients professional-grade stock analysis — co-branded, seamless, and designed to improve conviction and outcomes in self-directed accounts.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-institutions-demo">
              <CalendarCheck className="h-5 w-5" />
              Book a Demo
            </Button>
            <Link href="/app">
              <Button variant="outline" size="lg" className="rounded-full gap-2" data-testid="button-institutions-try">
                See the Research Tool
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ContactFormDialog open={demoOpen} onOpenChange={setDemoOpen} source="Institutions - Book a Demo" />
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-institutions-value">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-institutions-value-headline">
              Why embed Restnvest
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Your clients want to understand what they own. Give them the tools to do it — without building from scratch.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {valueProps.map((prop) => (
              <Card key={prop.title} data-testid={`card-value-${prop.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary shrink-0">
                      <prop.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" data-testid={`text-value-title-${prop.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        {prop.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed text-sm">{prop.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-institutions-how">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-institutions-how-headline">
              How integration works
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Three steps to bringing AI-powered research to your clients.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center" data-testid={`step-institutions-${item.step}`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-md bg-primary/10 text-primary mx-auto mb-4">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-background text-xs font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-institutions-benefits">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-institutions-benefits-headline">
              Built for financial institutions
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center" data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mx-auto mb-4">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8" data-testid="section-institutions-audience">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-institutions-audience-headline">
              Who this is for
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Online brokerages",
              "Wealth management platforms",
              "Robo-advisors with self-directed options",
              "Credit unions and community banks",
              "Investment apps and fintech platforms",
              "Retirement account providers",
            ].map((audience) => (
              <div key={audience} className="flex items-center gap-3 p-3" data-testid={`audience-${audience.toLowerCase().replace(/\s+/g, "-")}`}>
                <Layers className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{audience}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-institutions-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-institutions-cta-headline">
            Let's explore a partnership
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            We'll walk you through the embedded experience, discuss co-branding options, and explore how Restnvest can fit into your platform.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-institutions-cta-demo">
              <CalendarCheck className="h-5 w-5" />
              Book a Demo
            </Button>
            <Button variant="outline" size="lg" className="rounded-full gap-2" onClick={() => setDemoOpen(true)} data-testid="button-institutions-cta-contact">
              <Mail className="h-4 w-4" />
              Get in Touch
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
