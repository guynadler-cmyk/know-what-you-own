// import axios, { AxiosError } from "axios";
// import { db } from "@server/db";
// import {
//   secSubmissions,
//   businessSections,
//   footnotesSections,
//   raw10KTexts,
// } from "@shared/schema";
// import { eq, and } from "drizzle-orm";

// /* -------------------- TYPES -------------------- */
// interface CompanyTickerMapping {
//   cik_str: number;
//   ticker: string;
//   title: string;
// }

// interface SECSubmission {
//   filings: {
//     recent: {
//       accessionNumber: string[];
//       filingDate: string[];
//       form: string[];
//       primaryDocument: string[];
//     };
//   };
//   name: string;
// }

// /* -------------------- CONSTANTS -------------------- */
// const SEC_HEADERS = {
//   "User-Agent": "Know What You Own info@restnvest.com",
//   "Accept-Encoding": "gzip, deflate",
// };

// const CACHE_TTL_HOURS = 24;

// /* -------------------- HELPERS -------------------- */
// const isFresh = (date?: Date | null) =>
//   !!date && Date.now() - date.getTime() < CACHE_TTL_HOURS * 60 * 60 * 1000;

// async function retryWithBackoff<T>(
//   fn: () => Promise<T>,
//   maxRetries = 3,
//   baseDelay = 800
// ): Promise<T> {
//   let lastError: Error | undefined;

//   for (let attempt = 0; attempt <= maxRetries; attempt++) {
//     try {
//       return await fn();
//     } catch (err) {
//       lastError = err as Error;
//       const axiosErr = err as AxiosError;
//       const status = axiosErr.response?.status;

//       const shouldRetry = !status || status === 429 || status >= 500;
//       if (!shouldRetry || attempt === maxRetries) throw err;

//       await new Promise((r) =>
//         setTimeout(r, baseDelay * Math.pow(2, attempt))
//       );
//     }
//   }

//   throw lastError;
// }

// /* ==================== SERVICE ==================== */
// export class SECService {
//   private tickerCache = new Map<string, CompanyTickerMapping>();

//   /* ---------- COMPANY INFO ---------- */
//   async getCompanyInfo(ticker: string) {
//     if (!this.tickerCache.size) await this.loadTickerMappings();

//     const company = this.tickerCache.get(ticker.toUpperCase());
//     if (!company) throw new Error(`Ticker ${ticker} not found`);

//     return {
//       cik: String(company.cik_str).padStart(10, "0"),
//       name: company.title,
//     };
//   }

//   /* ---------- SUBMISSIONS (CACHED) ---------- */
//   async getSubmissions(cik: string): Promise<SECSubmission> {
//     const cached = await db.query.secSubmissions.findFirst({
//       where: eq(secSubmissions.cik, cik),
//     });

//     if (cached && isFresh(cached.updatedAt)) {
//   return JSON.parse(cached.filings as string);
// }


//     const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
//     const { data } = await retryWithBackoff(() =>
//       axios.get<SECSubmission>(url, { headers: SEC_HEADERS })
//     );

//     await db
//       .insert(secSubmissions)
//       .values({
//         cik,
//         filings: JSON.stringify(data),
//         updatedAt: new Date(),
//       })
//       .onConflictDoUpdate({
//         target: secSubmissions.cik,
//         set: { filings: JSON.stringify(data), updatedAt: new Date() },
//       });

//     return data;
//   }

//   /* ---------- 10-K METADATA ---------- */
//   async getLast5Years10K(cik: string) {
//     const data = await this.getSubmissions(cik);
//     const result = [];

//     for (let i = 0; i < data.filings.recent.form.length && result.length < 5; i++) {
//       if (data.filings.recent.form[i] === "10-K") {
//         const filingDate = data.filings.recent.filingDate[i];
//         result.push({
//           accession: data.filings.recent.accessionNumber[i],
//           filingDate,
//           fiscalYear: new Date(filingDate).getFullYear().toString(),
//         });
//       }
//     }

//     return result;
//   }

//   /* ---------- RAW 10-K TEXT (CACHED ONCE) ---------- */
//   private async getRaw10KText(cik: string, accession: string): Promise<string> {
//     const cached = await db.query.raw10KTexts.findFirst({
//       where: and(eq(raw10KTexts.cik, cik), eq(raw10KTexts.accession, accession)),
//     });

//     if (cached && isFresh(cached.updatedAt)) return cached.text;

//     const accPath = accession.replace(/-/g, "");
//     const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(
//       cik
//     )}/${accPath}/${accession}.txt`;

//     const { data } = await retryWithBackoff(() =>
//       axios.get(url, { headers: SEC_HEADERS })
//     );

