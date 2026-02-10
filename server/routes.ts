// import type { Express } from "express";
// import { createServer, type Server } from "http";
// import { secService } from "./services/sec";
// import { openaiService } from "./services/openai";
// import { companySummarySchema,incomeMetricsSchema, balanceSheetMetricsSchema,combinedFinancialMetricsSchema,finePrintAnalysisSchema } from "@shared/schema";
// import { alphaVantageService } from "./services/alphavantage";

// export async function registerRoutes(app: Express): Promise<Server> {
//   // Analysis endpoint - Public access, returns full data for everyone
//   app.get("/api/analyze/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format. Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());

//       const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);

//       const businessSection = await secService.get10KBusinessSection(cik, accessionNumber);

//       const summary = await openaiService.analyzeBusiness(
//         name,
//         ticker.toUpperCase(),
//         businessSection,
//         filingDate,
//         fiscalYear,
//         cik
//       );

//       // Fetch 5 years of data for temporal analysis with timeout
//       let temporalAnalysis;
//       try {
//         const yearlyData = await secService.get5YearsBusinessSections(cik);

//         // Only run temporal analysis if we have at least 2 years of data
//         if (yearlyData.length >= 2) {
//           console.log(`Starting temporal analysis for ${ticker} with ${yearlyData.length} years of data`);

//           // Add 30 second timeout for temporal analysis
//           const timeoutPromise = new Promise((_, reject) =>
//             setTimeout(() => reject(new Error('Temporal analysis timeout')), 30000)
//           );

//           const analysisPromise = openaiService.analyzeTemporalChanges(
//             name,
//             ticker.toUpperCase(),
//             yearlyData
//           );

//           temporalAnalysis = await Promise.race([analysisPromise, timeoutPromise]) as any;
//           console.log(`Temporal analysis completed for ${ticker}`);
//         }
//       } catch (temporalError) {
//         console.warn("Temporal analysis failed, continuing without it:", temporalError);
//         // Don't fail the whole request if temporal analysis fails
//       }

//       const validated = companySummarySchema.parse({
//         ...summary,
//         ...(temporalAnalysis ? { temporalAnalysis } : {}),
//       });

//       // Everyone gets full data - no authentication required
//       res.json(validated);
//     } catch (error: any) {
//       console.error("Analysis error:", error);

//       // Ticker not found
//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Company Not Found",
//           message: `We couldn't find "${req.params.ticker.toUpperCase()}" in our database. Double-check the ticker symbol and try again.`
//         });
//       }

//       // No 10-K filing
//       if (error.message?.includes("No 10-K")) {
//         return res.status(404).json({
//           error: "No 10-K Available",
//           message: `${req.params.ticker.toUpperCase()} doesn't have a 10-K filing available yet. This might be a newer company or one that doesn't file 10-Ks.`
//         });
//       }

//       // Business section extraction failed
//       if (error.message?.includes("business section") || error.message?.includes("business description")) {
//         return res.status(500).json({
//           error: "Filing Format Error",
//           message: "We had trouble reading this company's 10-K filing. The document format might be unusual. Please try again later or contact support."
//         });
//       }

//       // OpenAI API errors
//       if (error.status === 429) {
//         return res.status(429).json({
//           error: "Too Many Requests",
//           message: "Our AI service is experiencing high demand. Please wait a moment and try again."
//         });
//       }

//       if (error.status >= 500 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
//         return res.status(503).json({
//           error: "Service Temporarily Unavailable",
//           message: "Our analysis service is temporarily unavailable. Please try again in a few moments."
//         });
//       }

//       // SEC API errors
//       if (error.response?.status === 429) {
//         return res.status(429).json({
//           error: "Rate Limited",
//           message: "We're receiving too many requests right now. Please wait a minute and try again."
//         });
//       }

//       if (error.response?.status >= 500) {
//         return res.status(503).json({
//           error: "SEC Database Unavailable",
//           message: "The SEC's database is temporarily unavailable. This usually resolves quickly - please try again in a few minutes."
//         });
//       }

//       // Generic fallback
//       res.status(500).json({
//         error: "Analysis Failed",
//         message: "Something went wrong while analyzing this company. Please try again, and if the problem persists, let us know."
//       });
//     }
//   });

//   // Fine Print Analysis endpoint - Analyzes footnotes from latest 10-K
//   app.get("/api/analyze/:ticker/fine-print", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format. Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());

//       const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);

//       const footnotesSection = await secService.get10KFootnotesSection(cik, accessionNumber);

//       const finePrintAnalysis = await openaiService.analyzeFootnotes(
//         name,
//         ticker.toUpperCase(),
//         footnotesSection,
//         fiscalYear,
//         filingDate
//       );

//       const validated = finePrintAnalysisSchema.parse(finePrintAnalysis);

//       res.json(validated);
//     } catch (error: any) {
//       console.error("Fine print analysis error:", error);

//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Ticker not found",
//           message: `Could not find company information for ticker "${req.params.ticker}"`
//         });
//       }

//       if (error.message?.includes("No 10-K")) {
//         return res.status(404).json({
//           error: "No 10-K filing found",
//           message: "This company does not have a 10-K filing available"
//         });
//       }

//       if (error.message?.includes("Could not extract footnotes")) {
//         return res.status(404).json({
//           error: "Footnotes not found",
//           message: "Could not extract footnotes section from the 10-K filing"
//         });
//       }

//       res.status(500).json({
//         error: "Analysis failed",
//         message: "Unable to analyze footnotes. Please try again later."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // FINANCIAL METRICS (INCOME + BALANCE SHEET)
//   // --------------------------------------------------------------------------
//   app.get("/api/financials/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format",
//           message: "Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const [metrics, balanceSheet] = await Promise.all([
//         alphaVantageService.getFinancialMetrics(ticker.toUpperCase()),
//         alphaVantageService.getBalanceSheetMetrics(ticker.toUpperCase())
//       ]);

//       const validatedMetrics = incomeMetricsSchema.parse(metrics);
//       const validatedBalanceSheet = balanceSheetMetricsSchema.parse(balanceSheet);

//       const combinedResponse = {
//         ...validatedMetrics,
//         balanceSheet: validatedBalanceSheet
//       };

//       const validatedResponse = combinedFinancialMetricsSchema.parse(combinedResponse);

//       res.json(validatedResponse);
//     } catch (error: any) {
//       console.error("Financial metrics error:", error);

//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Company Not Found",
//           message: `Could not find financial data for "${req.params.ticker.toUpperCase()}".`
//         });
//       }

//       if (error.message?.includes("Insufficient")) {
//         return res.status(404).json({
//           error: "Insufficient Data",
//           message: error.message
//         });
//       }

