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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
