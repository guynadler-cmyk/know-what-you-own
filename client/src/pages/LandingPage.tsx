import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { HeroThesisDemo } from "@/components/HeroThesisDemo";
import { HeroTemporalDemo } from "@/components/HeroTemporalDemo";
import { HeroFinancialDemo } from "@/components/HeroFinancialDemo";
import { HeroTimingDemo } from "@/components/HeroTimingDemo";

const SECTION_PADDING = "py-20 sm:py-24 lg:py-28";

const FEATURE_TILES = [
  {
    title: "Investment Thesis",
    description:
      "Strategic themes and competitive moats extracted directly from SEC filings — not opinions.",
  },
  {
    title: "Financial Health",
    description:
      "Revenue, margins, debt, and cash flow scored across 4 signals. No ambiguity.",
  },
  {
    title: "Changes Over Time",
    description:
      "Track what's new, what's been quietly dropped, and what's actually sticking — across 5 years of filings.",
  },
  {
    title: "Timing Conditions",
    description:
      "Pair your business conviction with market signals — trend, momentum, stretch.",
  },
  {
    title: "Competition Map",
    description:
      "See who the company is actually competing against and how it's positioned relative to peers.",
  },
  {
    title: "Plain English. Always.",
    description:
      "No jargon. No noise. Every insight is written for an investor who wants to think, not just react.",
  },
];

