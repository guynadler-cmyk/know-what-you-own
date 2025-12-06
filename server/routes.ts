import type { Express } from "express";
import { createServer, type Server } from "http";
import { secService } from "./services/sec";
import { openaiService } from "./services/openai";
import { companySummarySchema,incomeMetricsSchema, balanceSheetMetricsSchema,combinedFinancialMetricsSchema,finePrintAnalysisSchema } from "@shared/schema";
import { alphaVantageService } from "./services/alphavantage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Analysis endpoint - Public access, returns full data for everyone
  app.get("/api/analyze/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      
      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({ 
          error: "Invalid ticker format. Please provide 1-5 letter ticker symbol." 
        });
      }

      const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());
      
      const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);
      
      const businessSection = await secService.get10KBusinessSection(cik, accessionNumber);
      
      const summary = await openaiService.analyzeBusiness(
        name,
        ticker.toUpperCase(),
        businessSection,
        filingDate,
        fiscalYear,
        cik
      );

      // Fetch 5 years of data for temporal analysis with timeout
      let temporalAnalysis;
      try {
        const yearlyData = await secService.get5YearsBusinessSections(cik);
        
        // Only run temporal analysis if we have at least 2 years of data
        if (yearlyData.length >= 2) {
          console.log(`Starting temporal analysis for ${ticker} with ${yearlyData.length} years of data`);
          
          // Add 30 second timeout for temporal analysis
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Temporal analysis timeout')), 30000)
          );
          
          const analysisPromise = openaiService.analyzeTemporalChanges(
            name,
            ticker.toUpperCase(),
            yearlyData
          );
          
          temporalAnalysis = await Promise.race([analysisPromise, timeoutPromise]) as any;
          console.log(`Temporal analysis completed for ${ticker}`);
        }
      } catch (temporalError) {
        console.warn("Temporal analysis failed, continuing without it:", temporalError);
        // Don't fail the whole request if temporal analysis fails
      }

      const validated = companySummarySchema.parse({
        ...summary,
        ...(temporalAnalysis ? { temporalAnalysis } : {}),
      });
      
      // Everyone gets full data - no authentication required
      res.json(validated);
    } catch (error: any) {
      console.error("Analysis error:", error);
      
      // Ticker not found
      if (error.message?.includes("not found")) {
        return res.status(404).json({ 
          error: "Company Not Found",
          message: `We couldn't find "${req.params.ticker.toUpperCase()}" in our database. Double-check the ticker symbol and try again.`
        });
      }
      
      // No 10-K filing
      if (error.message?.includes("No 10-K")) {
        return res.status(404).json({ 
          error: "No 10-K Available",
          message: `${req.params.ticker.toUpperCase()} doesn't have a 10-K filing available yet. This might be a newer company or one that doesn't file 10-Ks.`
        });
      }

      // Business section extraction failed
      if (error.message?.includes("business section") || error.message?.includes("business description")) {
        return res.status(500).json({ 
          error: "Filing Format Error",
          message: "We had trouble reading this company's 10-K filing. The document format might be unusual. Please try again later or contact support."
        });
      }
      
      // OpenAI API errors
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "Too Many Requests",
          message: "Our AI service is experiencing high demand. Please wait a moment and try again."
        });
      }
      
      if (error.status >= 500 || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return res.status(503).json({ 
          error: "Service Temporarily Unavailable",
          message: "Our analysis service is temporarily unavailable. Please try again in a few moments."
        });
      }
      
      // SEC API errors
      if (error.response?.status === 429) {
        return res.status(429).json({ 
          error: "Rate Limited",
          message: "We're receiving too many requests right now. Please wait a minute and try again."
        });
      }
      
      if (error.response?.status >= 500) {
        return res.status(503).json({ 
          error: "SEC Database Unavailable",
          message: "The SEC's database is temporarily unavailable. This usually resolves quickly - please try again in a few minutes."
        });
      }

      // Generic fallback
      res.status(500).json({ 
        error: "Analysis Failed",
        message: "Something went wrong while analyzing this company. Please try again, and if the problem persists, let us know."
      });
    }
  });

  // Fine Print Analysis endpoint - Analyzes footnotes from latest 10-K
  app.get("/api/analyze/:ticker/fine-print", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      
      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({ 
          error: "Invalid ticker format. Please provide 1-5 letter ticker symbol." 
        });
      }

      const { cik, name } = await secService.getCompanyInfo(ticker.toUpperCase());
      
      const { accessionNumber, filingDate, fiscalYear } = await secService.getLatest10K(cik);
      
      const footnotesSection = await secService.get10KFootnotesSection(cik, accessionNumber);
      
      const finePrintAnalysis = await openaiService.analyzeFootnotes(
        name,
        ticker.toUpperCase(),
        footnotesSection,
        fiscalYear,
        filingDate
      );

      const validated = finePrintAnalysisSchema.parse(finePrintAnalysis);
      
      res.json(validated);
    } catch (error: any) {
      console.error("Fine print analysis error:", error);
      
      if (error.message?.includes("not found")) {
        return res.status(404).json({ 
          error: "Ticker not found",
          message: `Could not find company information for ticker "${req.params.ticker}"`
        });
      }
      
      if (error.message?.includes("No 10-K")) {
        return res.status(404).json({ 
          error: "No 10-K filing found",
          message: "This company does not have a 10-K filing available"
        });
      }

      if (error.message?.includes("Could not extract footnotes")) {
        return res.status(404).json({ 
          error: "Footnotes not found",
          message: "Could not extract footnotes section from the 10-K filing"
        });
      }

      res.status(500).json({ 
        error: "Analysis failed",
        message: "Unable to analyze footnotes. Please try again later."
      });
    }
  });
  
  // --------------------------------------------------------------------------
  // FINANCIAL METRICS (INCOME + BALANCE SHEET)
  // --------------------------------------------------------------------------
  app.get("/api/financials/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;

      if (!ticker || !/^[A-Z]{1,5}$/i.test(ticker)) {
        return res.status(400).json({
          error: "Invalid ticker format",
          message: "Please provide 1-5 letter ticker symbol."
        });
      }

      const [metrics, balanceSheet] = await Promise.all([
        alphaVantageService.getFinancialMetrics(ticker.toUpperCase()),
        alphaVantageService.getBalanceSheetMetrics(ticker.toUpperCase())
      ]);

      const validatedMetrics = incomeMetricsSchema.parse(metrics);
      const validatedBalanceSheet = balanceSheetMetricsSchema.parse(balanceSheet);

      const combinedResponse = {
        ...validatedMetrics,
        balanceSheet: validatedBalanceSheet
      };

      const validatedResponse = combinedFinancialMetricsSchema.parse(combinedResponse);

      res.json(validatedResponse);
    } catch (error: any) {
      console.error("Financial metrics error:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json({
          error: "Company Not Found",
          message: `Could not find financial data for "${req.params.ticker.toUpperCase()}".`
        });
      }

      if (error.message?.includes("Insufficient")) {
        return res.status(404).json({
          error: "Insufficient Data",
          message: error.message
        });
      }

      if (error.message?.includes("rate limit")) {
        return res.status(429).json({
          error: "Rate Limited",
          message: error.message
        });
      }

      if (error.message?.includes("timed out")) {
        return res.status(503).json({
          error: "Service Timeout",
          message: "Financial data service timed out."
        });
      }

      return res.status(500).json({
        error: "Data Retrieval Failed",
        message: "Unable to retrieve financial metrics."
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