//       if (error.message?.includes("rate limit")) {
//         return res.status(429).json({
//           error: "Rate Limited",
//           message: error.message
//         });
//       }

//       if (error.message?.includes("timed out")) {
//         return res.status(503).json({
//           error: "Service Timeout",
//           message: "Financial data service timed out."
//         });
//       }

//       return res.status(500).json({
//         error: "Data Retrieval Failed",
//         message: "Unable to retrieve financial metrics."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // LOGO PROXY (Clearbit)
//   // --------------------------------------------------------------------------
//   const logoCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
//   const LOGO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

//   app.get("/api/logo/:domain", async (req: any, res) => {
//     try {
//       let { domain } = req.params;

//       if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
//         return res.status(400).json({ error: "Invalid domain format" });
//       }

//       // Strip www. prefix - Clearbit works better with root domains
//       domain = domain.replace(/^www\./i, '');

//       const cacheKey = domain.toLowerCase();
//       const cached = logoCache.get(cacheKey);

//       // Return cached logo if fresh
//       if (cached && Date.now() - cached.timestamp < LOGO_CACHE_TTL) {
//         res.set("Content-Type", cached.contentType);
//         res.set("Cache-Control", "public, max-age=86400");
//         return res.send(cached.data);
//       }

//       // Fetch from Google's favicon service (more reliable than Clearbit)
//       const response = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
//         headers: {
//           "User-Agent": "KnowWhatYouOwn/1.0"
//         },
//         redirect: 'follow'
//       });

//       if (!response.ok) {
//         return res.status(404).json({ error: "Logo not found" });
//       }

//       const contentType = response.headers.get("content-type") || "image/png";
//       const arrayBuffer = await response.arrayBuffer();
//       const buffer = Buffer.from(arrayBuffer);

//       // Cache the result
//       logoCache.set(cacheKey, {
//         data: buffer,
//         contentType,
//         timestamp: Date.now()
//       });

//       res.set("Content-Type", contentType);
//       res.set("Cache-Control", "public, max-age=86400");
//       res.send(buffer);
//     } catch (error: any) {
//       console.error("Logo fetch error:", error.message);
//       return res.status(500).json({ error: "Failed to fetch logo" });
//     }
//   });

//   const httpServer = createServer(app);
//   return httpServer;
// }

// import type { Express } from "express";
// import { createServer, type Server } from "http";
// import { secService } from "./services/sec";
// import { openaiService } from "./services/openai";
// import { companySummarySchema, incomeMetricsSchema, balanceSheetMetricsSchema, combinedFinancialMetricsSchema, finePrintAnalysisSchema, insertWaitlistSignupSchema, insertScheduledCheckupSchema, valuationMetricsSchema, timingAnalysisSchema } from "@shared/schema";
// import { alphaVantageService } from "./services/alphavantage";
// import { storage } from "./storage";

// export async function registerRoutes(app: Express): Promise<Server> {
//   // Company search endpoint - search by company name or ticker
//   app.get("/api/search", async (req: any, res) => {
//     try {
//       const { q } = req.query;

//       if (!q || typeof q !== "string") {
//         return res.status(400).json({
//           error: "Missing search query",
//           message: "Please provide a search query using the 'q' parameter."
//         });
//       }

//       const results = await secService.searchCompanies(q, 10);
//       console.log(`Search for "${q}": ${results.length} results found`);
//       res.json(results);
//     } catch (error: any) {
//       console.error("Search error:", error);
//       res.status(500).json({
//         error: "Search failed",
//         message: "Unable to search companies. Please try again."
//       });
//     }
//   });

//   // Analysis endpoint - Public access, returns full data for everyone
//   app.get("/api/analyze/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;
//       debugger;
//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format. Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());

//       const start = performance.now();

//       const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);

//       const businessSection = await secService.get10KBusinessSection(cik, accessionNumber);

//       const summary = await openaiService.analyzeBusiness(
//         name,
//         ticker.toUpperCase(),
//         businessSection,
//         filingDate,
//         fiscalYear,
//         cik
//       );
//       const end = performance.now();
//       console.log(`getLatest10K took ${(end - start).toFixed(2)} ms`);

//       // Fetch 5 years of data for temporal analysis with timeout
//       let temporalAnalysis;
//       try {
//         const yearlyData = await secService.get5YearsBusinessSections(cik);

//         // Only run temporal analysis if we have at least 2 years of data
//         if (yearlyData.length >= 2) {
//           console.log(`Starting temporal analysis for ${ticker} with ${yearlyData.length} years of data`);

//           // Add 30 second timeout for temporal analysis
//           const timeoutPromise = new Promise((_, reject) =>
//             setTimeout(() => reject(new Error('Temporal analysis timeout')), 30000)
//           );

//           const analysisPromise = openaiService.analyzeTemporalChanges(
//             name,
//             ticker.toUpperCase(),
//             yearlyData
//           );

//           temporalAnalysis = await Promise.race([analysisPromise, timeoutPromise]) as any;
//           console.log(`Temporal analysis completed for ${ticker}`);
//         }
//       } catch (temporalError) {
//         console.warn("Temporal analysis failed, continuing without it:", temporalError);
//         // Don't fail the whole request if temporal analysis fails
//       }

//       const validated = companySummarySchema.parse({
//         ...summary,
//         ...(temporalAnalysis ? { temporalAnalysis } : {}),
//       });

//       // Everyone gets full data - no authentication required
//       res.json(validated);
//     } catch (error: any) {
//       console.error("Analysis error:", error);

//       // Ticker not found
//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Company Not Found",
//           message: `We couldn't find "${req.params.ticker.toUpperCase()}" in our database. Double-check the ticker symbol and try again.`
//         });
//       }

//       // No 10-K filing
//       if (error.message?.includes("No 10-K")) {
//         return res.status(404).json({
//           error: "No 10-K Available",
//           message: `${req.params.ticker.toUpperCase()} doesn't have a 10-K filing available yet. This might be a newer company or one that doesn't file 10-Ks.`
//         });
//       }

//       // Business section extraction failed
//       if (error.message?.includes("business section") || error.message?.includes("business description")) {
//         return res.status(500).json({
//           error: "Filing Format Error",
//           message: "We had trouble reading this company's 10-K filing. The document format might be unusual. Please try again later or contact support."
//         });
//       }

//       // OpenAI API errors
//       if (error.status === 429) {
//         return res.status(429).json({
//           error: "Too Many Requests",
//           message: "Our AI service is experiencing high demand. Please wait a moment and try again."
//         });
//       }

//       if (error.status >= 500 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
//         return res.status(503).json({
//           error: "Service Temporarily Unavailable",
//           message: "Our analysis service is temporarily unavailable. Please try again in a few moments."
//         });
//       }

