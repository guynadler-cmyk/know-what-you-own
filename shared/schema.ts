import { z } from "zod";
import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// Product schema
export const productSchema = z.object({
  name: z.string(),
  icon: z.string(),
  description: z.string(),
});

// Leader schema
export const leaderSchema = z.object({
  name: z.string(),
  role: z.string(),
  initials: z.string(),
  twitter: z.string().optional(),
});

// Competitor schema
export const competitorSchema = z.object({
  name: z.string(),
  ticker: z.string().optional(),
  focus: z.string(),
});

// Metric schema
export const metricSchema = z.object({
  label: z.string(),
  value: z.string(),
  trend: z.enum(["up", "down", "stable"]).optional(),
});

// News item schema
export const newsItemSchema = z.object({
  title: z.string(),
  source: z.string(),
  date: z.string(),
  url: z.string(),
});

// Video resource schema
export const videoResourceSchema = z.object({
  title: z.string(),
  channel: z.string(),
  url: z.string(),
});

// Sales channel schema
export const salesChannelSchema = z.object({
  name: z.string(),
  explanation: z.string(),
});

// Investment theme schema
export const investmentThemeSchema = z.object({
  name: z.string(),
  emphasis: z.enum(["high", "medium", "low"]),
  explanation: z.string(),
});

// Moat (competitive advantage) schema
export const moatSchema = z.object({
  name: z.string(),
  emphasis: z.enum(["high", "medium", "low"]),
  explanation: z.string(),
});

// Market opportunity schema
export const marketOpportunitySchema = z.object({
  name: z.string(),
  emphasis: z.enum(["high", "medium", "low"]),
  explanation: z.string(),
});

// Value creation model schema
export const valueCreationSchema = z.object({
  name: z.string(),
  emphasis: z.enum(["high", "medium", "low"]),
  explanation: z.string(),
});

// Operations schema
export const operationsSchema = z.object({
  regions: z.array(z.string()),
  channels: z.array(salesChannelSchema),
  scale: z.string(),
});

// Stock performance metric schema
export const performanceMetricSchema = z.object({
  name: z.string(),
  value: z.string(),
  explanation: z.string(),
  chartData: z.array(z.object({
    year: z.string(),
    value: z.number(),
  })),
});

// Years to doubling data schema
export const yearsToDoublingSchema = z.object({
  years: z.number(),
  currentValue: z.string(),
  projectedValue: z.string(),
  chartData: z.array(z.object({
    year: z.number(),
    value: z.number(),
  })),
});

// Stock performance schema
export const stockPerformanceSchema = z.object({
  yearsToDoubling: yearsToDoublingSchema,
  metrics: z.array(performanceMetricSchema),
});

// Metadata schema
export const metadataSchema = z.object({
  homepage: z.string(),
  investorRelations: z.string().optional(),
  news: z.array(newsItemSchema),
  videos: z.array(videoResourceSchema),
});

// Temporal Analysis Schemas - for tracking changes across 5 years of filings
export const discontinuedItemSchema = z.object({
  item: z.string(),
  category: z.string(),
  lastMentionedYear: z.string(),
  yearsActive: z.string(),
  context: z.string(),
});

export const newSustainedItemSchema = z.object({
  item: z.string(),
  category: z.string(),
  introducedYear: z.string(),
  context: z.string(),
});

export const evolvedItemSchema = z.object({
  item: z.string(),
  category: z.string(),
  yearRange: z.string(),
  changeDescription: z.string(),
  beforeSnapshot: z.string(),
  afterSnapshot: z.string(),
});

export const newProductSchema = z.object({
  name: z.string(),
  introducedYear: z.string(),
  description: z.string(),
  significance: z.string(),
});

export const temporalSummarySchema = z.object({
  yearsAnalyzed: z.array(z.string()),
  discontinuedCount: z.number(),
  newSustainedCount: z.number(),
  evolvedCount: z.number(),
  newProductsCount: z.number(),
});

export const temporalAnalysisSchema = z.object({
  summary: temporalSummarySchema,
  discontinued: z.array(discontinuedItemSchema),
  newAndSustained: z.array(newSustainedItemSchema),
  evolved: z.array(evolvedItemSchema),
  newProducts: z.array(newProductSchema),
});

