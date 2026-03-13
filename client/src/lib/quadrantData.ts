import type { FinancialMetrics, BalanceSheetMetrics } from "@shared/schema";

export type SignalStrength = "strong" | "mixed" | "weak";

export interface QuadrantData {
  id: string;
  title: string;
  verdict: string;
  signals: [string, string];
  xLabel: string;
  yLabel: string;
  zones: {
    topRight: { label: string; color: string };
    topLeft: { label: string; color: string };
    bottomRight: { label: string; color: string };
    bottomLeft: { label: string; color: string };
  };
  position: { x: number; y: number };
  insight: string;
  signalDirections: [boolean, boolean];
  invertedSignals?: [boolean, boolean];
  strength: SignalStrength;
}

export const QUADRANT_DATA: QuadrantData[] = [
  {
    id: "growth-quality",
    title: "Growth Quality",
    verdict: "Scalable Growth",
    signals: ["Revenue", "Earnings"],
    signalDirections: [true, true],
    xLabel: "Revenue Growth",
    yLabel: "Earnings Growth",
    zones: {
      topRight: { label: "Efficient Growth", color: "green" },
      topLeft: { label: "Cost Cutting", color: "yellow" },
      bottomRight: { label: "Scaling Up", color: "blue" },
      bottomLeft: { label: "Declining", color: "red" },
    },
    position: { x: 72, y: 25 },
    insight: "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder that can sustain growth over time.",
    strength: "strong",
  },
  {
    id: "profit-cash",
    title: "Profit Quality",
    verdict: "Cash-Backed Profits",
    signals: ["Margins", "FCF"],
    signalDirections: [true, true],
    xLabel: "Profit Margins",
    yLabel: "Free Cash Flow",
    zones: {
      topRight: { label: "Cash Machine", color: "green" },
      topLeft: { label: "Cash-Rich, Low Margin", color: "yellow" },
      bottomRight: { label: "Paper Profits", color: "blue" },
      bottomLeft: { label: "Cash Burn", color: "red" },
    },
    position: { x: 68, y: 30 },
    insight: "Profits are real and cash-backed. The business earns healthy margins and turns them into free cash flow — giving it flexibility to reinvest, build a buffer, or return capital.",
    strength: "strong",
  },
  {
    id: "debt-safety",
    title: "Debt Safety",
    verdict: "Comfortable Coverage",
    signals: ["Debt", "Coverage"],
    signalDirections: [true, true],
    invertedSignals: [true, false],
    xLabel: "Coverage",
    yLabel: "Debt Levels",
    zones: {
      topRight: { label: "Aggressive Borrower", color: "orange" },
      topLeft: { label: "Financially Fragile", color: "red" },
      bottomRight: { label: "Healthy Leverage", color: "green" },
      bottomLeft: { label: "Underleveraged", color: "yellow" },
    },
    position: { x: 75, y: 70 },
    insight: "Debt looks manageable and interest payments are well covered. This gives the business flexibility through a downturn.",
    strength: "strong",
  },
  {
    id: "reinvestment",
    title: "Owner Value Quality",
    verdict: "Compounding Equity",
    signals: ["Book Value Growth", "ROIC"],
    signalDirections: [true, true],
    xLabel: "Book Value Growth",
    yLabel: "ROIC",
    zones: {
      topRight: { label: "Compounding Equity", color: "green" },
      topLeft: { label: "High Returns, Low Equity Growth", color: "yellow" },
      bottomRight: { label: "Growing Without Returns", color: "blue" },
      bottomLeft: { label: "Eroding Value", color: "red" },
    },
    position: { x: 65, y: 28 },
    insight: "Owner equity is growing and returns are strong. The company appears to be reinvesting in ways that build long-term value.",
    strength: "strong",
  },
];

