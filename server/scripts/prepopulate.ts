/**
 * Pre-population script: runs the full analysis pipeline on a list of tickers
 * and writes results to the external Cloud SQL database for SEO caching.
 *
 * Usage:
 *   npx tsx server/scripts/prepopulate.ts              # runs all 100 tickers
 *   npx tsx server/scripts/prepopulate.ts AAPL MSFT    # specific tickers only
 *   npx tsx server/scripts/prepopulate.ts --skip-temporal AAPL MSFT
 */

import "dotenv/config";
import { secService } from "../services/sec";
import { openaiService } from "../services/openai";
import { getBusinessByCacheKey, insertBusinessAnalysis } from "../repositories/businessAnalysis.repo";
import { makeCacheKey } from "../utils/cacheKey";
import { companySummarySchema } from "../../shared/schema";

const TOP_100_TICKERS = [
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "AVGO", "JPM", "LLY",
  "ORCL", "V",    "NFLX", "COST",  "XOM",  "MA",   "WMT",  "UNH",  "JNJ", "PG",
  "HD",   "ABBV", "AMD",  "BAC",   "KO",   "CRM",  "CSCO", "MRK",  "CVX", "ACN",
  "PFE",  "ADBE", "LIN",  "TMO",   "MCD",  "TXN",  "ABT",  "AXP",  "ISRG","NEE",
  "AMGN", "HON",  "DHR",  "INTU",  "IBM",  "GE",   "DIS",  "PM",   "RTX", "QCOM",
  "PYPL", "CAT",  "SPGI", "BKNG",  "GILD", "UBER", "GS",   "LOW",  "CMCSA","PANW",
  "PLD",  "BLK",  "MDT",  "SYK",   "ADI",  "AMAT", "VRTX", "BSX",  "MMC", "REGN",
  "MU",   "SBUX", "NOW",  "ZTS",   "CI",   "CB",   "SCHW", "INTC", "SO",  "DE",
  "AMT",  "MDLZ", "PNC",  "ETN",   "AON",  "BDX",  "ADP",  "HCA",  "KLAC","TMUS",
  "ELV",  "MCO",  "WFC",  "FI",    "ITW",  "PLTR", "SNOW", "SHOP", "COIN","RBLX",
];

const DELAY_MS = 2500; // 2.5s between tickers to respect SEC EDGAR rate limits

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function processTicker(
  ticker: string,
  skipTemporal: boolean
): Promise<"done" | "skipped" | "failed"> {
  const t = ticker.toUpperCase().trim();

  try {
    // Step 1: Get company info from SEC
    const { cik, name } = await secService.getCompanyInfo(t);

    // Step 2: Get latest 10-K filing metadata
    let accessionNumber: string;
    let filingDate: string;
    let fiscalYear: string;
    let primaryDocument: string;

    try {
      ({ accessionNumber, filingDate, fiscalYear, primaryDocument } =
        await secService.getLatest10K(cik));
    } catch (err: any) {
      if (err.message?.includes("No 10-K")) {
        console.log(`  → skipped: no 10-K available`);
        return "skipped";
      }
      throw err;
    }

    // Step 3: Check if already cached
    const businessKey = makeCacheKey("business", t, fiscalYear);
    const existing = await getBusinessByCacheKey(businessKey);
    if (existing) {
      console.log(`  → skipped: already cached (FY${fiscalYear})`);
      return "skipped";
    }

    // Step 4: Fetch business section text
    const { text: businessSection, depth: sectionDepth } =
      await secService.get10KBusinessSection(cik, accessionNumber, primaryDocument);

    // Step 5: Run business analysis (writes to DB internally via analyzeBusiness)
    const summary = await openaiService.analyzeBusiness(
      name, t, businessSection, filingDate, fiscalYear, cik, sectionDepth
    );

    // Step 6: Temporal analysis (optional)
    let temporalAnalysis;
    if (!skipTemporal) {
      try {
        const yearlyData = await secService.get5YearsBusinessSections(cik);
        if (yearlyData.length >= 2) {
          temporalAnalysis = await openaiService.analyzeTemporalChanges(name, t, yearlyData);
        }
      } catch (temporalErr: any) {
        console.warn(`  ⚠ temporal analysis failed: ${temporalErr.message}`);
      }
    }

    // Step 7: Validate and write combined result to DB
    const validated = companySummarySchema.parse({
      ...summary,
      ...(temporalAnalysis ? { temporalAnalysis } : {}),
      analysisDepth: sectionDepth === "full" ? "full" : "limited",
    });

    await insertBusinessAnalysis({
      cacheKey: businessKey,
      companyName: name,
      ticker: t,
      cik,
      fiscalYear,
      filingDate,
      result: validated,
    });

    console.log(`  ✓ done (FY${fiscalYear}, ${sectionDepth} depth)`);
    return "done";
  } catch (err: any) {
    console.error(`  ✗ failed: ${err.message}`);
    return "failed";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skipTemporal = args.includes("--skip-temporal");
  const tickerArgs = args.filter(a => !a.startsWith("--")).map(a => a.toUpperCase());
  const tickers = tickerArgs.length > 0 ? tickerArgs : TOP_100_TICKERS;

  console.log(`\n=== Restnvest Pre-population Script ===`);
  console.log(`Tickers to process: ${tickers.length}`);
  console.log(`Temporal analysis:  ${skipTemporal ? "disabled" : "enabled"}`);
  console.log(`Rate limit delay:   ${DELAY_MS}ms between tickers\n`);

  const startTime = Date.now();
  const counts = { done: 0, skipped: 0, failed: 0 };
  const failed: string[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const progress = `[${i + 1}/${tickers.length}]`;
    console.log(`${progress} ${ticker}`);

    const result = await processTicker(ticker, skipTemporal);
    counts[result]++;
    if (result === "failed") failed.push(ticker);

    if (i < tickers.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  console.log(`\n=== Summary ===`);
  console.log(`Done:    ${counts.done}`);
  console.log(`Skipped: ${counts.skipped} (already cached or no 10-K)`);
  console.log(`Failed:  ${counts.failed}${failed.length ? ` — ${failed.join(", ")}` : ""}`);
  console.log(`Time:    ${mins}m ${secs}s`);

  process.exit(counts.failed > 0 ? 1 : 0);
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