//     await db
//       .insert(raw10KTexts)
//       .values({ cik, accession, text: data, updatedAt: new Date() })
//       .onConflictDoUpdate({
//         target: [raw10KTexts.cik, raw10KTexts.accession],
//         set: { text: data, updatedAt: new Date() },
//       });

//     return data;
//   }

//   /* ---------- BUSINESS SECTION ---------- */
//   async get10KBusinessSection(cik: string, accession: string): Promise<string> {
//     const cached = await db.query.businessSections.findFirst({
//       where: and(
//         eq(businessSections.cik, cik),
//         eq(businessSections.accession, accession)
//       ),
//     });

//     if (cached && isFresh(cached.updatedAt)) return cached.text;

//     const raw = await this.getRaw10KText(cik, accession);
//     const match = raw.match(
//       /ITEM\s+1[\.\:\-]?\s*(?:Business)?([\s\S]*?)(?:ITEM\s+1A|ITEM\s+2)/i
//     );
//     if (!match) throw new Error("Business section not found");

//     const text = this.clean(match[1]).slice(0, 15000);

//     await db
//       .insert(businessSections)
//       .values({ cik, accession, text, updatedAt: new Date() })
//       .onConflictDoUpdate({
//         target: [businessSections.cik, businessSections.accession],
//         set: { text, updatedAt: new Date() },
//       });

//     return text;
//   }

//   /* ---------- FOOTNOTES ---------- */
//   async get10KFootnotesSection(cik: string, accession: string): Promise<string> {
//     const cached = await db.query.footnotesSections.findFirst({
//       where: and(
//         eq(footnotesSections.cik, cik),
//         eq(footnotesSections.accession, accession)
//       ),
//     });

//     if (cached && isFresh(cached.updatedAt)) return cached.text;

//     const raw = await this.getRaw10KText(cik, accession);
//     const match = raw.match(
//       /(Notes\s+to\s+.*?Financial\s+Statements[\s\S]*?)(?:ITEM\s+9|ITEM\s+15)/i
//     );
//     if (!match) throw new Error("Footnotes not found");

//     const text = this.clean(match[1]).slice(0, 20000);

//     await db
//       .insert(footnotesSections)
//       .values({ cik, accession, text, updatedAt: new Date() })
//       .onConflictDoUpdate({
//         target: [footnotesSections.cik, footnotesSections.accession],
//         set: { text, updatedAt: new Date() },
//       });

//     return text;
//   }

//   /* ---------- CLEANER ---------- */
//   private clean(text: string) {
//     return text
//       .replace(/<[^>]*>/g, " ")
//       .replace(/&nbsp;|&[a-z]+;|&#\d+;/gi, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//   }

//   /* ---------- TICKER MAP ---------- */
//   private async loadTickerMappings() {
//     const url = "https://www.sec.gov/files/company_tickers.json";
//     const { data } = await retryWithBackoff(() =>
//       axios.get(url, { headers: SEC_HEADERS })
//     );

//     Object.values(data).forEach((c: any) =>
//       this.tickerCache.set(c.ticker.toUpperCase(), c)
//     );
//   }
// }

// export const secService = new SECService();

import axios, { AxiosError } from "axios";
import { MemoryCache } from "./caching";

interface CompanyTickerMapping {
  cik_str: number;
  ticker: string;
  title: string;
}

interface SECSubmission {
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
  name: string;
}

const SEC_HEADERS = {
  "User-Agent": "Know What You Own info@restnvest.com",
  "Accept-Encoding": "gzip, deflate"
};

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const isAxiosError = error instanceof Error && 'isAxiosError' in error;
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;

      const shouldRetry =
        !statusCode ||
        statusCode === 429 ||
        statusCode >= 500 ||
        (isAxiosError && !axiosError.response);

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[SEC] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}





export class SECService {
  private tickerCache: Map<string, CompanyTickerMapping> = new Map();
  private submissionsCache = new MemoryCache(24 * 60 * 60 * 1000); // 24h
  private filingTextCache = new MemoryCache(7 * 24 * 60 * 60 * 1000); // 7 days

  async getCompanyInfo(ticker: string): Promise<{ cik: string; name: string }> {
    const upperTicker = ticker.toUpperCase();

    if (!this.tickerCache.size) {
      await this.loadTickerMappings();
    }

    const company = this.tickerCache.get(upperTicker);
    if (!company) {
      throw new Error(`Ticker ${ticker} not found`);
    }

    const cik = String(company.cik_str).padStart(10, '0');
    return { cik, name: company.title };
  }

