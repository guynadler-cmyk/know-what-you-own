export function HeroSection() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* eyebrow badge */}
      <div
        className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase px-3 py-1 rounded-full border mb-5"
        style={{
          color: "var(--lp-teal-brand)",
          background: "var(--lp-teal-ghost)",
          borderColor: "rgba(42,140,133,0.12)",
          letterSpacing: "0.12em",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--lp-teal-brand)" }} />
        For long-term investors
      </div>

      {/* headline */}
      <h1
        className="font-bold leading-[1.1] tracking-tight mb-4"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(38px, 6vw, 52px)",
          color: "var(--lp-ink)",
          letterSpacing: "-0.02em",
          maxWidth: 600,
        }}
        data-testid="text-hero-headline"
      >
        Know what<br />you{" "}
        <em style={{ fontStyle: "italic", color: "var(--lp-teal-brand)" }}>own.</em>
      </h1>

      {/* subtitle */}
      <p
        className="font-light leading-relaxed mb-8"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          color: "var(--lp-ink-light)",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        Understand any public company in minutes. Business fundamentals, financial health, and timing signals — all in plain English.
      </p>
    </div>
  );
}