//       // SEC API errors
//       if (error.response?.status === 429) {
//         return res.status(429).json({
//           error: "Rate Limited",
//           message: "We're receiving too many requests right now. Please wait a minute and try again."
//         });
//       }

//       if (error.response?.status >= 500) {
//         return res.status(503).json({
//           error: "SEC Database Unavailable",
//           message: "The SEC's database is temporarily unavailable. This usually resolves quickly - please try again in a few minutes."
//         });
//       }

//       // Generic fallback
//       res.status(500).json({
//         error: "Analysis Failed",
//         message: "Something went wrong while analyzing this company. Please try again, and if the problem persists, let us know."
//       });
//     }
//   });

//   // Fine Print Analysis endpoint - Analyzes footnotes from latest 10-K
//   app.get("/api/analyze/:ticker/fine-print", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format. Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());

//       const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);

//       const footnotesSection = await secService.get10KFootnotesSection(cik, accessionNumber);

//       const finePrintAnalysis = await openaiService.analyzeFootnotes(
//         name,
//         ticker.toUpperCase(),
//         footnotesSection,
//         fiscalYear,
//         filingDate
//       );

//       const validated = finePrintAnalysisSchema.parse(finePrintAnalysis);

//       res.json(validated);
//     } catch (error: any) {
//       console.error("Fine print analysis error:", error);

//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Ticker not found",
//           message: `Could not find company information for ticker "${req.params.ticker}"`
//         });
//       }

//       if (error.message?.includes("No 10-K")) {
//         return res.status(404).json({
//           error: "No 10-K filing found",
//           message: "This company does not have a 10-K filing available"
//         });
//       }

//       if (error.message?.includes("Could not extract footnotes")) {
//         return res.status(404).json({
//           error: "Footnotes not found",
//           message: "Could not extract footnotes section from the 10-K filing"
//         });
//       }

//       res.status(500).json({
//         error: "Analysis failed",
//         message: "Unable to analyze footnotes. Please try again later."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // FINANCIAL METRICS (INCOME + BALANCE SHEET)
//   // --------------------------------------------------------------------------
//   app.get("/api/financials/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format",
//           message: "Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const [metrics, balanceSheet] = await Promise.all([
//         alphaVantageService.getFinancialMetrics(ticker.toUpperCase()),
//         alphaVantageService.getBalanceSheetMetrics(ticker.toUpperCase())
//       ]);

//       const validatedMetrics = incomeMetricsSchema.parse(metrics);
//       const validatedBalanceSheet = balanceSheetMetricsSchema.parse(balanceSheet);

//       const combinedResponse = {
//         ...validatedMetrics,
//         balanceSheet: validatedBalanceSheet
//       };

//       const validatedResponse = combinedFinancialMetricsSchema.parse(combinedResponse);

//       res.json(validatedResponse);
//     } catch (error: any) {
//       console.error("Financial metrics error:", error);

//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Company Not Found",
//           message: `Could not find financial data for "${req.params.ticker.toUpperCase()}".`
//         });
//       }

//       if (error.message?.includes("Insufficient")) {
//         return res.status(404).json({
//           error: "Insufficient Data",
//           message: error.message
//         });
//       }

//       if (error.message?.includes("rate limit")) {
//         return res.status(429).json({
//           error: "Rate Limited",
//           message: error.message
//         });
//       }

//       if (error.message?.includes("timed out")) {
//         return res.status(503).json({
//           error: "Service Timeout",
//           message: "Financial data service timed out."
//         });
//       }

//       return res.status(500).json({
//         error: "Data Retrieval Failed",
//         message: "Unable to retrieve financial metrics."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // VALUATION METRICS (Magic Formula)
//   // --------------------------------------------------------------------------
//   app.get("/api/valuation/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format",
//           message: "Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const metrics = await alphaVantageService.getValuationMetrics(ticker.toUpperCase());
//       const validatedMetrics = valuationMetricsSchema.parse(metrics);

//       res.json(validatedMetrics);
//     } catch (error: any) {
//       console.error("Valuation metrics error:", error);

//       if (error.message?.includes("not found")) {
//         return res.status(404).json({
//           error: "Company Not Found",
//           message: `Could not find valuation data for "${req.params.ticker.toUpperCase()}".`
//         });
//       }

//       if (error.message?.includes("Insufficient") || error.message?.includes("No income") || error.message?.includes("No balance")) {
//         return res.status(404).json({
//           error: "Insufficient Data",
//           message: error.message
//         });
//       }

//       if (error.message?.includes("rate limit") || error.message?.includes("Try again")) {
//         return res.status(429).json({
//           error: "Rate Limited",
//           message: "Too many requests. Please wait a minute and try again."
//         });
//       }

//       if (error.message?.includes("temporarily unavailable") || error.message?.includes("Unable to retrieve")) {
//         return res.status(503).json({
//           error: "Service Unavailable",
//           message: "The data service is temporarily unavailable. Please try again shortly."
//         });
//       }

//       if (error.message?.includes("timed out")) {
//         return res.status(503).json({
//           error: "Service Timeout",
//           message: "Valuation data service timed out."
//         });
//       }

//       return res.status(500).json({
//         error: "Data Retrieval Failed",
//         message: "Unable to retrieve valuation metrics."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // TIMING ANALYSIS (Technical Signals)
//   // --------------------------------------------------------------------------
//   app.get("/api/timing/:ticker", async (req: any, res) => {
//   try {
//     const { ticker } = req.params;
//     const timeframe = (req.query.timeframe === "daily") ? "daily" : "weekly";

//     if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//       return res.status(400).json({
//         error: "Invalid ticker format",
//         message: "Please provide 1-5 letter ticker symbol."
//       });
//     }

//     const analysis = await alphaVantageService.getTimingAnalysis(
//       ticker.toUpperCase(),
//       timeframe
//     );

//     console.log("RAW TIMING RESPONSE:", JSON.stringify(analysis, null, 2));

//     const validated = timingAnalysisSchema.parse(analysis);

//     return res.json(validated);

//   } catch (error: any) {
//     console.error("Timing analysis error:", error);

//     if (error.message?.includes("not found")) {
//       return res.status(404).json({
//         error: "Company Not Found",
//         message: `Could not find market data for "${req.params.ticker.toUpperCase()}".`
//       });
//     }

//     if (error.message?.includes("Insufficient")) {
//       return res.status(404).json({
//         error: "Insufficient Data",
//         message: "Not enough historical data to analyze market conditions."
//       });
//     }

//     if (error.message?.includes("rate limit") || error.message?.includes("Try again")) {
//       return res.status(429).json({
//         error: "Rate Limited",
//         message: "Too many requests. Please wait a moment and try again."
//       });
//     }

