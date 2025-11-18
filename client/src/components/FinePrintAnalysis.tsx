import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ChevronUp 
} from "lucide-react";
import { FinePrintAnalysis as FinePrintAnalysisType } from "@shared/schema";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FinePrintAnalysisProps {
  analysis: FinePrintAnalysisType;
  companyName: string;
}

const IMPORTANCE_STYLES: Record<string, { badge: string; border: string }> = {
  high: {
    badge: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    border: "border-red-500/30"
  },
  medium: {
    badge: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20",
    border: "border-yellow-500/30"
  },
  low: {
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    border: "border-blue-500/30"
  },
};

const CATEGORY_CONFIG = {
  criticalRisks: {
    label: "Critical Risks",
    icon: AlertTriangle,
    color: "red",
    description: "Lawsuits, regulatory issues, contingent liabilities, and material risks that could significantly impact the business."
  },
  financialCommitments: {
    label: "Financial Commitments",
    icon: DollarSign,
    color: "amber",
    description: "Debt obligations, lease commitments, pension liabilities, and other financial commitments the company must fulfill."
  },
  accountingChanges: {
    label: "Accounting Changes",
    icon: FileText,
    color: "blue",
    description: "Changes in revenue recognition, policy updates, restatements, and new accounting standards adopted."
  },
  relatedPartyTransactions: {
    label: "Related Party",
    icon: Users,
    color: "purple",
    description: "Transactions with executives, directors, or major shareholders that may present conflicts of interest."
  },
  otherMaterialDisclosures: {
    label: "Other Disclosures",
    icon: FileSearch,
    color: "gray",
    description: "Stock-based compensation, segment changes, and other material information not in the categories above."
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
      <Card 
        className={`hover-elevate ${styles.border}`}
        data-testid={`${categoryKey}-item-${index}`}
      >
        <CollapsibleTrigger className="w-full text-left" data-testid={`${categoryKey}-item-${index}-trigger`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-base">{item.title}</h4>
                  <Badge className={styles.badge} data-testid={`${categoryKey}-item-${index}-importance`}>
                    {item.importance}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
              </div>
              <div className="flex-shrink-0">
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="pl-4 border-l-2 border-border">
              <p className="text-sm leading-relaxed">{item.details}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

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

  return (
    <Card className="w-full" data-testid="fine-print-analysis-section">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">Fine Print Analysis</CardTitle>
            </div>
            <CardDescription className="text-base leading-relaxed max-w-3xl">
              Material disclosures from {companyName}'s footnotes in plain English. 
              These are the critical details that often hide in the fine print but matter to investors. 
              Fiscal year {analysis.fiscalYear}, filed {new Date(analysis.filingDate).toLocaleDateString()}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-3 h-auto bg-transparent p-0 mb-6">
            {analysis.criticalRisks.length > 0 && (
              <TabsTrigger 
                value="criticalRisks" 
                className="h-auto p-6 flex-col items-center border-2 rounded-lg data-[state=active]:border-red-500 data-[state=active]:bg-red-500/10 data-[state=inactive]:border-border hover-elevate"
                data-testid="stat-critical-risks"
              >
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mb-2" />
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {analysis.criticalRisks.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-center">Critical Risks</div>
              </TabsTrigger>
            )}
            {analysis.financialCommitments.length > 0 && (
              <TabsTrigger 
                value="financialCommitments" 
                className="h-auto p-6 flex-col items-center border-2 rounded-lg data-[state=active]:border-amber-500 data-[state=active]:bg-amber-500/10 data-[state=inactive]:border-border hover-elevate"
                data-testid="stat-financial-commitments"
              >
                <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {analysis.financialCommitments.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-center">Commitments</div>
              </TabsTrigger>
            )}
            {analysis.accountingChanges.length > 0 && (
              <TabsTrigger 
                value="accountingChanges" 
                className="h-auto p-6 flex-col items-center border-2 rounded-lg data-[state=active]:border-blue-500 data-[state=active]:bg-blue-500/10 data-[state=inactive]:border-border hover-elevate"
                data-testid="stat-accounting-changes"
              >
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {analysis.accountingChanges.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-center">Accounting</div>
              </TabsTrigger>
            )}
            {analysis.relatedPartyTransactions.length > 0 && (
              <TabsTrigger 
                value="relatedPartyTransactions" 
                className="h-auto p-6 flex-col items-center border-2 rounded-lg data-[state=active]:border-purple-500 data-[state=active]:bg-purple-500/10 data-[state=inactive]:border-border hover-elevate"
                data-testid="stat-related-party"
              >
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.relatedPartyTransactions.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-center">Related Party</div>
              </TabsTrigger>
            )}
            {analysis.otherMaterialDisclosures.length > 0 && (
              <TabsTrigger 
                value="otherMaterialDisclosures" 
                className="h-auto p-6 flex-col items-center border-2 rounded-lg data-[state=active]:border-gray-500 data-[state=active]:bg-gray-500/10 data-[state=inactive]:border-border hover-elevate"
                data-testid="stat-other-disclosures"
              >
                <FileSearch className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                  {analysis.otherMaterialDisclosures.length}
                </div>
                <div className="text-sm text-muted-foreground mt-1 text-center">Other</div>
              </TabsTrigger>
            )}
          </TabsList>

          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const items = analysis[key as keyof typeof analysis] as any[];
            if (!Array.isArray(items) || items.length === 0) return null;

            const Icon = config.icon;

            return (
              <TabsContent key={key} value={key} className="mt-6 space-y-4" data-testid={`content-${key}`}>
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {config.description}
                  </p>
                </div>
                <div className="grid gap-4">
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
      </CardContent>
    </Card>
  );
}
