import { Link } from "wouter";
import { TimingStage } from "@/components/TimingStage";
import { SAMPLE_TIMING_DATA } from "@/data/sampleTimingData";

export function HeroTimingDemo() {
  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="hero-timing-demo">
      <TimingStage
        ticker=""
        companyName="Apple Inc"
        homepage="https://www.apple.com"
        placeholderData={SAMPLE_TIMING_DATA}
      />

      <div className="flex justify-center mt-6" data-testid="hero-timing-sample-label">
        <p className="text-sm text-muted-foreground">
          This is a sample analysis.{" "}
          <Link href="/app">
            <span className="text-primary hover:underline cursor-pointer">
              Run your own for real-time data →
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