//     if (error.message?.includes("timed out")) {
//       return res.status(503).json({
//         error: "Service Timeout",
//         message: "Market data service timed out."
//       });
//     }

//     return res.status(500).json({
//       error: "Analysis Failed",
//       message: "Unable to analyze timing conditions. Please try again."
//     });
//   }
// });

//   // --------------------------------------------------------------------------
//   // LOGO PROXY (Clearbit)
//   // --------------------------------------------------------------------------
//   const logoCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
//   const LOGO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

//   app.get("/api/logo/:domain", async (req: any, res) => {
//     try {
//       let { domain } = req.params;

//       if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
//         return res.status(400).json({ error: "Invalid domain format" });
//       }

//       // Strip www. prefix - Clearbit works better with root domains
//       domain = domain.replace(/^www\./i, '');

//       const cacheKey = domain.toLowerCase();
//       const cached = logoCache.get(cacheKey);

//       // Return cached logo if fresh
//       if (cached && Date.now() - cached.timestamp < LOGO_CACHE_TTL) {
//         res.set("Content-Type", cached.contentType);
//         res.set("Cache-Control", "public, max-age=86400");
//         return res.send(cached.data);
//       }

//       // Fetch from Google's favicon service (more reliable than Clearbit)
//       const response = await fetch(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`, {
//         headers: {
//           "User-Agent": "KnowWhatYouOwn/1.0"
//         },
//         redirect: 'follow'
//       });

//       if (!response.ok) {
//         return res.status(404).json({ error: "Logo not found" });
//       }

//       const contentType = response.headers.get("content-type") || "image/png";
//       const arrayBuffer = await response.arrayBuffer();
//       const buffer = Buffer.from(arrayBuffer);

//       // Cache the result
//       logoCache.set(cacheKey, {
//         data: buffer,
//         contentType,
//         timestamp: Date.now()
//       });

//       res.set("Content-Type", contentType);
//       res.set("Cache-Control", "public, max-age=86400");
//       res.send(buffer);
//     } catch (error: any) {
//       console.error("Logo fetch error:", error.message);
//       return res.status(500).json({ error: "Failed to fetch logo" });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // WAITLIST SIGNUP
//   // --------------------------------------------------------------------------
//   app.post("/api/waitlist", async (req: any, res) => {
//     try {
//       const validatedData = insertWaitlistSignupSchema.parse(req.body);

//       const signup = await storage.createWaitlistSignup(validatedData);

//       console.log(`Waitlist signup: ${validatedData.email} for "${validatedData.stageName}"`);

//       res.status(201).json({
//         success: true,
//         message: "You're on the list! We'll notify you when this feature launches.",
//         id: signup.id
//       });
//     } catch (error: any) {
//       console.error("Waitlist signup error:", error);

//       if (error.name === "ZodError") {
//         return res.status(400).json({
//           error: "Invalid input",
//           message: error.errors[0]?.message || "Please check your email address."
//         });
//       }

//       res.status(500).json({
//         error: "Signup failed",
//         message: "Something went wrong. Please try again."
//       });
//     }
//   });

//   // Get all waitlist signups (for admin/marketing use)
//   app.get("/api/waitlist", async (req: any, res) => {
//     try {
//       const signups = await storage.getWaitlistSignups();
//       res.json(signups);
//     } catch (error: any) {
//       console.error("Error fetching waitlist:", error);
//       res.status(500).json({
//         error: "Failed to fetch waitlist",
//         message: "Could not retrieve waitlist data."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // SCHEDULED CHECKUP EMAILS
//   // --------------------------------------------------------------------------
//   app.post("/api/scheduled-checkups", async (req: any, res) => {
//     try {
//       const validated = insertScheduledCheckupSchema.parse(req.body);
//       const checkup = await storage.createScheduledCheckup(validated);
//       console.log(`Scheduled checkup created for ${validated.ticker} (${validated.email})`);
//       res.status(201).json(checkup);
//     } catch (error: any) {
//       console.error("Scheduled checkup error:", error);
//       if (error.name === "ZodError") {
//         return res.status(400).json({
//           error: "Validation Error",
//           message: error.errors?.[0]?.message || "Invalid request data."
//         });
//       }
//       res.status(500).json({
//         error: "Failed to create checkup",
//         message: "Could not save your reminder. Please try again."
//       });
//     }
//   });

//   app.get("/api/scheduled-checkups", async (req: any, res) => {
//     try {
//       const checkups = await storage.getScheduledCheckups();
//       res.json(checkups);
//     } catch (error: any) {
//       console.error("Error fetching scheduled checkups:", error);
//       res.status(500).json({
//         error: "Failed to fetch checkups",
//         message: "Could not retrieve scheduled checkups."
//       });
//     }
//   });

//   // --------------------------------------------------------------------------
//   // EARNINGS CALENDAR (Finnhub)
//   // --------------------------------------------------------------------------
//   app.get("/api/earnings/:ticker", async (req: any, res) => {
//     try {
//       const { ticker } = req.params;

//       if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
//         return res.status(400).json({
//           error: "Invalid ticker format",
//           message: "Please provide 1-5 letter ticker symbol."
//         });
//       }

//       const apiKey = process.env.FINNHUB_API_KEY;
//       if (!apiKey) {
//         return res.status(503).json({
//           error: "Earnings data unavailable",
//           message: "Earnings calendar service is not configured."
//         });
//       }

//       const today = new Date();
//       const futureDate = new Date(today);
//       futureDate.setMonth(futureDate.getMonth() + 6);

//       const fromDate = today.toISOString().split('T')[0];
//       const toDate = futureDate.toISOString().split('T')[0];

//       const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${apiKey}`;

//       const response = await fetch(url, {
//         headers: { "User-Agent": "KnowWhatYouOwn/1.0" }
//       });

//       if (!response.ok) {
//         if (response.status === 429) {
//           return res.status(429).json({
//             error: "Rate limited",
//             message: "Too many requests to earnings API. Please try again later."
//           });
//         }
//         throw new Error(`Finnhub API error: ${response.status}`);
//       }

//       const data = await response.json();

//       const earningsCalendar = data.earningsCalendar || [];
//       const upcomingEarnings = earningsCalendar
//         .filter((e: any) => new Date(e.date) >= today)
//         .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

//       if (upcomingEarnings.length === 0) {
//         return res.json({
//           ticker: ticker.toUpperCase(),
//           nextEarningsDate: null,
//           hour: null,
//           message: "No upcoming earnings date found"
//         });
//       }

