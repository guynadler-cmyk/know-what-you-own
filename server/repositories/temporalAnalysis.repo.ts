import { db } from "../db";
import { aiTemporalAnalysis } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { TemporalAnalysis } from "@shared/schema";

export async function getTemporalByCacheKey(
  cacheKey: string
): Promise<TemporalAnalysis | null> {
  const rows = await db
    .select({ result: aiTemporalAnalysis.result })
    .from(aiTemporalAnalysis)
    .where(eq(aiTemporalAnalysis.cacheKey, cacheKey))
    .limit(1);

  return rows.length ? (rows[0].result as TemporalAnalysis) : null;
}

export async function saveTemporalAnalysis(params: {
  cacheKey: string;
  companyName: string;
  ticker: string;
  yearsAnalyzed: string[];
  result: TemporalAnalysis;
}) {
  await db
    .insert(aiTemporalAnalysis)
    .values({
      cacheKey: params.cacheKey,
      companyName: params.companyName,
      ticker: params.ticker,
      yearsAnalyzed: params.yearsAnalyzed,
      result: params.result,
    })
    .onConflictDoNothing();
}
