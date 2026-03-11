import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Users,
  Info,
  FileSearch,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FinePrintAnalysis as FinePrintAnalysisType } from "@shared/schema";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FinePrintAnalysisProps {
  analysis: FinePrintAnalysisType;
  companyName: string;
}

const IMPORTANCE_STYLES: Record<string, { badge: string; leftBorder: string }> = {
  high: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    leftBorder: "border-red-300",
  },
  medium: {
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    leftBorder: "border-yellow-300",
  },
  low: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    leftBorder: "border-blue-300",
  },
};

const CATEGORY_CONFIG = {
  criticalRisks: {
    label: "Critical Risks",
    icon: AlertTriangle,
    activeClass: "data-[state=active]:border-red-400 data-[state=active]:bg-red-50",
    iconClass: "text-red-500",
    countClass: "text-red-600 dark:text-red-400",
    description: "Lawsuits, regulatory issues, contingent liabilities, and material risks that could significantly impact the business.",
  },
  financialCommitments: {
    label: "Financial Commitments",
    icon: DollarSign,
    activeClass: "data-[state=active]:border-amber-400 data-[state=active]:bg-amber-50",
    iconClass: "text-amber-500",
    countClass: "text-amber-600 dark:text-amber-400",
    description: "Debt obligations, lease commitments, pension liabilities, and other financial commitments the company must fulfill.",
  },
  accountingChanges: {
    label: "Accounting Changes",
    icon: FileText,
    activeClass: "data-[state=active]:border-blue-400 data-[state=active]:bg-blue-50",
    iconClass: "text-blue-500",
    countClass: "text-blue-600 dark:text-blue-400",
    description: "Changes in revenue recognition, policy updates, restatements, and new accounting standards adopted.",
  },
  relatedPartyTransactions: {
    label: "Related Party",
    icon: Users,
    activeClass: "data-[state=active]:border-purple-400 data-[state=active]:bg-purple-50",
    iconClass: "text-purple-500",
    countClass: "text-purple-600 dark:text-purple-400",
    description: "Transactions with executives, directors, or major shareholders that may present conflicts of interest.",
  },
  otherMaterialDisclosures: {
    label: "Other Disclosures",
    icon: FileSearch,
    activeClass: "data-[state=active]:border-gray-400 data-[state=active]:bg-gray-50",
    iconClass: "text-gray-500",
    countClass: "text-gray-600 dark:text-gray-400",
    description: "Stock-based compensation, segment changes, and other material information not in the categories above.",
  },
};

interface FinePrintItemProps {
  item: {
    title: string;
    summary: string;
    importance: string;
    details: string;
  };
  index: number;
  categoryKey: string;
}

function FinePrintItem({ item, index, categoryKey }: FinePrintItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = IMPORTANCE_STYLES[item.importance] || IMPORTANCE_STYLES.low;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="rounded-lg border"
        style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}
        data-testid={`${categoryKey}-item-${index}`}
      >
        <CollapsibleTrigger className="w-full text-left" data-testid={`${categoryKey}-item-${index}-trigger`}>
          <div style={{ padding: '14px 16px' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--lp-ink)' }}>{item.title}</h4>
                  <Badge className={styles.badge} data-testid={`${categoryKey}-item-${index}-importance`}>
                    {item.importance}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>{item.summary}</p>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                {isOpen
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--lp-ink-ghost)' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'var(--lp-ink-ghost)' }} />
                }
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="pl-3 border-l-2" style={{ borderColor: 'var(--lp-teal-pale)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-mid)' }}>{item.details}</p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

const tileBase = "h-auto py-4 px-1 md:px-3 flex-col items-center rounded-lg border bg-white data-[state=inactive]:border-[var(--border)] hover-elevate";

export function FinePrintAnalysis({ analysis, companyName }: FinePrintAnalysisProps) {
  const totalItems =
    analysis.criticalRisks.length +
    analysis.financialCommitments.length +
    analysis.accountingChanges.length +
    analysis.relatedPartyTransactions.length +
    analysis.otherMaterialDisclosures.length;

  if (totalItems === 0) {
    return null;
  }

  const defaultTab =
    analysis.criticalRisks.length > 0 ? "criticalRisks" :
    analysis.financialCommitments.length > 0 ? "financialCommitments" :
    analysis.accountingChanges.length > 0 ? "accountingChanges" :
    analysis.relatedPartyTransactions.length > 0 ? "relatedPartyTransactions" :
    "otherMaterialDisclosures";

  const activeTabs = Object.entries(CATEGORY_CONFIG).filter(
    ([key]) => (analysis[key as keyof typeof analysis] as any[])?.length > 0
  );

  return (
    <div data-testid="fine-print-analysis-section">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList
          className="h-auto bg-transparent p-0 mb-5 grid gap-1 md:gap-2.5"
          style={{ gridTemplateColumns: `repeat(${Math.min(activeTabs.length, 5)}, minmax(0, 1fr))` }}
        >
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const items = analysis[key as keyof typeof analysis] as any[];
            if (!Array.isArray(items) || items.length === 0) return null;
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className={`${tileBase} ${config.activeClass}`}
                data-testid={`stat-${key}`}
              >
                <Icon className={`w-4 h-4 mb-1.5 ${config.iconClass}`} />
                <div className={`text-[24px] font-bold leading-none mb-1 ${config.countClass}`}>
                  {items.length}
                </div>
                <div className="text-[10px] md:text-[11px] text-center whitespace-normal" style={{ color: 'var(--lp-ink-ghost)' }}>
                  {config.label}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const items = analysis[key as keyof typeof analysis] as any[];
          if (!Array.isArray(items) || items.length === 0) return null;

          return (
            <TabsContent key={key} value={key} className="mt-5 space-y-3" data-testid={`content-${key}`}>
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg border" style={{ background: 'var(--lp-cream, #faf8f4)', borderColor: 'var(--border)' }}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--lp-ink-ghost)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-ink-light)' }}>
                  {config.description}
                </p>
              </div>
              <div className="grid gap-3">
                {items.map((item, index) => (
                  <FinePrintItem
                    key={index}
                    item={item}
                    index={index}
                    categoryKey={key}
                  />
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