  async getLatest10K(cik: string): Promise<{
    accessionNumber: string;
    filingDate: string;
    fiscalYear: string;
  }> {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    const cacheKey = `submissions:${cik}`;
    let data = this.submissionsCache.get<SECSubmission>(cacheKey);
    console.log(data)
    if (!data) {
      const response = await retryWithBackoff(() =>
        axios.get<SECSubmission>(url, { headers: SEC_HEADERS })
      );
      data = response.data;
      this.submissionsCache.set(cacheKey, data);
    }

    const { filings } = data;
//     const response = await retryWithBackoff(async () => {
//       return await axios.get<SECSubmission>(url, { headers: SEC_HEADERS });
//     });
//
//     const { filings } = response.data;

    const index = filings.recent.form.findIndex(form => form === "10-K");

    if (index === -1) {
      throw new Error("No 10-K filing found for this company");
    }

    const accessionNumber = filings.recent.accessionNumber[index];
    const filingDate = filings.recent.filingDate[index];
    const fiscalYear = new Date(filingDate).getFullYear().toString();

    return { accessionNumber, filingDate, fiscalYear };
  }

  async getLast5Years10K(cik: string): Promise<Array<{
    accessionNumber: string;
    filingDate: string;
    fiscalYear: string;
  }>> {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;

    const cacheKey = `submissions:${cik}`;
    let data = this.submissionsCache.get<SECSubmission>(cacheKey);

    if (!data) {
      const response = await retryWithBackoff(() =>
        axios.get<SECSubmission>(url, { headers: SEC_HEADERS })
      );
      data = response.data;
      this.submissionsCache.set(cacheKey, data);
    }

    const { filings } = data;

//     const response = await axios.get<SECSubmission>(url, { headers: SEC_HEADERS });
//     const { filings } = response.data;                                       

    const tenKFilings: Array<{
      accessionNumber: string;
      filingDate: string;
      fiscalYear: string;
    }> = [];

    for (let i = 0; i < filings.recent.form.length && tenKFilings.length < 5; i++) {
      if (filings.recent.form[i] === "10-K") {
        const accessionNumber = filings.recent.accessionNumber[i];
        const filingDate = filings.recent.filingDate[i];
        const fiscalYear = new Date(filingDate).getFullYear().toString();

        tenKFilings.push({ accessionNumber, filingDate, fiscalYear });
      }
    }

    if (tenKFilings.length === 0) {
      throw new Error("No 10-K filings found");
    }

    return tenKFilings;
  }

  async get5YearsBusinessSections(cik: string): Promise<Array<{
    fiscalYear: string;
    filingDate: string;
    businessSection: string;
  }>> {
    const filings = await this.getLast5Years10K(cik);
    const sections = [];

    for (const filing of filings) {
      try {
        const businessSection = await this.get10KBusinessSection(cik, filing.accessionNumber);
        sections.push({
          fiscalYear: filing.fiscalYear,
          filingDate: filing.filingDate,
          businessSection,
        });
      } catch (error) {
        console.warn(`Failed to fetch business section for ${filing.fiscalYear}:`, error);
      }
    }

    return sections;
  }

  async get10KBusinessSection(cik: string, accessionNumber: string): Promise<string> {
    const accessionPath = accessionNumber.replace(/-/g, '');
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionPath}/${accessionNumber}.txt`;
    const cacheKey = `filing:${cik}:${accessionNumber}`;
    let text = this.filingTextCache.get<string>(cacheKey);

    if (!text) {
      const response = await retryWithBackoff(() =>
        axios.get(url, { headers: SEC_HEADERS })
      );
      text = response.data;
      this.filingTextCache.set(cacheKey, text);
    }
//         const response = await retryWithBackoff(async () => {
//           return await axios.get(url, { headers: SEC_HEADERS });
//         });

//     const text = response.data;

    // Try multiple regex patterns to handle different 10-K formatting
    const patterns = [
      // Standard format: ITEM 1. Business ... ITEM 1A
      'ITEM\\s+1[\\.\\:\\-]?\\s*Business(.*?)ITEM\\s+1A',
      // Alternative: ITEM 1 ... ITEM 1A (Business might be on new line)
      'ITEM\\s+1[\\.\\:\\-]?\\s*[\\r\\n]*(.*?)ITEM\\s+1A',
      // Looser pattern: Look for ITEM 1 followed by content until next ITEM
      'ITEM\\s+1[\\.\\:\\-]?\\s*(?:Business)?[\\r\\n]*(.*?)(?:ITEM\\s+(?:1A|1B|2))',
    ];

    let businessMatch = null;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'is');
      businessMatch = text.match(regex);
      if (businessMatch) break;
    }

    if (!businessMatch || !businessMatch[1]) {
      console.error(`Failed to extract business section for CIK ${cik}, accession ${accessionNumber}`);
      throw new Error("Unable to find the business description in this 10-K filing");
    }

    let businessSection = businessMatch[1];

    // Clean up HTML tags and entities
    businessSection = businessSection
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Return first 15000 characters for the business section
    return businessSection.slice(0, 15000);
  }

  async get10KFootnotesSection(cik: string, accessionNumber: string): Promise<string> {
    const accessionPath = accessionNumber.replace(/-/g, '');
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionPath}/${accessionNumber}.txt`;
    const cacheKey = `filing:${cik}:${accessionNumber}`;
    let text = this.filingTextCache.get<string>(cacheKey);