// Fine Print Analysis Schemas - for extracting and categorizing footnotes
export const finePrintItemSchema = z.object({
  title: z.string(),
  summary: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  details: z.string(),
});

export const finePrintAnalysisSchema = z.object({
  fiscalYear: z.string(),
  filingDate: z.string(),
  criticalRisks: z.array(finePrintItemSchema),
  financialCommitments: z.array(finePrintItemSchema),
  accountingChanges: z.array(finePrintItemSchema),
  relatedPartyTransactions: z.array(finePrintItemSchema),
  otherMaterialDisclosures: z.array(finePrintItemSchema),
});

// Complete company summary schema
export const companySummarySchema = z.object({
  companyName: z.string(),
  ticker: z.string(),
  filingDate: z.string(),
  fiscalYear: z.string(),
  tagline: z.string(),
  investmentThesis: z.string(),
  investmentThemes: z.array(investmentThemeSchema).default([]),
  moats: z.array(moatSchema).default([]),
  marketOpportunity: z.array(marketOpportunitySchema).default([]),
  valueCreation: z.array(valueCreationSchema).default([]),
  products: z.array(productSchema),
  operations: operationsSchema,
  competitors: z.array(competitorSchema),
  leaders: z.array(leaderSchema),
  metrics: z.array(metricSchema),
  stockPerformance: stockPerformanceSchema.optional(),
  metadata: metadataSchema,
  cik: z.string().optional(),
  temporalAnalysis: temporalAnalysisSchema.optional(),
});

export type Product = z.infer<typeof productSchema>;
export type Leader = z.infer<typeof leaderSchema>;
export type Competitor = z.infer<typeof competitorSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type VideoResource = z.infer<typeof videoResourceSchema>;
export type SalesChannel = z.infer<typeof salesChannelSchema>;
export type InvestmentTheme = z.infer<typeof investmentThemeSchema>;
export type Moat = z.infer<typeof moatSchema>;
export type MarketOpportunity = z.infer<typeof marketOpportunitySchema>;
export type ValueCreation = z.infer<typeof valueCreationSchema>;
export type Operations = z.infer<typeof operationsSchema>;
export type PerformanceMetric = z.infer<typeof performanceMetricSchema>;
export type YearsToDoubling = z.infer<typeof yearsToDoublingSchema>;
export type StockPerformance = z.infer<typeof stockPerformanceSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type DiscontinuedItem = z.infer<typeof discontinuedItemSchema>;
export type NewSustainedItem = z.infer<typeof newSustainedItemSchema>;
export type EvolvedItem = z.infer<typeof evolvedItemSchema>;
export type NewProduct = z.infer<typeof newProductSchema>;
export type TemporalSummary = z.infer<typeof temporalSummarySchema>;
export type TemporalAnalysis = z.infer<typeof temporalAnalysisSchema>;
export type FinePrintItem = z.infer<typeof finePrintItemSchema>;
export type FinePrintAnalysis = z.infer<typeof finePrintAnalysisSchema>;
export type CompanySummary = z.infer<typeof companySummarySchema>;

// Database Tables for Replit Auth
// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial metrics schemas
export const incomeMetricsSchema = z.object({
  ticker: z.string(),
  revenueGrowth: z.enum(["growing", "declining"]),
  earningsGrowth: z.enum(["growing", "declining"]),
  currentRevenue: z.string(),
  previousRevenue: z.string(),
  revenueChangePercent: z.number(),
  currentEarnings: z.string(),
  previousEarnings: z.string(),
  earningsChangePercent: z.number(),
  fiscalYear: z.string(),
  previousFiscalYear: z.string(),
});

export type IncomeMetrics = z.infer<typeof incomeMetricsSchema>;
export const financialMetricsSchema = incomeMetricsSchema;
export type FinancialMetrics = IncomeMetrics;

// Balance sheet metrics
export const balanceSheetCheckSchema = z.object({
  status: z.enum(["strong", "caution", "weak"]),
  title: z.string(),
  summary: z.string(),
  details: z.string(),
  numbers: z.string(),
});