//       const next = upcomingEarnings[0];
//       res.json({
//         ticker: ticker.toUpperCase(),
//         nextEarningsDate: next.date,
//         hour: next.hour || null,
//         epsEstimate: next.epsEstimate,
//         revenueEstimate: next.revenueEstimate
//       });
//     } catch (error: any) {
//       console.error("Earnings fetch error:", error);
//       res.status(500).json({
//         error: "Earnings lookup failed",
//         message: "Unable to fetch earnings date. Please try again later."
//       });
//     }
//   });

//   const httpServer = createServer(app);
//   return httpServer;
// }

import type { Express } from "express";
import { createServer, type Server } from "http";
import { secService } from "./services/sec";
import { openaiService } from "./services/openai";
import {
  companySummarySchema,
  incomeMetricsSchema,
  balanceSheetMetricsSchema,
  combinedFinancialMetricsSchema,
  finePrintAnalysisSchema,
  insertWaitlistSignupSchema,
  insertScheduledCheckupSchema,
  valuationMetricsSchema,
  timingAnalysisSchema,
} from "@shared/schema";

import { alphaVantageService } from "./services/alphavantage";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // --------------------------------------------------------------------------
  // COMPANY SEARCH
  // --------------------------------------------------------------------------
  app.get("/api/search", async (req: any, res) => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({
          error: "Missing search query",
          message: "Please provide a search query using the 'q' parameter.",
        });
      }

      const results = await secService.searchCompanies(q, 10);
      console.log(`Search for "${q}": ${results.length} results found`);
      res.json(results);
    } catch (error: any) {
      console.error("Search error:", error);
      res.status(500).json({
        error: "Search failed",
        message: "Unable to search companies. Please try again.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // ANALYZE ENDPOINT
  // --------------------------------------------------------------------------
  app.get("/api/analyze/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error:
            "Invalid ticker format. Please provide 1-5 letter ticker symbol.",
        });
      }

      const { cik, name } = await secService.getCompanyInfo(
        ticker.toUpperCase(),
      );

      const start = performance.now();
      const { accessionNumber, filingDate, fiscalYear } =
        await secService.getLatest10K(cik);

      const businessSection = await secService.get10KBusinessSection(
        cik,
        accessionNumber,
      );

      const summary = await openaiService.analyzeBusiness(
        name,
        ticker.toUpperCase(),
        businessSection,
        filingDate,
        fiscalYear,
        cik,
      );

      const end = performance.now();
      console.log(`getLatest10K took ${(end - start).toFixed(2)} ms`);

      // Fetch 5 years of data for temporal analysis with timeout
      let temporalAnalysis;
      try {
        const yearlyData = await secService.get5YearsBusinessSections(cik);

        if (yearlyData.length >= 2) {
          console.log(
            `Starting temporal analysis for ${ticker} with ${yearlyData.length} years of data`,
          );

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Temporal analysis timeout")),
              30000,
            ),
          );

          const analysisPromise = openaiService.analyzeTemporalChanges(
            name,
            ticker.toUpperCase(),
            yearlyData,
          );

          temporalAnalysis = (await Promise.race([
            analysisPromise,
            timeoutPromise,
          ])) as any;
          console.log(`Temporal analysis completed for ${ticker}`);
        }
      } catch (temporalError) {
        console.warn(
          "Temporal analysis failed, continuing without it:",
          temporalError,
        );
      }

      const validated = companySummarySchema.parse({
        ...summary,
        ...(temporalAnalysis ? { temporalAnalysis } : {}),
      });

      res.json(validated);
    } catch (error: any) {
      console.error("Analysis error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `We couldn't find "${req.params.ticker.toUpperCase()}" in our database. Double-check the ticker symbol and try again.`,
        });
      }

      if (error.message?.includes("No 10-K")) {
        return res.status(404).json({
          error: "No 10-K Available",
          message: `${req.params.ticker.toUpperCase()} doesn't have a 10-K filing available yet.`,
        });
      }

      if (
        error.message?.includes("business section") ||
        error.message?.includes("business description")
      ) {
        return res.status(500).json({
          error: "Filing Format Error",
          message: "We had trouble reading this company's 10-K filing.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          error: "Too Many Requests",
          message:
            "Our AI service is experiencing high demand. Please wait a moment and try again.",
        });
      }

      if (
        error.status >= 500 ||
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT"
      ) {
        return res.status(503).json({
          error: "Service Temporarily Unavailable",
          message:
            "Our analysis service is temporarily unavailable. Please try again in a few moments.",
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          error: "Rate Limited",
          message:
            "We're receiving too many requests right now. Please wait a minute and try again.",
        });
      }

      if (error.response?.status >= 500) {
        return res.status(503).json({
          error: "SEC Database Unavailable",
          message: "The SEC's database is temporarily unavailable.",
        });
      }

      res.status(500).json({
        error: "Analysis Failed",
        message:
          "Something went wrong while analyzing this company. Please try again.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // FINE PRINT ANALYSIS
  // --------------------------------------------------------------------------
  app.get("/api/analyze/:ticker/fine-print", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error:
            "Invalid ticker format. Please provide 1-5 letter ticker symbol.",
        });
      }

      const { cik, name } = await secService.getCompanyInfo(
        ticker.toUpperCase(),
      );
      const { accessionNumber, filingDate, fiscalYear } =
        await secService.getLatest10K(cik);

      const footnotesSection = await secService.get10KFootnotesSection(
        cik,
        accessionNumber,
      );

      const finePrintAnalysis = await openaiService.analyzeFootnotes(
        name,
        ticker.toUpperCase(),
        footnotesSection,
        fiscalYear,
        filingDate,
      );

      const validated = finePrintAnalysisSchema.parse(finePrintAnalysis);

      res.json(validated);
    } catch (error: any) {
      console.error("Fine print analysis error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Ticker not found",
          message: `Could not find company information for ticker "${req.params.ticker}"`,
        });
      }

      if (error.message?.includes("No 10-K")) {
        return res.status(404).json({
          error: "No 10-K filing found",
          message: "This company does not have a 10-K filing available",
        });
      }

      if (error.message?.includes("Could not extract footnotes")) {
        return res.status(404).json({
          error: "Footnotes not found",
          message: "Could not extract footnotes section from the 10-K filing",
        });
      }

      res.status(500).json({
        error: "Analysis failed",
        message: "Unable to analyze footnotes. Please try again later.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // FINANCIAL METRICS
  // --------------------------------------------------------------------------
  app.get("/api/financials/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const [metrics, balanceSheet] = await Promise.all([
        alphaVantageService.getFinancialMetrics(ticker.toUpperCase()),
        alphaVantageService.getBalanceSheetMetrics(ticker.toUpperCase()),
      ]);

      const validatedMetrics = incomeMetricsSchema.parse(metrics);
      const validatedBalanceSheet =
        balanceSheetMetricsSchema.parse(balanceSheet);

      const combinedResponse = {
        ...validatedMetrics,
        balanceSheet: validatedBalanceSheet,
      };

      const validatedResponse =
        combinedFinancialMetricsSchema.parse(combinedResponse);

      res.json(validatedResponse);
    } catch (error: any) {
      console.error("Financial metrics error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find financial data for "${req.params.ticker.toUpperCase()}".`,
        });
      }

      if (error.message?.includes("Insufficient")) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: error.message,
        });
      }

      if (error.message?.includes("rate limit")) {
        return res.status(429).json({
          error: "Rate Limited",
          message: error.message,
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Financial data service timed out.",
        });
      }

      return res.status(500).json({
        error: "Data Retrieval Failed",
        message: "Unable to retrieve financial metrics.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // VALUATION METRICS
  // --------------------------------------------------------------------------
  app.get("/api/valuation/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const metrics = await alphaVantageService.getValuationMetrics(
        ticker.toUpperCase(),
      );
      const validatedMetrics = valuationMetricsSchema.parse(metrics);

      res.json(validatedMetrics);
    } catch (error: any) {
      console.error("Valuation metrics error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find valuation data for "${req.params.ticker.toUpperCase()}".`,
        });
      }

      if (
        error.message?.includes("Insufficient") ||
        error.message?.includes("No income") ||
        error.message?.includes("No balance")
      ) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: error.message,
        });
      }

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("Try again")
      ) {
        return res.status(429).json({
          error: "Rate Limited",
          message: "Too many requests. Please wait a minute and try again.",
        });
      }

      if (
        error.message?.includes("temporarily unavailable") ||
        error.message?.includes("Unable to retrieve")
      ) {
        return res.status(503).json({
          error: "Service Unavailable",
          message:
            "The data service is temporarily unavailable. Please try again shortly.",
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Valuation data service timed out.",
        });
      }

      return res.status(500).json({
        error: "Data Retrieval Failed",
        message: "Unable to retrieve valuation metrics.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // TIMING ANALYSIS
  // --------------------------------------------------------------------------
  app.get("/api/timing/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      const timeframe = req.query.timeframe === "daily" ? "daily" : "weekly";

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const analysis = await alphaVantageService.getTimingAnalysis(
        ticker.toUpperCase(),
        timeframe,
      );

      console.log("RAW TIMING RESPONSE:", JSON.stringify(analysis, null, 2));

      const validated = timingAnalysisSchema.parse(analysis);

      return res.json(validated);
    } catch (error: any) {
      console.error("Timing analysis error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find market data for "${req.params.ticker.toUpperCase()}".`,
        });
      }

      if (error.message?.includes("Insufficient")) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: "Not enough historical data to analyze market conditions.",
        });
      }

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("Try again")
      ) {
        return res.status(429).json({
          error: "Rate Limited",
          message: "Too many requests. Please wait a moment and try again.",
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Market data service timed out.",
        });
      }

      return res.status(500).json({
        error: "Analysis Failed",
        message: "Unable to analyze timing conditions. Please try again.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // LOGO PROXY
  // --------------------------------------------------------------------------
  const logoCache = new Map<
    string,
    { data: Buffer; contentType: string; timestamp: number }
  >();
  const LOGO_CACHE_TTL = 24 * 60 * 60 * 1000;

  app.get("/api/logo/:domain", async (req: any, res) => {
    try {
      let { domain } = req.params;

      if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
        return res.status(400).json({ error: "Invalid domain format" });
      }

      domain = domain.replace(/^www\./i, "");

      const cacheKey = domain.toLowerCase();
      const cached = logoCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < LOGO_CACHE_TTL) {
        res.set("Content-Type", cached.contentType);
        res.set("Cache-Control", "public, max-age=86400");
        return res.send(cached.data);
      }

      const response = await fetch(
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        {
          headers: { "User-Agent": "KnowWhatYouOwn/1.0" },
          redirect: "follow",
        },
      );

      if (!response.ok) {
        return res.status(404).json({ error: "Logo not found" });
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      logoCache.set(cacheKey, {
        data: buffer,
        contentType,
        timestamp: Date.now(),
      });

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error: any) {
      console.error("Logo fetch error:", error.message);
      return res.status(500).json({ error: "Failed to fetch logo" });
    }
  });

  // --------------------------------------------------------------------------
  // WAITLIST SIGNUP (FIXED stageName ERROR)
  // --------------------------------------------------------------------------
  app.post("/api/waitlist", async (req: any, res) => {
    try {
      const validatedData = insertWaitlistSignupSchema.parse(req.body);

      const signup = await storage.createWaitlistSignup(validatedData);

      // FIX: stageName might not exist in schema
      console.log(
        `Waitlist signup: ${validatedData.email} for "${(validatedData as any).stageName ?? "N/A"}"`,
      );

      res.status(201).json({
        success: true,
        message:
          "You're on the list! We'll notify you when this feature launches.",
        id: signup.id,
      });
    } catch (error: any) {
      console.error("Waitlist signup error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid input",
          message:
            error.errors[0]?.message || "Please check your email address.",
        });
      }

      res.status(500).json({
        error: "Signup failed",
        message: "Something went wrong. Please try again.",
      });
    }
  });

  app.get("/api/waitlist", async (req: any, res) => {
    try {
      const signups = await storage.getWaitlistSignups();
      res.json(signups);
    } catch (error: any) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({
        error: "Failed to fetch waitlist",
        message: "Could not retrieve waitlist data.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // SCHEDULED CHECKUP EMAILS
  // --------------------------------------------------------------------------
  app.post("/api/scheduled-checkups", async (req: any, res) => {
    try {
      const validated = insertScheduledCheckupSchema.parse(req.body);
      const checkup = await storage.createScheduledCheckup(validated);

      console.log(
        `Scheduled checkup created for ${validated.ticker} (${validated.email})`,
      );

      res.status(201).json(checkup);
    } catch (error: any) {
      console.error("Scheduled checkup error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.errors?.[0]?.message || "Invalid request data.",
        });
      }

      res.status(500).json({
        error: "Failed to create checkup",
        message: "Could not save your reminder. Please try again.",
      });
    }
  });

  app.get("/api/scheduled-checkups", async (req: any, res) => {
    try {
      const checkups = await storage.getScheduledCheckups();
      res.json(checkups);
    } catch (error: any) {
      console.error("Error fetching scheduled checkups:", error);
      res.status(500).json({
        error: "Failed to fetch checkups",
        message: "Could not retrieve scheduled checkups.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // EARNINGS CALENDAR (Finnhub)
  // --------------------------------------------------------------------------
  app.get("/api/earnings/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "Earnings data unavailable",
          message: "Earnings calendar service is not configured.",
        });
      }

      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + 6);

      const fromDate = today.toISOString().split("T")[0];
      const toDate = futureDate.toISOString().split("T")[0];

      const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${apiKey}`;

      const response = await fetch(url, {
        headers: { "User-Agent": "KnowWhatYouOwn/1.0" },
      });

      if (!response.ok) {
        if (response.status === 429) {
          return res.status(429).json({
            error: "Rate limited",
            message:
              "Too many requests to earnings API. Please try again later.",
          });
        }
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();

      const earningsCalendar = data.earningsCalendar || [];
      const upcomingEarnings = earningsCalendar
        .filter((e: any) => new Date(e.date) >= today)
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      if (upcomingEarnings.length === 0) {
        return res.json({
          ticker: ticker.toUpperCase(),
          nextEarningsDate: null,
          hour: null,
          message: "No upcoming earnings date found",
        });
      }

      const next = upcomingEarnings[0];

      res.json({
        ticker: ticker.toUpperCase(),
        nextEarningsDate: next.date,
        hour: next.hour || null,
        epsEstimate: next.epsEstimate,
        revenueEstimate: next.revenueEstimate,
      });
    } catch (error: any) {
      console.error("Earnings fetch error:", error);

      res.status(500).json({
        error: "Earnings lookup failed",
        message: "Unable to fetch earnings date. Please try again later.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // VALUATION METRICS (Magic Formula)
  // --------------------------------------------------------------------------
  app.get("/api/valuation/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const metrics = await alphaVantageService.getValuationMetrics(
        ticker.toUpperCase(),
      );
      const validatedMetrics = valuationMetricsSchema.parse(metrics);

      res.json(validatedMetrics);
    } catch (error: any) {
      console.error("Valuation metrics error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find valuation data for "${req.params.ticker.toUpperCase()}".`,
        });
      }

      if (
        error.message?.includes("Insufficient") ||
        error.message?.includes("No income") ||
        error.message?.includes("No balance")
      ) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: error.message,
        });
      }

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("Try again")
      ) {
        return res.status(429).json({
          error: "Rate Limited",
          message: "Too many requests. Please wait a minute and try again.",
        });
      }

      if (
        error.message?.includes("temporarily unavailable") ||
        error.message?.includes("Unable to retrieve")
      ) {
        return res.status(503).json({
          error: "Service Unavailable",
          message:
            "The data service is temporarily unavailable. Please try again shortly.",
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Valuation data service timed out.",
        });
      }

      return res.status(500).json({
        error: "Data Retrieval Failed",
        message: "Unable to retrieve valuation metrics.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // TIMING ANALYSIS (Technical Signals)
  // --------------------------------------------------------------------------
  app.get("/api/timing/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      const timeframe = req.query.timeframe === "daily" ? "daily" : "weekly"; // default to weekly

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const analysis = await alphaVantageService.getTimingAnalysis(
        ticker.toUpperCase(),
        timeframe,
      );
      const validated = timingAnalysisSchema.parse(analysis);

      res.json(validated);
    } catch (error: any) {
      console.error("Timing analysis error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find market data for "${req.params.ticker.toUpperCase()}".`,
        });
      }

      if (error.message?.includes("Insufficient")) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: "Not enough historical data to analyze market conditions.",
        });
      }

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("Try again")
      ) {
        return res.status(429).json({
          error: "Rate Limited",
          message: "Too many requests. Please wait a moment and try again.",
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Market data service timed out.",
        });
      }

      return res.status(500).json({
        error: "Analysis Failed",
        message: "Unable to analyze timing conditions. Please try again.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // WAITLIST SIGNUP
  // --------------------------------------------------------------------------
  app.post("/api/waitlist", async (req: any, res) => {
    try {
      const validatedData = insertWaitlistSignupSchema.parse(req.body);
  const isNewLead = await storage.isEmailNew(validatedData.email);
  const signup = await storage.createWaitlistSignup(validatedData);

  console.log(
    `Waitlist signup: ${validatedData.email} for "${validatedData.stageName}" (isNewLead: ${isNewLead})`,
  );

  res.status(201).json({
    success: true,
    message: "You're on the list! We'll notify you when this feature launches.",
    id: signup.id,
    isNewLead,

      });
    } catch (error: any) {
      console.error("Waitlist signup error:", error);

      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid input",
          message:
            error.errors[0]?.message || "Please check your email address.",
        });
      }

      res.status(500).json({
        error: "Signup failed",
        message: "Something went wrong. Please try again.",
      });
    }
  });

  // Get all waitlist signups (for admin/marketing use)
  app.get("/api/waitlist", async (req: any, res) => {
    try {
      const signups = await storage.getWaitlistSignups();
      res.json(signups);
    } catch (error: any) {
      console.error("Error fetching waitlist:", error);
      res.status(500).json({
        error: "Failed to fetch waitlist",
        message: "Could not retrieve waitlist data.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // SCHEDULED CHECKUP EMAILS
  // --------------------------------------------------------------------------
  app.post("/api/scheduled-checkups", async (req: any, res) => {
    try {
      const validated = insertScheduledCheckupSchema.parse(req.body);
      const isNewLead = await storage.isEmailNew(validated.email);
      const checkup = await storage.createScheduledCheckup(validated);
  console.log(
    `Scheduled checkup created for ${validated.ticker} (${validated.email}) (isNewLead: ${isNewLead})`,
  );
  res.status(201).json({ ...checkup, isNewLead });

    } catch (error: any) {
      console.error("Scheduled checkup error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation Error",
          message: error.errors?.[0]?.message || "Invalid request data.",
        });
      }
      res.status(500).json({
        error: "Failed to create checkup",
        message: "Could not save your reminder. Please try again.",
      });
    }
  });

  app.get("/api/scheduled-checkups", async (req: any, res) => {
    try {
      const checkups = await storage.getScheduledCheckups();
      res.json(checkups);
    } catch (error: any) {
      console.error("Error fetching scheduled checkups:", error);
      res.status(500).json({
        error: "Failed to fetch checkups",
        message: "Could not retrieve scheduled checkups.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // EARNINGS CALENDAR (Finnhub)
  // --------------------------------------------------------------------------
  app.get("/api/earnings/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol.",
        });
      }

      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "Earnings data unavailable",
          message: "Earnings calendar service is not configured.",
        });
      }

      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + 6);

      const fromDate = today.toISOString().split("T")[0];
      const toDate = futureDate.toISOString().split("T")[0];

      const url = `https://finnhub.io/api/v1/calendar/earnings?symbol=${ticker.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${apiKey}`;

      const response = await fetch(url, {
        headers: { "User-Agent": "KnowWhatYouOwn/1.0" },
      });

      if (!response.ok) {
        if (response.status === 429) {
          return res.status(429).json({
            error: "Rate limited",
            message:
              "Too many requests to earnings API. Please try again later.",
          });
        }
        throw new Error(`Finnhub API error: ${response.status}`);
      }

      const data = await response.json();

      const earningsCalendar = data.earningsCalendar || [];
      const upcomingEarnings = earningsCalendar
        .filter((e: any) => new Date(e.date) >= today)
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

      if (upcomingEarnings.length === 0) {
        return res.json({
          ticker: ticker.toUpperCase(),
          nextEarningsDate: null,
          hour: null,
          message: "No upcoming earnings date found",
        });
      }

      const next = upcomingEarnings[0];
      res.json({
        ticker: ticker.toUpperCase(),
        nextEarningsDate: next.date,
        hour: next.hour || null,
        epsEstimate: next.epsEstimate,
        revenueEstimate: next.revenueEstimate,
      });
    } catch (error: any) {
      console.error("Earnings fetch error:", error);
      res.status(500).json({
        error: "Earnings lookup failed",
        message: "Unable to fetch earnings date. Please try again later.",
      });
    }
  });

  // Lead capture endpoints - saves to waitlist_signups database table
  app.post("/api/lead", async (req: any, res) => {
    try {
  const validated = leadSchema.parse(req.body);

  const stageName = validated.ticker
    ? `Popup - ${validated.ticker}`
    : `Popup - ${validated.path || "unknown"}`;

  const isNewLead = await storage.isEmailNew(validated.email);

  const signup = await storage.createWaitlistSignup({
    email: validated.email,
    stageName,
  });

  console.log(
    `Lead captured to DB: ${validated.email} (${stageName}) (isNewLead: ${isNewLead})`,
  );
  res.json({ success: true, id: signup.id, isNewLead });

    } catch (error: any) {
      console.error("Lead capture error:", error);
      res.status(400).json({
        error: "Invalid lead data",
        message: error.message || "Please provide valid lead information.",
      });
    }
  });

  app.get("/api/leads", async (_req: any, res) => {
    try {
      const signups = await storage.getWaitlistSignups();
      res.json(signups);
    } catch (error: any) {
      console.error("Get leads error:", error);
      res.status(500).json({
        error: "Failed to retrieve leads",
        message: "Unable to fetch leads. Please try again.",
      });
    }
  });

  const strategyEmailSchema = z.object({
    email: z.string().email(),
    plan: z.object({
      ticker: z.string().min(1).max(10).regex(/^[A-Za-z0-9.\-]+$/),
      companyName: z.string().max(200).optional(),
      convictionValue: z.number().min(0).max(100),
      convictionLabel: z.string().max(50),
      trancheCount: z.number().min(1).max(10),
      totalAmount: z.number().min(0),
      tranches: z.array(z.object({
        index: z.number(),
        amount: z.number().min(0),
        when: z.any().optional(),
        trigger: z.string().optional(),
        gate: z.object({ type: z.string() }).optional(),
        gateEnabled: z.boolean().optional(),
        manual: z.boolean().optional(),
      })).min(1).max(10),
      imWrongIf: z.string().max(2000).default(""),
      snapshot: z.object({
        fundamentals: z.string().max(500),
        valuation: z.string().max(500),
        timing: z.string().max(500),
      }),
      takeawayTexts: z.object({
        performance: z.string().max(1000),
        valuation: z.string().max(1000),
        timing: z.string().max(1000),
      }).optional(),
      createdAt: z.string(),
    }),
  });

  app.post("/api/strategy-email", async (req: any, res) => {
    try {
      console.log("[strategy-email] Request received");
      const parsed = strategyEmailSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error("[strategy-email] Validation failed:", JSON.stringify(parsed.error.issues));
        return res.status(400).json({
          error: "Invalid request",
          message: "Please provide valid email and plan data.",
          issues: parsed.error.issues,
          });
          }

          const { email, plan } = parsed.data;

      const { email, plan } = parsed.data;
      console.log(`[strategy-email] Validated. Sending to ${email} for ${plan.ticker}`);

      const apiKey = process.env.replit_email_resend;
      if (!apiKey) {
        console.error("[strategy-email] No Resend API key found (replit_email_resend secret is missing)");
        return res.status(500).json({
          error: "Email service not configured",
          message: "Email sending is not set up. Please contact support.",
        });
      }
      console.log(`[strategy-email] API key found, length: ${apiKey.length}, starts with: ${apiKey.substring(0, 5)}...`);

      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const { renderStrategyEmail } = await import("./emailTemplate");

  const baseUrl =
    process.env.PUBLIC_APP_URL ||
    (process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : null) ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : null) ||
    "http://localhost:5000";

  const ticker = plan.ticker;
  const analysisUrl = `${baseUrl}/app?ticker=${encodeURIComponent(ticker)}`;
  const strategyUrl = `${baseUrl}/app?ticker=${encodeURIComponent(ticker)}&stage=5`;

  const htmlContent = renderStrategyEmail(plan, { analysisUrl, strategyUrl });

      const htmlContent = renderStrategyEmail(plan, { analysisUrl, strategyUrl });
      console.log(`[strategy-email] HTML rendered, length: ${htmlContent.length}`);

      console.log(`[strategy-email] Calling Resend API...`);
      const { data, error } = await resend.emails.send({
        from: "restnvest <product@restnvest.com>",
        to: email,
        subject: `Your ${ticker} Strategy Plan`,
        html: htmlContent,
      });

      if (error) {
        console.error("[strategy-email] Resend API error:", JSON.stringify(error));
        return res.status(500).json({
          error: "Failed to send email",
          message: "Unable to send email. Please try again.",
        });
      }

      let isNewLead = false;
      try {
        isNewLead = await storage.isEmailNew(email);
        await storage.createWaitlistSignup({
          email,
          stageName: `Strategy Plan: ${plan.ticker}`,
        });
      } catch (dbError) {
        console.warn("[strategy-email] Failed to store email in DB, continuing:", dbError);
      }

  console.log(
    `[strategy-email] Email sent successfully to ${email} for ${plan.ticker}, ID: ${data?.id} (isNewLead: ${isNewLead})`,
  );
  res.json({ success: true, emailId: data?.id, isNewLead });

    } catch (error: any) {
      console.error("Strategy email error:", error);
      res.status(500).json({
        error: "Failed to send email",
        message: "Unable to send strategy email. Please try again.",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
