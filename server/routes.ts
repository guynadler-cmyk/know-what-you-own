import type { Express } from "express";
import { createServer, type Server } from "http";
import { secService } from "./services/sec";
import { openaiService } from "./services/openai";
import { companySummarySchema, finePrintAnalysisSchema } from "@shared/schema";

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

      res.status(500).json({ 
        error: "Analysis failed",
        message: "Unable to analyze this company. Please try again later."
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

  const httpServer = createServer(app);
  return httpServer;
}
