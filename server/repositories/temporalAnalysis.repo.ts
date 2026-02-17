// import { db } from "../db";
// import { aiTemporalAnalysis } from "@shared/schema";
// import { eq } from "drizzle-orm";
// import type { TemporalAnalysis } from "@shared/schema";

// export async function getTemporalByCacheKey(
//   cacheKey: string
// ): Promise<TemporalAnalysis | null> {
//   const rows = await db
//     .select({ result: aiTemporalAnalysis.result })
//     .from(aiTemporalAnalysis)
//     .where(eq(aiTemporalAnalysis.cacheKey, cacheKey))
//     .limit(1);

//   return rows.length ? (rows[0].result as TemporalAnalysis) : null;
// }

// export async function saveTemporalAnalysis(params: {
//   cacheKey: string;
//   companyName: string;
//   ticker: string;
//   yearsAnalyzed: string[];
//   result: TemporalAnalysis;
// }) {
//   await db
//     .insert(aiTemporalAnalysis)
//     .values({
//       cacheKey: params.cacheKey,
//       companyName: params.companyName,
//       ticker: params.ticker,
//       yearsAnalyzed: params.yearsAnalyzed,
//       result: params.result,
//     })
//     .onConflictDoNothing();
// }

import { analysisDb } from "../db/analysisDb";
import { aiTemporalAnalysis } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { TemporalAnalysis } from "@shared/schema";

// In-memory cache map for quick lookups (optional)
const temporalCache = new Map<string, TemporalAnalysis>();

/**
 * Retrieve a TemporalAnalysis from cache or DB by cacheKey
 */
export async function getTemporalByCacheKey(
  cacheKey: string
): Promise<TemporalAnalysis | null> {
  // Check in-memory cache first
  if (temporalCache.has(cacheKey)) {
    return temporalCache.get(cacheKey)!;
  }

  // Fallback to database
  const rows = await analysisDb
    .select({
      result: aiTemporalAnalysis.result,
      timeHorizon: aiTemporalAnalysis.timeHorizon,
    })
    .from(aiTemporalAnalysis)
    .where(eq(aiTemporalAnalysis.cacheKey, cacheKey)) // optional if table has cacheKey column
    .limit(1);

  if (rows.length === 0) return null;

  const result = rows[0].result as TemporalAnalysis;

  // Store in cache for next time
  temporalCache.set(cacheKey, result);

  return result;
}

/**
 * Save a TemporalAnalysis into the DB and optionally cache it in memory
 */
export async function saveTemporalAnalysis(params: {
  companyName: string;
  ticker: string;
  yearsAnalyzed: string[];
  result: TemporalAnalysis;
  timeHorizon: string; // must include this
}) {
  const cacheKey = `${params.ticker}:${params.timeHorizon}`;

  // cache in memory
  temporalCache.set(cacheKey, params.result);

  await analysisDb
    .insert(aiTemporalAnalysis)
    .values({
      cacheKey,
      ticker: params.ticker,
      companyName: params.companyName,
      yearsAnalyzed: params.yearsAnalyzed,
      result: params.result,
      timeHorizon: params.timeHorizon,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}
