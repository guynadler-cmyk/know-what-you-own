import type { Express } from "express";
import { createServer, type Server } from "http";
import { secService } from "./services/sec";
import { openaiService } from "./services/openai";
import { companySummarySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment verification
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Root health check (alternative endpoint)
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.get("/api/analyze/:ticker", async (req, res) => {
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

      const validated = companySummarySchema.parse(summary);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