export const balanceSheetMetricsSchema = z.object({
  ticker: z.string(),
  fiscalYear: z.string(),
  previousFiscalYear: z.string(),
  checks: z.object({
    liquidity: balanceSheetCheckSchema,
    debtBurden: balanceSheetCheckSchema,
    equityGrowth: balanceSheetCheckSchema,
  }),
});

export type BalanceSheetCheck = z.infer<typeof balanceSheetCheckSchema>;
export type BalanceSheetMetrics = z.infer<typeof balanceSheetMetricsSchema>;

export const combinedFinancialMetricsSchema = incomeMetricsSchema.extend({
  balanceSheet: balanceSheetMetricsSchema.optional(),
});

export type CombinedFinancialMetrics = z.infer<typeof combinedFinancialMetricsSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Waitlist signups table for marketing
export const waitlistSignups = pgTable("waitlist_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  stageName: varchar("stage_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Waitlist insert schema
export const insertWaitlistSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  stageName: z.string().min(1, "Stage name is required"),
});

export type InsertWaitlistSignup = z.infer<typeof insertWaitlistSignupSchema>;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;

// Scheduled checkup emails table for reminder tracking
export const scheduledCheckupEmails = pgTable("scheduled_checkup_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  selectedCheckins: jsonb("selected_checkins").notNull().$type<string[]>(),
  customMessage: varchar("custom_message", { length: 500 }),
  reminderDates: jsonb("reminder_dates").notNull().$type<{ type: string; date: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled checkup insert schema
export const insertScheduledCheckupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  ticker: z.string().min(1, "Ticker is required").max(10),
  selectedCheckins: z.array(z.string()).min(1, "Select at least one check-in type"),
  customMessage: z.string().max(500).optional(),
  reminderDates: z.array(z.object({
    type: z.string(),
    date: z.string(),
  })),
});

export type InsertScheduledCheckup = z.infer<typeof insertScheduledCheckupSchema>;
export type ScheduledCheckupEmail = typeof scheduledCheckupEmails.$inferSelect;

// Valuation Metrics (Magic Formula)
export const valuationSignalSchema = z.object({
  label: z.string(),
  value: z.string(),
  color: z.enum(["green", "red", "yellow", "neutral"]),
  tooltip: z.string(),
});

export const valuationQuadrantSchema = z.object({
  id: z.string(),
  title: z.string(),
  verdict: z.string(),
  signals: z.array(valuationSignalSchema),
  insight: z.string(),
  insightHighlight: z.string(),
  strength: z.enum(["sensible", "caution", "risky"]),
  tier1Summary: z.string().optional(),
  tier2Explanation: z.string().optional(),
});

export const valuationMetricsSchema = z.object({
  ticker: z.string(),
  companyName: z.string(),
  fiscalYear: z.string(),
  sector: z.string().optional(),
  
  // Core Magic Formula inputs
  marketCap: z.number(),
  marketCapFormatted: z.string(),
  ebit: z.number(),
  ebitFormatted: z.string(),
  enterpriseValue: z.number(),
  enterpriseValueFormatted: z.string(),
  
  // Magic Formula outputs
  earningsYield: z.number(), // EBIT / EV as percentage
  earningsYieldFormatted: z.string(),
  returnOnCapital: z.number(), // EBIT / (Net Working Capital + Net Fixed Assets) as percentage
  returnOnCapitalFormatted: z.string(),
  
  // Additional context
  priceToEarnings: z.number().optional(),
  priceToEarningsFormatted: z.string().optional(),
  distanceFromHigh: z.number().optional(), // percentage below 52-week high
  distanceFromHighFormatted: z.string().optional(),
  
  // Share structure
  sharesOutstanding: z.number().optional(),
  shareChange: z.number().optional(), // positive = dilution, negative = buybacks
  shareChangeFormatted: z.string().optional(),
  
  // Computed quadrant data
  quadrants: z.array(valuationQuadrantSchema),
  
  // Overall assessment
  overallStrength: z.enum(["sensible", "caution", "risky"]),
  summaryVerdict: z.string(),
});

export type ValuationSignal = z.infer<typeof valuationSignalSchema>;
export type ValuationQuadrant = z.infer<typeof valuationQuadrantSchema>;
export type ValuationMetrics = z.infer<typeof valuationMetricsSchema>;

