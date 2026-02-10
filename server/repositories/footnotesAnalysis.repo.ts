import { db } from "../db";
import { aiFootnotesAnalysis } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { FinePrintAnalysis } from "@shared/schema";

export async function getFootnotesByCacheKey(
  cacheKey: string
): Promise<FinePrintAnalysis | null> {
  const rows = await db
    .select({ result: aiFootnotesAnalysis.result })
    .from(aiFootnotesAnalysis)
    .where(eq(aiFootnotesAnalysis.cacheKey, cacheKey))
    .limit(1);

  return rows.length ? (rows[0].result as FinePrintAnalysis) : null;
}

export async function saveFootnotesAnalysis(params: {
  cacheKey: string;
  companyName: string;
  ticker: string;
  fiscalYear: string;
  filingDate: string;
  result: FinePrintAnalysis;
}) {
  await db
    .insert(aiFootnotesAnalysis)
    .values({
      cacheKey: params.cacheKey,
      companyName: params.companyName,
      ticker: params.ticker,
      fiscalYear: params.fiscalYear,
      filingDate: params.filingDate,
      result: params.result,
    })
    .onConflictDoNothing();
}
