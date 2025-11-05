import type { Express } from "express";
import { createServer, type Server } from "http";
import { secService } from "./services/sec";
import { openaiService } from "./services/openai";
import { companySummarySchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Referenced from Replit Auth blueprint - Setup authentication
  await setupAuth(app);

  // Auth routes (referenced from Replit Auth blueprint)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Analysis endpoint - Returns limited demo data for unauthenticated users, full data for authenticated users
  app.get("/api/analyze/:ticker", async (req: any, res) => {
    try {
      const { ticker } = req.params;
      const isAuth = req.isAuthenticated && req.isAuthenticated();
      
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
      
      // If user is not authenticated, return limited demo data only
      if (!isAuth) {
        const limitedData: any = {
          ticker: validated.ticker,
          companyName: validated.companyName,
          tagline: validated.tagline,
          website: validated.website,
          products: validated.products ? validated.products.slice(0, 3) : [], // Only first 3 products
          youtubeVideos: validated.youtubeVideos ? validated.youtubeVideos.slice(0, 1) : [], // Only 1 video
          // Omit premium fields: metrics, competitors, salesChannels, news, operations
        };
        
        // Only include leadership if it exists
        if (validated.leadership) {
          limitedData.leadership = {
            ceo: validated.leadership.ceo || '',
            ceoName: validated.leadership.ceoName || '',
            // Omit other leadership fields
          };
        }
        
        return res.json(limitedData);
      }
      
      // Authenticated users get full data
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