    if (!text) {
      const response = await retryWithBackoff(() =>
        axios.get(url, { headers: SEC_HEADERS })
      );
      text = response.data;
      this.filingTextCache.set(cacheKey, text);
    }
//     const response = await axios.get(url, { headers: SEC_HEADERS });
//     const text = response.data;

    // Try multiple regex patterns to extract notes/footnotes
    // Footnotes typically appear in Item 8 after the financial statements
    const patterns = [
      // Pattern: "Notes to" (Consolidated) Financial Statements
      'Notes\\s+to\\s+(?:Consolidated\\s+)?Financial\\s+Statements(.*?)(?:ITEM\\s+9|ITEM\\s+15)',
      // Pattern: Look for explicit "Note 1" or "NOTE 1" section
      '(?:Note|NOTE)\\s+1[\\s\\-\\.\\:](.*?)(?:ITEM\\s+9|ITEM\\s+15)',
      // Alternative: Item 8 content (contains financial statements and notes)
      'ITEM\\s+8[\\.\\:\\-]?\\s*Financial\\s+Statements(.*?)ITEM\\s+9',
    ];

    let footnotesMatch = null;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'is');
      footnotesMatch = text.match(regex);
      if (footnotesMatch) break;
    }

    if (!footnotesMatch || !footnotesMatch[1]) {
      console.error(`Failed to extract footnotes section for CIK ${cik}, accession ${accessionNumber}`);
      throw new Error("Could not extract footnotes section from 10-K");
    }

    let footnotesSection = footnotesMatch[1];

    // Clean up HTML tags and entities
    footnotesSection = footnotesSection
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Return first 20000 characters for the footnotes section
    // (footnotes can be longer than business section)
    return footnotesSection.slice(0, 20000);
  }

  private async loadTickerMappings(): Promise<void> {
    return retryWithBackoff(async () => {
      const url = "https://www.sec.gov/files/company_tickers.json";
      const response = await axios.get(url, { headers: SEC_HEADERS });

      const data = response.data;

      for (const key in data) {
        const company = data[key] as CompanyTickerMapping;
        this.tickerCache.set(company.ticker.toUpperCase(), company);
      }
    });
  }
  
  private normalizeForSearch(text: string): string {
    return text
      .toLowerCase()
      .replace(/[''`]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async searchCompanies(query: string, limit: number = 10): Promise<Array<{ ticker: string; name: string }>> {
    if (!this.tickerCache.size) {
      await this.loadTickerMappings();
    }

    const normalizedQuery = this.normalizeForSearch(query);
    if (!normalizedQuery) {
      return [];
    }

    // Check if user is searching for a preferred stock (contains hyphen)
    const searchingPreferred = query.includes('-');

    const results: Array<{ ticker: string; name: string; score: number }> = [];

    const entries = Array.from(this.tickerCache.entries());
    for (const [ticker, company] of entries) {
      // Skip preferred stock variants (tickers with hyphens) unless user is searching for them
      const isPreferredStock = ticker.includes('-');
      if (isPreferredStock && !searchingPreferred) {
        continue;
      }

      const normalizedName = this.normalizeForSearch(company.title);
      const normalizedTicker = ticker.toLowerCase();

      let score = 0;

      // Exact ticker match gets highest priority
      if (normalizedTicker === normalizedQuery) {
        score = 1000;
      }
      // Ticker starts with query
      else if (normalizedTicker.startsWith(normalizedQuery)) {
        score = 500 + (100 - normalizedTicker.length);
      }
      // Exact name match
      else if (normalizedName === normalizedQuery) {
        score = 400;
      }
      // Name starts with query
      else if (normalizedName.startsWith(normalizedQuery)) {
        score = 300 + (100 - normalizedName.length);
      }
      // Query matches a word in the company name (word boundary match)
      else if (normalizedName.split(' ').some(word => word.startsWith(normalizedQuery))) {
        score = 200;
      }
      // Skip pure substring matches (like "Ashford" matching "ford")
      // These create too much noise and are rarely what users want

      if (score > 0) {
        results.push({ ticker, name: company.title, score });
      }
    }

    // Sort by score descending, then alphabetically by ticker
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.ticker.localeCompare(b.ticker);
    });

    return results.slice(0, limit).map(({ ticker, name }) => ({ ticker, name }));
  }
}

export const secService = new SECService();


