import { FeatureCard } from '../FeatureCard'
import { FileText, Brain, CheckCircle } from 'lucide-react'

export default function FeatureCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-3 p-8">
      <FeatureCard
        icon={FileText}
        title="SEC 10-K Filings"
        description="Direct access to official company business descriptions from SEC EDGAR"
      />
      <FeatureCard
        icon={Brain}
        title="AI-Powered Analysis"
        description="Advanced AI summarizes complex filings into clear, concise insights"
      />
      <FeatureCard
        icon={CheckCircle}
        title="Plain English"
        description="Beginner-friendly summaries that help you truly understand what you own"
      />
    </div>
  );
}