export default function LandingPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>Restnvest – Smarter Investing</title>
        <meta name="description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI. Research stocks with confidence." />
        <meta property="og:title" content="Restnvest – Smarter Investing" />
        <meta property="og:description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI. Research stocks with confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://restnvest.com/" />
        <meta property="og:image" content="https://restnvest.com/icons/icon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Restnvest – Smarter Investing" />
        <meta name="twitter:description" content="Understand the businesses you invest in. Get plain-English summaries of SEC 10-K filings powered by AI." />
        <link rel="canonical" href="https://restnvest.com/" />
      </Helmet>

      {/* ─── HERO — structure kept as-is, copy updated ─── */}
      <section
        id="hero"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{
          background: [
            "radial-gradient(ellipse 60% 50% at 70% 40%, rgba(42,140,133,0.06) 0%, transparent 70%)",
            "radial-gradient(ellipse 40% 60% at 20% 80%, rgba(13,74,71,0.04) 0%, transparent 60%)",
          ].join(", "),
        }}
        data-testid="section-hero"
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="space-y-4">
            <h1
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.15]"
              data-testid="text-hero-headline"
            >
              You're a smart person.{" "}
              <em style={{ color: "var(--lp-teal-brand)" }}>
                Your portfolio doesn't always look like it.
              </em>
            </h1>
            <p
              className="text-xl sm:text-2xl font-light leading-relaxed max-w-2xl mx-auto"
              style={{ color: "var(--lp-ink-light)" }}
              data-testid="text-hero-subheadline"
            >
              It's time to invest like the person you're trying to become.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-md gap-2"
                data-testid="button-hero-cta"
              >
                <Search className="h-5 w-5" />
                Research a stock →
              </Button>
            </Link>
            <p
              className="text-sm"
              style={{ color: "var(--lp-ink-ghost)" }}
              data-testid="text-hero-microcopy"
            >
              No signup required · Takes seconds
            </p>
          </div>
        </div>

        {/* Live Investment Thesis Demo — Demo 1 */}
        <div className="mt-14 mx-auto max-w-6xl w-full px-0">
          <HeroThesisDemo />
        </div>
      </section>

      {/* ─── DEMO 2 — Changes Over Time: copy left, card right ─── */}
      <section
        id="demo-temporal"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{ background: "var(--lp-cream)" }}
        data-testid="section-demo-temporal"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-col lg:flex-row items-center"
            style={{ gap: "clamp(32px, 5vw, 60px)" }}
          >
            {/* Copy — left */}
            <div className="lg:w-1/2 flex-shrink-0">
              <div
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--lp-teal-brand)", letterSpacing: "0.1em" }}
              >
                Changes Over Time
              </div>
              <h2
                className="font-serif font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight mb-4"
                style={{ color: "var(--lp-ink)" }}
              >
                See how the story changes{" "}
                <em style={{ color: "var(--lp-teal-brand)" }}>over time</em>
              </h2>
              <p
                className="text-lg font-light leading-relaxed"
                style={{ color: "var(--lp-ink-light)" }}
              >
                Track what's new, what's been quietly dropped, and what's actually
                sticking — without reading a single filing.
              </p>
            </div>

            {/* Card — right */}
            <div className="lg:w-1/2 w-full min-w-0">
              <HeroTemporalDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ─── BREAK SECTION — feature grid ─── */}
      <section
        id="features"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{ background: "var(--lp-warm-white)" }}
        data-testid="section-features"
      >
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2
              className="font-serif font-semibold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-4"
              style={{ color: "var(--lp-ink)" }}
            >
              Everything you need to own your decision.
            </h2>
            <p
              className="text-lg font-light leading-relaxed max-w-2xl mx-auto"
              style={{ color: "var(--lp-ink-light)" }}
            >
              Not a data dump. Not a recommendation engine. A framework for
              thinking clearly before you commit capital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_TILES.map((tile) => (
              <div
                key={tile.title}
                style={{
                  background: "var(--lp-cream)",
                  border: "1px solid var(--lp-border)",
                  borderRadius: 10,
                  padding: "24px 28px",
                }}
              >
                <div
                  className="text-sm font-medium mb-2"
                  style={{ color: "var(--lp-ink)" }}
                >
                  {tile.title}
                </div>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: "var(--lp-ink-light)" }}
                >
                  {tile.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEMO 3 — Financial Health: card left, copy right ─── */}
      <section
        id="demo-financial"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{ background: "var(--lp-cream)" }}
        data-testid="section-demo-financial"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-col lg:flex-row items-center"
            style={{ gap: "clamp(32px, 5vw, 60px)" }}
          >
            {/* Card — left */}
            <div className="lg:w-1/2 w-full min-w-0 order-2 lg:order-1">
              <HeroFinancialDemo />
            </div>

            {/* Copy — right */}
            <div className="lg:w-1/2 flex-shrink-0 order-1 lg:order-2">
              <div
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--lp-teal-brand)", letterSpacing: "0.1em" }}
              >
                Financial Health
              </div>
              <h2
                className="font-serif font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight mb-4"
                style={{ color: "var(--lp-ink)" }}
              >
                Is this business{" "}
                <em style={{ color: "var(--lp-teal-brand)" }}>financially strong?</em>
              </h2>
              <p
                className="text-lg font-light leading-relaxed"
                style={{ color: "var(--lp-ink-light)" }}
              >
                Revenue growth means nothing if the cash isn't real. Restnvest checks
                the numbers that actually matter — margins, debt, cash flow,
                reinvestment — and gives you a straight answer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DEMO 4 — Timing Conditions: copy left, card right ─── */}
      <section
        id="demo-timing"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{ background: "var(--lp-warm-white)" }}
        data-testid="section-demo-timing"
      >
        <div className="mx-auto max-w-6xl">
          <div
            className="flex flex-col lg:flex-row items-center"
            style={{ gap: "clamp(32px, 5vw, 60px)" }}
          >
            {/* Copy — left */}
            <div className="lg:w-1/2 flex-shrink-0">
              <div
                className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: "var(--lp-teal-brand)", letterSpacing: "0.1em" }}
              >
                Timing Conditions
              </div>
              <h2
                className="font-serif font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight mb-4"
                style={{ color: "var(--lp-ink)" }}
              >
                You've done the homework.{" "}
                <em style={{ color: "var(--lp-teal-brand)" }}>Now what?</em>
              </h2>
              <p
                className="text-lg font-light leading-relaxed"
                style={{ color: "var(--lp-ink-light)" }}
              >
                Restnvest pairs everything you've learned about the business with
                market signals — so you can think clearly about timing and when to act.
              </p>
            </div>

            {/* Card — right */}
            <div className="lg:w-1/2 w-full min-w-0">
              <HeroTimingDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        id="cta"
        className={`${SECTION_PADDING} px-4 sm:px-6 lg:px-8`}
        style={{
          background: "var(--lp-teal-deep)",
          position: "relative",
          overflow: "hidden",
        }}
        data-testid="section-final-cta"
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: [
              "radial-gradient(ellipse 50% 80% at 50% 100%, rgba(77,184,176,0.15) 0%, transparent 60%)",
              "radial-gradient(ellipse 30% 40% at 20% 0%, rgba(77,184,176,0.08) 0%, transparent 50%)",
            ].join(", "),
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div
            className="text-xs font-medium uppercase tracking-widest mb-6"
            style={{ color: "var(--lp-teal-light)", letterSpacing: "0.12em" }}
          >
            Start for free · No signup required
          </div>
          <div className="space-y-4">
            <h2
              className="font-serif font-semibold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white"
              data-testid="text-final-cta-headline"
            >
              Your next investment should have a{" "}
              <em style={{ color: "var(--lp-teal-light)" }}>reason</em> behind it.
            </h2>
            <p
              className="text-lg font-light leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
              data-testid="text-final-cta-body"
            >
              Research any public company in seconds — business, finances,
              competition, and signals, all in one place.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            <Link href="/app">
              <Button
                size="lg"
                className="rounded-md gap-2 bg-white text-[var(--lp-teal-deep)] hover:bg-white"
                data-testid="button-final-cta"
              >
                <Search className="h-5 w-5" />
                Research a stock →
              </Button>
            </Link>
            <p
              className="text-sm"
              style={{ color: "rgba(255,255,255,0.35)" }}
              data-testid="text-final-tagline"
            >
              Built for investors who think before they buy.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
