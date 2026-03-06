import { db } from "../db";
import { aiBusinessAnalysis } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
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

export async function getLatestCompanyInfoByTicker(
  ticker: string
): Promise<{ companyName: string } | null> {
  const rows = await db
    .select({ companyName: aiBusinessAnalysis.companyName })
    .from(aiBusinessAnalysis)
    .where(eq(aiBusinessAnalysis.ticker, ticker.toUpperCase()))
    .orderBy(desc(aiBusinessAnalysis.filingDate))
    .limit(1);
  return rows.length ? { companyName: rows[0].companyName } : null;
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
  if (!params.cacheKey) throw new Error("cacheKey is required for insertBusinessAnalysis");
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
