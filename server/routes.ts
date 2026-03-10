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
  insertWatchlistItemSchema,
  valuationMetricsSchema,
  timingAnalysisSchema,
  leadSchema,
} from "@shared/schema";

import { alphaVantageService } from "./services/alphavantage";
import { storage } from "./storage";
import { isAuthenticated } from "./firebaseAuth";
import { makeCacheKey } from "./utils/cacheKey";
import { z } from "zod";
import {
  getBusinessByCacheKey,
  insertBusinessAnalysis,
  getLatestCompanyInfoByTicker,
  getLatestBusinessByTicker,
} from "./repositories/businessAnalysis.repo";
import {
  getFootnotesByCacheKey,
  saveFootnotesAnalysis,
} from "./repositories/footnotesAnalysis.repo";

function stripLegalSuffix(name: string): string {
  return name
    .replace(
      /,?\s+(Incorporated|Corporation|Limited|Inc\.?|Corp\.?|Ltd\.?|Co\.?|LLC|L\.L\.C\.?|N\.V\.?|S\.A\.S\.?|S\.A\.?|PLC|P\.L\.C\.?|AG|SE|GmbH|B\.V\.?|Pty\.?\s+Ltd\.?)\.?$/i,
      ""
    )
    .trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // --------------------------------------------------------------------------
  // /app?ticker=X redirect → /stocks/X  (301 permanent)
  // Keeps existing bookmarks, shared links, and hardcoded /app?ticker= references working.
  // Only redirects when a valid ticker param is present; /app alone falls through normally.
  // --------------------------------------------------------------------------
  app.get("/app", (req, res, next) => {
    const ticker = (req.query.ticker as string | undefined)?.toUpperCase().trim();
    if (ticker && /^[A-Z]{1,10}$/.test(ticker)) {
      const stage = req.query.stage as string | undefined;
      const dest = stage ? `/stocks/${ticker}?stage=${stage}` : `/stocks/${ticker}`;
      return res.redirect(301, dest);
    }
    return next();
  });

  // --------------------------------------------------------------------------
  // /stocks/:ticker — SSR meta tag injection for social/SEO
  // Injects ticker-specific meta tags into index.html for SEO and social previews.
  // Works in both development (reads client/index.html) and production (reads public/index.html).
  // --------------------------------------------------------------------------
  app.get("/stocks/:ticker", async (req, res, next) => {
    try {
      const ticker = (req.params.ticker ?? "").toUpperCase();
      if (!ticker || !/^[A-Z]{1,10}$/.test(ticker)) return next();

      // In development, let Vite handle the HTML serving (it needs to inject HMR scripts).
      // Meta tag injection only matters in production where crawlers actually hit these URLs.
      const isProd = app.get("env") === "production";
      if (!isProd) return next();

      const fsModule = await import("fs");
      const pathModule = await import("path");

      const info = await getLatestCompanyInfoByTicker(ticker);
      const companyName = info?.companyName ? stripLegalSuffix(info.companyName) : null;

      const title = companyName
        ? `${companyName} (${ticker}) — Investment Thesis & Analysis | restnvest`
        : `${ticker} Analysis | restnvest`;
      const description = companyName
        ? `Skip the noise. See the metrics that actually matter for ${companyName} — and walk through the decision of whether ${ticker} belongs in your portfolio.`
        : `Skip the noise. See the metrics that actually matter for ${ticker} — and walk through the decision of whether ${ticker} belongs in your portfolio.`;
      const ogTitle = companyName
        ? `${companyName} (${ticker}) | restnvest`
        : `${ticker} | restnvest`;
      const canonicalUrl = `https://restnvest.com/stocks/${ticker}`;

      const htmlPath = pathModule.resolve(import.meta.dirname, "public", "index.html");
      let html = await fsModule.promises.readFile(htmlPath, "utf-8");

      html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = html.replace(
        /<meta name="description"[^>]*>/,
        `<meta name="description" content="${description}">`
      );
      html = html.replace(
        "</head>",
        `  <meta property="og:title" content="${ogTitle}">\n  <meta property="og:description" content="${description}">\n  <meta property="og:type" content="website">\n  <meta property="og:url" content="${canonicalUrl}">\n  <link rel="canonical" href="${canonicalUrl}">\n</head>`
      );

      console.log(`[stocks:meta] Served ${ticker} — companyName: ${companyName ?? "fallback"}`);
      res.status(200).type("text/html").send(html);
    } catch (err) {
      console.error("[stocks:meta] Error, falling through to static:", err);
      next();
    }
  });

  // --------------------------------------------------------------------------
  // DISCOVER — list all cached companies with derived grades
  // --------------------------------------------------------------------------
  app.get("/api/discover", async (req, res) => {
    try {
      const { db: extDb } = await import("./db");
      const { aiBusinessAnalysis } = await import("../shared/schema");
      const { sql, desc, or, and } = await import("drizzle-orm");

      // Parse optional ?tags param (comma-separated or repeated &tags=)
      const rawTags = req.query.tags;
      const filterTags: string[] = rawTags
        ? (Array.isArray(rawTags) ? rawTags.map(String) : String(rawTags).split(","))
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      // ?mode=all → AND logic (each tag must match); default is OR
      const mode = req.query.mode === "all" ? "all" : "any";

      // OR mode: flat list — any condition across all tags matches
      const orConditions = filterTags.flatMap((tag) => [
        sql`result->'moats' @> jsonb_build_array(jsonb_build_object('name', ${tag}::text))`,
        sql`result->'investmentThemes' @> jsonb_build_array(jsonb_build_object('name', ${tag}::text))`,
      ]);

      // AND mode: per-tag groups — each tag must match in moats OR themes
      const andGroups = filterTags.map((tag) =>
        or(
          sql`result->'moats' @> jsonb_build_array(jsonb_build_object('name', ${tag}::text))`,
          sql`result->'investmentThemes' @> jsonb_build_array(jsonb_build_object('name', ${tag}::text))`,
        )
      );

      // Slim SELECT: extract only the specific JSONB subfields we need
      const baseQuery = extDb
        .select({
          ticker: aiBusinessAnalysis.ticker,
          companyName: aiBusinessAnalysis.companyName,
          fiscalYear: aiBusinessAnalysis.fiscalYear,
          rCompanyName: sql<string>`result->>'companyName'`,
          tagline: sql<string>`result->>'tagline'`,
          analysisDepth: sql<string>`result->>'analysisDepth'`,
          unavailable: sql<string>`result->>'businessAnalysisUnavailable'`,
          moats: sql<any[]>`result->'moats'`,
          investmentThemes: sql<any[]>`result->'investmentThemes'`,
          valueCreation: sql<any[]>`result->'valueCreation'`,
          marketOpportunity: sql<any[]>`result->'marketOpportunity'`,
          quadrant: sql<string>`result->'valuationData'->'positioning'->>'quadrant'`,
        })
        .from(aiBusinessAnalysis)
        .orderBy(desc(aiBusinessAnalysis.createdAt));

      const rows =
        filterTags.length > 0
          ? mode === "all"
            ? await baseQuery.where(and(...andGroups))
            : await baseQuery.where(or(...orConditions))
          : await baseQuery;

      const seen = new Set<string>();
      const companies: Array<{
        ticker: string;
        name: string;
        tagline: string;
        grade: string;
        gradeScore: number;
        moatCount: number;
        themeCount: number;
        valueCount: number;
        topMoat: string;
        topTheme: string;
        topValue: string;
        analysisDepth: string;
        fiscalYear: string;
        moatTags: string[];
        themeTags: string[];
        quadrant: string;
      }> = [];

      for (const row of rows) {
        const t = row.ticker.toUpperCase();
        if (seen.has(t)) continue;
        seen.add(t);

        if (row.unavailable === "true") continue;

        const moats: any[] = row.moats || [];
        const themes: any[] = row.investmentThemes || [];
        const valueCreation: any[] = row.valueCreation || [];
        const marketOpportunity: any[] = row.marketOpportunity || [];

        const countHigh = (arr: any[]) =>
          arr.filter((x: any) => x.emphasis === "high").length;

        const highMoats = countHigh(moats);
        const highThemes = countHigh(themes);
        const highValue = countHigh(valueCreation);
        const highOpp = countHigh(marketOpportunity);

        let score = highMoats * 2 + highThemes + highValue + highOpp;
        const depth = row.analysisDepth || "full";
        if (depth === "full") score += 1;
        if (depth === "limited") score -= 1;

        let grade: string;
        if (score >= 8) grade = "A";
        else if (score >= 6) grade = "B";
        else if (score >= 4) grade = "C";
        else if (score >= 2) grade = "D";
        else grade = "F";

        const topOf = (arr: any[]) => {
          const h = arr.find((x: any) => x.emphasis === "high");
          return h?.name || arr[0]?.name || "";
        };

        companies.push({
          ticker: t,
          name: stripLegalSuffix(row.rCompanyName || row.companyName),
          tagline: row.tagline || "",
          grade,
          gradeScore: score,
          moatCount: moats.length,
          themeCount: themes.length,
          valueCount: valueCreation.length,
          topMoat: topOf(moats),
          topTheme: topOf(themes),
          topValue: topOf(valueCreation),
          analysisDepth: depth,
          fiscalYear: row.fiscalYear,
          moatTags: moats.map((m: any) => m.name).filter(Boolean),
          themeTags: themes.map((t: any) => t.name).filter(Boolean),
          quadrant: row.quadrant || "",
        });
      }

      companies.sort((a, b) => b.gradeScore - a.gradeScore);

      res.json({ companies });
    } catch (err: any) {
      console.error("[DISCOVER]", err.message);
      res.status(500).json({ error: "Failed to load discover data" });
    }
  });

  // --------------------------------------------------------------------------
  // SIMILAR COMPANIES — Jaccard similarity on moat + theme tag overlap
  // --------------------------------------------------------------------------
  app.get("/api/discover/similar", async (req, res) => {
    try {
      const { db: extDb } = await import("./db");
      const { aiBusinessAnalysis } = await import("../shared/schema");
      const { sql, desc } = await import("drizzle-orm");

      const tickerParam = (req.query.ticker as string || "").toUpperCase().trim();
      if (!tickerParam) {
        return res.status(400).json({ error: "ticker query param is required" });
      }

      const rows = await extDb
        .select({
          ticker: aiBusinessAnalysis.ticker,
          companyName: aiBusinessAnalysis.companyName,
          fiscalYear: aiBusinessAnalysis.fiscalYear,
          rCompanyName: sql<string>`result->>'companyName'`,
          tagline: sql<string>`result->>'tagline'`,
          analysisDepth: sql<string>`result->>'analysisDepth'`,
          unavailable: sql<string>`result->>'businessAnalysisUnavailable'`,
          moats: sql<any[]>`result->'moats'`,
          investmentThemes: sql<any[]>`result->'investmentThemes'`,
          valueCreation: sql<any[]>`result->'valueCreation'`,
          marketOpportunity: sql<any[]>`result->'marketOpportunity'`,
          quadrant: sql<string>`result->'valuationData'->'positioning'->>'quadrant'`,
        })
        .from(aiBusinessAnalysis)
        .orderBy(desc(aiBusinessAnalysis.createdAt));

      // Process rows into company objects
      const seen = new Set<string>();
      const allCompanies: Array<{
        ticker: string;
        name: string;
        tagline: string;
        grade: string;
        gradeScore: number;
        moatCount: number;
        themeCount: number;
        valueCount: number;
        topMoat: string;
        topTheme: string;
        topValue: string;
        analysisDepth: string;
        fiscalYear: string;
        moatTags: string[];
        themeTags: string[];
        quadrant: string;
      }> = [];

      for (const row of rows) {
        const t = row.ticker.toUpperCase();
        if (seen.has(t)) continue;
        seen.add(t);
        if (row.unavailable === "true") continue;

        const moats: any[] = row.moats || [];
        const themes: any[] = row.investmentThemes || [];
        const valueCreation: any[] = row.valueCreation || [];
        const marketOpportunity: any[] = row.marketOpportunity || [];

        const countHigh = (arr: any[]) => arr.filter((x: any) => x.emphasis === "high").length;
        const highMoats = countHigh(moats);
        const highThemes = countHigh(themes);
        const highValue = countHigh(valueCreation);
        const highOpp = countHigh(marketOpportunity);

        let score = highMoats * 2 + highThemes + highValue + highOpp;
        const depth = row.analysisDepth || "full";
        if (depth === "full") score += 1;
        if (depth === "limited") score -= 1;

        let grade: string;
        if (score >= 8) grade = "A";
        else if (score >= 6) grade = "B";
        else if (score >= 4) grade = "C";
        else if (score >= 2) grade = "D";
        else grade = "F";

        const topOf = (arr: any[]) => {
          const h = arr.find((x: any) => x.emphasis === "high");
          return h?.name || arr[0]?.name || "";
        };

        allCompanies.push({
          ticker: t,
          name: stripLegalSuffix(row.rCompanyName || row.companyName),
          tagline: row.tagline || "",
          grade,
          gradeScore: score,
          moatCount: moats.length,
          themeCount: themes.length,
          valueCount: valueCreation.length,
          topMoat: topOf(moats),
          topTheme: topOf(themes),
          topValue: topOf(valueCreation),
          analysisDepth: depth,
          fiscalYear: row.fiscalYear,
          moatTags: moats.map((m: any) => m.name).filter(Boolean),
          themeTags: themes.map((tt: any) => tt.name).filter(Boolean),
          quadrant: row.quadrant || "",
        });
      }

      const target = allCompanies.find((c) => c.ticker === tickerParam);
      if (!target) {
        return res.status(404).json({ error: `No analysis found for ${tickerParam}` });
      }

      const targetSet = new Set([...target.moatTags, ...target.themeTags]);

      const scored = allCompanies
        .filter((c) => c.ticker !== tickerParam)
        .map((c) => {
          const candidateSet = new Set([...c.moatTags, ...c.themeTags]);
          let intersection = 0;
          for (const tag of Array.from(targetSet)) {
            if (candidateSet.has(tag)) intersection++;
          }
          const union = targetSet.size + candidateSet.size - intersection;
          const jaccard = union === 0 ? 0 : intersection / union;
          return { ...c, jaccard };
        })
        .filter((c) => c.jaccard > 0)
        .sort((a, b) => b.jaccard - a.jaccard)
        .slice(0, 8);

      res.json({ ticker: tickerParam, baseName: target.name, similar: scored });
    } catch (err: any) {
      console.error("[SIMILAR]", err.message);
      res.status(500).json({ error: "Failed to load similar companies" });
    }
  });

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
      const upperTicker = ticker?.toUpperCase();

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error:
            "Invalid ticker format. Please provide 1-5 letter ticker symbol.",
        });
      }

      const { cik, name } = await secService.getCompanyInfo(upperTicker);

      let accessionNumber: string;
      let filingDate: string;
      let fiscalYear: string;
      let primaryDocument: string;

      try {
        ({ accessionNumber, filingDate, fiscalYear, primaryDocument } =
          await secService.getLatest10K(cik));
      } catch (no10KErr: any) {
        if (no10KErr.message?.includes("No 10-K")) {
          console.log(`[NO 10-K] ${upperTicker} has no 10-K filing — returning stub for market-data stages`);
          const stub = companySummarySchema.parse({
            companyName: name,
            ticker: upperTicker,
            filingDate: "",
            fiscalYear: "",
            tagline: "",
            investmentThesis: "",
            investmentThemes: [],
            moats: [],
            marketOpportunity: [],
            valueCreation: [],
            products: [],
            operations: { regions: [], channels: [], scale: "" },
            competitors: [],
            leaders: [],
            metrics: [],
            metadata: { homepage: "", news: [], videos: [] },
            cik,
            no10KAvailable: true,
            analysisDepth: "unavailable" as const,
          });
          return res.json(stub);
        }
        throw no10KErr;
      }

      const businessKey = makeCacheKey("business", upperTicker, fiscalYear);

      try {
        const cached = await getBusinessByCacheKey(businessKey);
        if (cached) {
          console.log(`[ROUTE CACHE HIT] ${upperTicker} FY${fiscalYear} — returning instantly`);
          return res.json(cached);
        }
      } catch (dbErr) {
        console.warn("Route cache read failed, will run live:", dbErr);
      }

      console.log(`[ROUTE CACHE MISS] Running live analysis for ${upperTicker} (FY${fiscalYear})`);

      const start = performance.now();

      let summary: any;
      let businessAnalysisUnavailable = false;
      let businessAnalysisError: string | undefined;
      let analysisDepth: 'full' | 'limited' | 'unavailable' = 'full';

      try {
        const { text: businessSection, depth: sectionDepth } = await secService.get10KBusinessSection(
          cik,
          accessionNumber,
          primaryDocument,
        );

        analysisDepth = sectionDepth === 'full' ? 'full' : 'limited';

        summary = await openaiService.analyzeBusiness(
          name,
          upperTicker,
          businessSection,
          filingDate,
          fiscalYear,
          cik,
          sectionDepth,
        );

        const end = performance.now();
        console.log(`Live analysis took ${(end - start).toFixed(2)} ms`);
      } catch (businessErr: any) {
        console.warn(`[BUSINESS ANALYSIS] Failed for ${upperTicker}, continuing with other stages:`, businessErr.message);
        businessAnalysisUnavailable = true;
        analysisDepth = 'unavailable';
        businessAnalysisError = "We had trouble reading this company's 10-K filing. Other analysis stages are still available.";
        summary = {
          companyName: name,
          ticker: upperTicker,
          filingDate,
          fiscalYear,
          tagline: "",
          investmentThesis: "",
          investmentThemes: [],
          moats: [],
          marketOpportunity: [],
          valueCreation: [],
          products: [],
          operations: { regions: [], channels: [], scale: "" },
          competitors: [],
          leaders: [],
          metrics: [],
          metadata: { homepage: "", news: [], videos: [] },
          cik,
        };
      }

      let temporalAnalysis;
      if (!businessAnalysisUnavailable) {
        try {
          const yearlyData = await secService.get5YearsBusinessSections(cik);

          if (yearlyData.length >= 2) {
            console.log(
              `Starting temporal analysis for ${upperTicker} with ${yearlyData.length} years of data`,
            );

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Temporal analysis timeout")),
                30000,
              ),
            );

            const analysisPromise = openaiService.analyzeTemporalChanges(
              name,
              upperTicker,
              yearlyData,
            );

            temporalAnalysis = (await Promise.race([
              analysisPromise,
              timeoutPromise,
            ])) as any;
            console.log(`Temporal analysis completed for ${upperTicker}`);
          }
        } catch (temporalError) {
          console.warn(
            "Temporal analysis failed, continuing without it:",
            temporalError,
          );
        }
      }

      const validated = companySummarySchema.parse({
        ...summary,
        ...(temporalAnalysis ? { temporalAnalysis } : {}),
        ...(businessAnalysisUnavailable ? { businessAnalysisUnavailable, businessAnalysisError } : {}),
        analysisDepth,
      });

      if (!businessAnalysisUnavailable) {
        try {
          await insertBusinessAnalysis({
            cacheKey: businessKey,
            companyName: name,
            ticker: upperTicker,
            cik,
            fiscalYear,
            filingDate,
            result: validated,
          });
          console.log(`[ROUTE CACHE WRITE] Saved full result for ${upperTicker} (FY${fiscalYear})`);
        } catch (dbErr) {
          console.warn("Route cache write failed (non-fatal):", dbErr);
        }
      }

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
      const upperTicker = ticker?.toUpperCase();

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error:
            "Invalid ticker format. Please provide 1-5 letter ticker symbol.",
        });
      }

      const { cik, name } = await secService.getCompanyInfo(upperTicker);
      const { accessionNumber, filingDate, fiscalYear, primaryDocument } =
        await secService.getLatest10K(cik);

      const footnotesKey = makeCacheKey("footnotes", upperTicker, fiscalYear);

      try {
        const cached = await getFootnotesByCacheKey(footnotesKey);
        if (cached) {
          console.log(`[ROUTE CACHE HIT] Footnotes for ${upperTicker} FY${fiscalYear} — returning instantly`);
          return res.json(cached);
        }
      } catch (dbErr) {
        console.warn("Route cache read failed for footnotes, will run live:", dbErr);
      }

      console.log(`[ROUTE CACHE MISS] Running live footnotes for ${upperTicker} (FY${fiscalYear})`);

      const footnotesSection = await secService.get10KFootnotesSection(
        cik,
        accessionNumber,
        primaryDocument,
      );

      const finePrintAnalysis = await openaiService.analyzeFootnotes(
        name,
        upperTicker,
        footnotesSection,
        fiscalYear,
        filingDate,
      );

      const validated = finePrintAnalysisSchema.parse(finePrintAnalysis);

      try {
        await saveFootnotesAnalysis({
          cacheKey: footnotesKey,
          companyName: name,
          ticker: upperTicker,
          fiscalYear,
          filingDate,
          result: validated,
        });
        console.log(`[ROUTE CACHE WRITE] Saved footnotes for ${upperTicker} (FY${fiscalYear})`);
      } catch (dbErr) {
        console.warn("Route cache write failed for footnotes (non-fatal):", dbErr);
      }

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

  app.get("/api/waitlist/check", async (req: any, res) => {
    const email = ((req.query.email as string) || "").toLowerCase().trim();
    if (!email) return res.json({ exists: false });
    try {
      const exists = await storage.checkWaitlistEmail(email);
      res.json({ exists });
    } catch (error) {
      res.json({ exists: false });
    }
  });

  app.get("/api/waitlist/check-ticker", async (req: any, res) => {
    const email = ((req.query.email as string) || "").toLowerCase().trim();
    const ticker = ((req.query.ticker as string) || "").toUpperCase().trim();
    if (!email || !ticker) return res.json({ followed: false });
    try {
      const followed = await storage.checkEmailTickerFollowed(email, ticker);
      res.json({ followed });
    } catch (error) {
      res.json({ followed: false });
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
        message:
          "You're on the list! We'll notify you when this feature launches.",
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
      ticker: z
        .string()
        .min(1)
        .max(10)
        .regex(/^[A-Za-z0-9.\-]+$/),
      companyName: z.string().max(200).optional(),
      convictionValue: z.number().min(0).max(100),
      convictionLabel: z.string().max(50),
      trancheCount: z.number().min(1).max(10),
      totalAmount: z.number().min(0),
      tranches: z
        .array(
          z.object({
            index: z.number(),
            amount: z.number().min(0),
            when: z.any().optional(),
            trigger: z.string().optional(),
            gate: z.object({ type: z.string() }).optional(),
            gateEnabled: z.boolean().optional(),
            manual: z.boolean().optional(),
          }),
        )
        .min(1)
        .max(10),
      imWrongIf: z.string().max(2000).default(""),
      snapshot: z.object({
        fundamentals: z.string().max(500),
        valuation: z.string().max(500),
        timing: z.string().max(500),
      }),
      takeawayTexts: z
        .object({
          performance: z.string().max(1000),
          valuation: z.string().max(1000),
          timing: z.string().max(1000),
        })
        .optional(),
      createdAt: z.string(),
    }),
  });

  app.post("/api/memo/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      const upperTicker = ticker?.toUpperCase();
      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({ error: "Invalid ticker format" });
      }
      const analysis = await getLatestBusinessByTicker(upperTicker);
      if (!analysis) {
        return res.status(404).json({ error: "No cached analysis found for this ticker. Please run a business analysis first." });
      }
      const signals = req.body || {};
      const memo = await openaiService.generateMemo(analysis, signals);
      return res.json(memo);
    } catch (err: any) {
      console.error("[memo] Error:", err?.message || err);
      return res.status(500).json({ error: "Failed to generate investment memo" });
    }
  });

  app.post("/api/strategy-email", async (req: any, res) => {
    try {
      console.log("[strategy-email] Request received");
      const parsed = strategyEmailSchema.safeParse(req.body);

      if (!parsed.success) {
        console.error(
          "[strategy-email] Validation failed:",
          JSON.stringify(parsed.error.issues),
        );
        return res.status(400).json({
          error: "Invalid request",
          message: "Please provide valid email and plan data.",
          issues: parsed.error.issues,
        });
      }

      const { email, plan } = parsed.data;
      console.log(
        `[strategy-email] Validated. Sending to ${email} for ${plan.ticker}`,
      );

      const apiKey = process.env.replit_email_resend;
      if (!apiKey) {
        console.error(
          "[strategy-email] No Resend API key found (replit_email_resend secret is missing)",
        );
        return res.status(500).json({
          error: "Email service not configured",
          message: "Email sending is not set up. Please contact support.",
        });
      }
      console.log(
        `[strategy-email] API key found, length: ${apiKey.length}, starts with: ${apiKey.substring(0, 5)}...`,
      );

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

      const htmlContent = renderStrategyEmail(plan, {
        analysisUrl,
        strategyUrl,
      });
      console.log(
        `[strategy-email] HTML rendered, length: ${htmlContent.length}`,
      );

      console.log(`[strategy-email] Calling Resend API...`);
      const { data, error } = await resend.emails.send({
        from: "restnvest <product@restnvest.com>",
        to: email,
        subject: `Your ${ticker} Strategy Plan`,
        html: htmlContent,
      });

      if (error) {
        console.error(
          "[strategy-email] Resend API error:",
          JSON.stringify(error),
        );
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
        console.warn(
          "[strategy-email] Failed to store email in DB, continuing:",
          dbError,
        );
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
  
  const contactSchema = z.object({
    name: z.string().min(1).max(200),
    email: z.string().email().max(200),
    message: z.string().min(1).max(5000),
    source: z.string().max(100).optional(),
  });

  app.post("/api/contact", async (req: any, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request",
          message: "Please fill in all fields with valid information.",
        });
      }

      const { name, email, message, source } = parsed.data;
      console.log(`[contact] Message from ${name} (${email}) via ${source || "unknown"}`);

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const safeName = esc(name);
      const safeEmail = esc(email);
      const safeMessage = esc(message);
      const safeSource = source ? esc(source) : null;
      const safeSubject = name.replace(/[\r\n]/g, " ").slice(0, 100);
      const subjectPrefix = source ? `[${source.replace(/[\r\n]/g, " ").slice(0, 50)}]` : "[Contact]";

      const apiKey = process.env.replit_email_resend;
      if (!apiKey) {
        console.error("[contact] No Resend API key found");
        return res.status(500).json({
          error: "Email service not configured",
          message: "Unable to send message right now. Please try again later.",
        });
      }

      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: "restnvest <product@restnvest.com>",
        to: "product@restnvest.com",
        replyTo: email,
        subject: `${subjectPrefix} ${safeSubject}`,
        html: `<div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="margin-bottom: 4px;">New contact form message</h2>
          ${safeSource ? `<p style="color: #888; margin-top: 0; margin-bottom: 4px; font-size: 13px;"><strong>Source:</strong> ${safeSource}</p>` : ""}
          <p style="color: #666; margin-top: 0;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
        </div>`,
      });

      if (error) {
        console.error("[contact] Resend API error:", JSON.stringify(error));
        return res.status(500).json({
          error: "Failed to send message",
          message: "Unable to send your message. Please try again.",
        });
      }

      console.log(`[contact] Message sent successfully, ID: ${data?.id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[contact] Error:", error);
      res.status(500).json({
        error: "Failed to send message",
        message: "Something went wrong. Please try again.",
      });
    }
  });

  // --------------------------------------------------------------------------
  // WATCHLIST
  // --------------------------------------------------------------------------
  app.get("/api/watchlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const items = await storage.getWatchlistItems(userId);
      res.json(items);
    } catch (error: any) {
      console.error("[watchlist] Error fetching:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  app.get("/api/watchlist/check/:ticker", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const item = await storage.getWatchlistItem(userId, req.params.ticker);
      res.json({ saved: !!item, item: item || null });
    } catch (error: any) {
      console.error("[watchlist] Error checking:", error);
      res.status(500).json({ error: "Failed to check watchlist" });
    }
  });

  app.post("/api/watchlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const parsed = insertWatchlistItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      }

      const existing = await storage.getWatchlistItem(userId, parsed.data.ticker);
      if (existing) {
        return res.status(409).json({ error: "Already in watchlist", item: existing });
      }

      const item = await storage.addWatchlistItem(userId, {
        ticker: parsed.data.ticker,
        companyName: parsed.data.companyName,
        notes: parsed.data.notes,
        snapshot: parsed.data.snapshot,
      });
      res.status(201).json(item);
    } catch (error: any) {
      console.error("[watchlist] Error adding:", error);
      res.status(500).json({ error: "Failed to add to watchlist" });
    }
  });

  app.patch("/api/watchlist/:id/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { notes } = req.body;
      const item = await storage.updateWatchlistNotes(req.params.id, userId, notes ?? null);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (error: any) {
      console.error("[watchlist] Error updating notes:", error);
      res.status(500).json({ error: "Failed to update notes" });
    }
  });

  app.patch("/api/watchlist/:id/snapshot", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { snapshot } = req.body;
      if (!snapshot) return res.status(400).json({ error: "Snapshot is required" });
      const item = await storage.updateWatchlistSnapshot(req.params.id, userId, snapshot);
      if (!item) return res.status(404).json({ error: "Not found" });
      res.json(item);
    } catch (error: any) {
      console.error("[watchlist] Error updating snapshot:", error);
      res.status(500).json({ error: "Failed to update snapshot" });
    }
  });

  app.delete("/api/watchlist/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const removed = await storage.removeWatchlistItem(req.params.id, userId);
      if (!removed) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (error: any) {
      console.error("[watchlist] Error removing:", error);
      res.status(500).json({ error: "Failed to remove from watchlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
