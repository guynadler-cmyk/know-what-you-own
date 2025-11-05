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

// Operations schema
export const operationsSchema = z.object({
  regions: z.array(z.string()),
  channels: z.array(salesChannelSchema),
  scale: z.string(),
});

// Metadata schema
export const metadataSchema = z.object({
  homepage: z.string(),
  investorRelations: z.string().optional(),
  news: z.array(newsItemSchema),
  videos: z.array(videoResourceSchema),
});

// Complete company summary schema
export const companySummarySchema = z.object({
  companyName: z.string(),
  ticker: z.string(),
  filingDate: z.string(),
  fiscalYear: z.string(),
  tagline: z.string(),
  products: z.array(productSchema),
  operations: operationsSchema,
  competitors: z.array(competitorSchema),
  leaders: z.array(leaderSchema),
  metrics: z.array(metricSchema),
  metadata: metadataSchema,
  cik: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type Leader = z.infer<typeof leaderSchema>;
export type Competitor = z.infer<typeof competitorSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type NewsItem = z.infer<typeof newsItemSchema>;
export type VideoResource = z.infer<typeof videoResourceSchema>;
export type SalesChannel = z.infer<typeof salesChannelSchema>;
export type Operations = z.infer<typeof operationsSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
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