// Timing Analysis Schemas - for market conditions assessment
export const timingSignalStatusSchema = z.enum(["green", "yellow", "red"]);

export const timingSignalSchema = z.object({
  status: timingSignalStatusSchema,
  label: z.string(),
  interpretation: z.string(),
  score: z.number().min(-1).max(1), // Normalized score from -1 to +1
  position: z.object({
    x: z.number().min(0).max(100), // Quadrant X position (0-100)
    y: z.number().min(0).max(100), // Quadrant Y position (0-100)
  }).optional(),
  signals: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

// Chart data for visual representations
export const trendChartDataSchema = z.object({
  prices: z.array(z.number()), // Smoothed price series
  baseline: z.array(z.number()), // Long-term EMA (optional baseline)
  structurePoints: z.array(z.object({
    index: z.number(),
    type: z.enum(["high", "low"]),
  })).optional(),
});

export const momentumChartDataSchema = z.object({
  shortEma: z.array(z.number()), // Short-term EMA (responsive behavior) - normalized
  longEma: z.array(z.number()), // Long-term EMA (anchoring behavior) - normalized
});

export const stretchChartDataSchema = z.object({
  values: z.array(z.number()), // Distance from equilibrium (-1 to +1)
  tension: z.array(z.number()), // Tension level (0-1)
});

export const timingTimeframeSchema = z.enum(["weekly", "daily"]);
export type TimingTimeframe = z.infer<typeof timingTimeframeSchema>;

// Debug primitives for transparency
export const timingDebugSchema = z.object({
  timeframe: timingTimeframeSchema,
  lastBarDate: z.string(),
  seriesType: z.string(), // "adjusted" or "unadjusted"
  
  // RSI primitives
  rsiLatest: z.number(),
  rsiPrevious: z.number(),
  rsiDistanceFrom50: z.number(), // abs(rsi - 50)
  
  // MACD primitives
  macdLine: z.number(),
  macdSignal: z.number(),
  macdHist: z.number(),
  macdHistPrev: z.number(),
  
  // EMA slopes used for classification
  shortEmaSlope: z.number(), // percentage change over period
  longEmaSlope: z.number(),
  
  // Trend primitives
  highsProgression: z.string(), // "strengthening" | "weakening" | "mixed"
  lowsProgression: z.string(),
  
  // Stretch primitives
  distanceFromBalance: z.number(), // percentage
  rsiZone: z.enum(['Oversold', 'Neutral', 'Overbought']),
  rsiDirection: z.enum(['Rising', 'Falling', 'Flat']),
});

export const timingAnalysisSchema = z.object({
  ticker: z.string(),
  companyName: z.string().optional(),
  lastUpdated: z.string(),
  timeframe: timingTimeframeSchema.optional(), // "weekly" or "daily"
  
  // Debug data for internal QA
  debug: timingDebugSchema.optional(),
  
  // Overall verdict
  verdict: z.object({
    message: z.string(), // Human-readable verdict
    subtitle: z.string(), // Disclaimer/context
    alignmentScore: z.number().min(-1).max(1), // Combined alignment
  }),
  
  // Three signal dimensions
  trend: z.object({
    signal: timingSignalSchema,
    chartData: trendChartDataSchema,
    deepDive: z.object({
      title: z.string(),
      explanation: z.string(),
    }),
  }),
  
  momentum: z.object({
    signal: timingSignalSchema,
    chartData: momentumChartDataSchema,
    deepDive: z.object({
      title: z.string(),
      explanation: z.string(),
    }),
  }),
  
  stretch: z.object({
    signal: timingSignalSchema,
    chartData: stretchChartDataSchema,
    deepDive: z.object({
      title: z.string(),
      explanation: z.string(),
    }),
  }),
});

export type TimingSignalStatus = z.infer<typeof timingSignalStatusSchema>;
export type TimingSignal = z.infer<typeof timingSignalSchema>;
export type TrendChartData = z.infer<typeof trendChartDataSchema>;
export type MomentumChartData = z.infer<typeof momentumChartDataSchema>;
export type StretchChartData = z.infer<typeof stretchChartDataSchema>;
export type TimingAnalysis = z.infer<typeof timingAnalysisSchema>;
export type TimingDebug = z.infer<typeof timingDebugSchema>;