export function generateQuadrantData(
  financialMetrics?: FinancialMetrics,
  balanceSheetMetrics?: BalanceSheetMetrics
): QuadrantData[] {
  if (!financialMetrics && !balanceSheetMetrics) {
    return QUADRANT_DATA;
  }

  const getGrowthPosition = (revenueGrowth: boolean, earningsGrowth: boolean, revPct: number, earnPct: number) => {
    const clamp = (val: number) => Math.max(10, Math.min(90, val));
    const x = clamp(50 + (revPct / 2));
    const y = clamp(50 - (earnPct / 2));
    return { x, y };
  };

  const revenueUp = financialMetrics?.revenueGrowth === "growing";
  const earningsUp = financialMetrics?.earningsGrowth === "growing";
  const revPct = financialMetrics?.revenueChangePercent ?? 0;
  const earnPct = financialMetrics?.earningsChangePercent ?? 0;
  
  let growthStrength: SignalStrength = "weak";
  let growthVerdict = "Declining";
  let growthInsight = "Both revenue and earnings are declining — a red flag for long-term investors. The business may be losing market share or facing structural challenges.";
  
  if (revenueUp && earningsUp) {
    growthStrength = "strong";
    growthVerdict = "Scalable Growth";
    growthInsight = "The company is growing both revenue and earnings — a sign of scalable, healthy expansion. This is the hallmark of a quality compounder.";
  } else if (revenueUp && !earningsUp) {
    growthStrength = "mixed";
    growthVerdict = "Scaling Up";
    growthInsight = "Revenue is growing but earnings aren't keeping pace. The company may be investing heavily for future growth, or facing margin pressure.";
  } else if (!revenueUp && earningsUp) {
    growthStrength = "mixed";
    growthVerdict = "Cost Cutting";
    growthInsight = "Earnings are up despite flat or declining revenue. This could mean efficiency gains, but watch for sustainability if revenue doesn't recover.";
  }

  const profitMargin = financialMetrics?.profitMarginPercent ?? 0;
  const operatingMargin = financialMetrics?.operatingMarginPercent ?? 0;

  const MARGIN_THRESHOLD = 10;
  const FCF_THRESHOLD = 10;

  const highMargin = profitMargin >= MARGIN_THRESHOLD;
  const highFcf = operatingMargin >= FCF_THRESHOLD;

  let profitQualityStrength: SignalStrength;
  let profitQualityVerdict: string;
  let profitQualityInsight: string;

  if (highMargin && highFcf) {
    profitQualityStrength = "strong";
    profitQualityVerdict = "Cash-Backed Profits";
    profitQualityInsight = "Profits are real and cash-backed. The business earns healthy margins and turns them into free cash flow \u2014 giving it flexibility to reinvest, build a buffer, or return capital.";
  } else if (!highMargin && highFcf) {
    profitQualityStrength = "mixed";
    profitQualityVerdict = "Cash Strong, Margins Thin";
    profitQualityInsight = "Cash generation is solid, but profitability is thin. Watch whether margins improve as the business scales.";
  } else if (highMargin && !highFcf) {
    profitQualityStrength = "mixed";
    profitQualityVerdict = "Profit Without Cash";
    profitQualityInsight = "Profits aren't showing up as cash yet. This can reflect heavy reinvestment, working-capital drag, or earnings that don't convert cleanly.";
  } else {
    profitQualityStrength = "weak";
    profitQualityVerdict = "Weak Profit Quality";
    profitQualityInsight = "Neither profits nor cash flow look healthy. The business may rely on outside funding until performance improves.";
  }

  const getProfitQualityPosition = () => {
    const clamp = (val: number) => Math.max(10, Math.min(90, val));
    const x = clamp(50 + (profitMargin / 2));
    const y = clamp(50 - (operatingMargin / 2));
    return { x, y };
  };

  const debtToEquity = balanceSheetMetrics?.debtToEquityRatio ?? 0;
  const interestCoverage = financialMetrics?.interestCoverageRatio ?? 99;

  const DEBT_THRESHOLD = 1.0;
  const COVERAGE_THRESHOLD = 3.0;

  const highDebt = debtToEquity >= DEBT_THRESHOLD;
  const highCoverage = interestCoverage >= COVERAGE_THRESHOLD;

  let debtStrength: SignalStrength;
  let debtVerdict: string;
  let debtInsight: string;

  if (!highDebt && highCoverage) {
    debtStrength = "strong";
    debtVerdict = "Comfortable Coverage";
    debtInsight = "Debt looks manageable and interest payments are well covered. This gives the business flexibility through a downturn.";
  } else if (!highDebt && !highCoverage) {
    debtStrength = "mixed";
    debtVerdict = "Conservative Balance Sheet";
    debtInsight = "Debt is low, but coverage is also modest. The company isn't relying on leverage, though earnings power may be uneven.";
  } else if (highDebt && highCoverage) {
    debtStrength = "mixed";
    debtVerdict = "Leverage With Support";
    debtInsight = "Debt is elevated, but current earnings cover interest comfortably. Worth watching if coverage weakens or conditions tighten.";
  } else {
    debtStrength = "weak";
    debtVerdict = "Debt Risk";
    debtInsight = "High debt with weak coverage can strain cash flow. Refinancing or an earnings dip could create real pressure.";
  }

  const getDebtSafetyPosition = () => {
    const clamp = (val: number) => Math.max(10, Math.min(90, val));
    const cappedDE = Math.min(debtToEquity, 5);
    const cappedCov = Math.min(interestCoverage, 20);
    const x = clamp((cappedCov / 20) * 100);
    const y = clamp(100 - (cappedDE / 5) * 100);
    return { x, y };
  };

  const roic = financialMetrics?.roicPercent ?? 0;
  const bvGrowth = financialMetrics?.bookValueGrowthPercent;

  const ROIC_THRESHOLD = 15;
  const BV_GROWTH_THRESHOLD = 8;

  const highRoic = roic >= ROIC_THRESHOLD;
  const bvGrowthKnown = bvGrowth !== undefined && bvGrowth !== null;
  const highBvGrowth = bvGrowthKnown ? bvGrowth >= BV_GROWTH_THRESHOLD : false;

  let reinvestStrength: SignalStrength;
  let reinvestVerdict: string;
  let reinvestInsight: string;

  if (!bvGrowthKnown) {
    reinvestStrength = highRoic ? "mixed" : "weak";
    reinvestVerdict = highRoic ? "Strong Returns, Book Value Unknown" : "Low Returns, Book Value Unknown";
    reinvestInsight = highRoic
      ? "Returns look solid, but we couldn't reliably measure book value growth. The picture is incomplete."
      : "Returns are below average and book value data isn't available. Hard to assess owner value creation.";
  } else if (highRoic && highBvGrowth) {
    reinvestStrength = "strong";
    reinvestVerdict = "Compounding Equity";
    reinvestInsight = "Owner equity is growing and returns are strong. The company appears to be reinvesting in ways that build long-term value.";
  } else if (highRoic && !highBvGrowth) {
    reinvestStrength = "mixed";
    reinvestVerdict = "High Returns, Limited Reinvestment";
    reinvestInsight = "Returns are strong, but book value isn't rising much. This can signal a cash-generative business returning capital or a maturing runway.";
  } else if (!highRoic && highBvGrowth) {
    reinvestStrength = "mixed";
    reinvestVerdict = "Growth With Low Returns";
    reinvestInsight = "Book value is growing, but returns are weak. More capital is going in than value coming out — worth monitoring for improvement.";
  } else {
    reinvestStrength = "weak";
    reinvestVerdict = "Value Pressure";
    reinvestInsight = "Returns are weak and book value isn't growing. The business may be struggling to create owner value over time.";
  }

  const getOwnerValuePosition = () => {
    const clamp = (val: number) => Math.max(10, Math.min(90, val));
    const cappedRoic = Math.min(Math.max(roic, -10), 50);
    const cappedBv = bvGrowthKnown ? Math.min(Math.max(bvGrowth, -20), 40) : 0;
    const x = clamp(((cappedBv + 22) / 60) * 100);
    const y = clamp(100 - ((cappedRoic + 15) / 60) * 100);
    return { x, y };
  };

  const growthPos = getGrowthPosition(revenueUp, earningsUp, revPct, earnPct);

  return [
    {
      ...QUADRANT_DATA[0],
      verdict: growthVerdict,
      position: growthPos,
      insight: growthInsight,
      signalDirections: [revenueUp, earningsUp] as [boolean, boolean],
      strength: growthStrength,
    },
    {
      ...QUADRANT_DATA[1],
      verdict: profitQualityVerdict,
      position: getProfitQualityPosition(),
      insight: profitQualityInsight,
      signalDirections: [highMargin, highFcf] as [boolean, boolean],
      strength: profitQualityStrength,
    },
    {
      ...QUADRANT_DATA[2],
      verdict: debtVerdict,
      position: getDebtSafetyPosition(),
      insight: debtInsight,
      signalDirections: [!highDebt, highCoverage] as [boolean, boolean],
      strength: debtStrength,
    },
    {
      ...QUADRANT_DATA[3],
      verdict: reinvestVerdict,
      position: getOwnerValuePosition(),
      insight: reinvestInsight,
      signalDirections: [highBvGrowth, highRoic] as [boolean, boolean],
      strength: reinvestStrength,
    },
  ];
}
