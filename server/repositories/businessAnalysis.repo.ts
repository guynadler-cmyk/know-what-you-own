import { db } from "../db";
import { aiBusinessAnalysis } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { CompanySummary } from "@shared/schema";

export async function getBusinessByCacheKey(
  cacheKey: string
): Promise<CompanySummary | null> {
  const rows = await db
    .select({ result: aiBusinessAnalysis.result })
    .from(aiBusinessAnalysis)
    .where(eq(aiBusinessAnalysis.cacheKey, cacheKey))
    .limit(1);

  return rows.length ? (rows[0].result as CompanySummary) : null;
}

export async function insertBusinessAnalysis(params: {
  cacheKey: string;
  companyName: string;
  ticker: string;
  cik?: string;
  fiscalYear: string;
  filingDate: string;
  result: CompanySummary;
}) {
  await db
    .insert(aiBusinessAnalysis)
    .values({
      cacheKey: params.cacheKey,
      companyName: params.companyName,
      ticker: params.ticker,
      cik: params.cik,
      fiscalYear: params.fiscalYear,
      filingDate: params.filingDate,
      result: params.result,
    })
    .onConflictDoNothing();
}
