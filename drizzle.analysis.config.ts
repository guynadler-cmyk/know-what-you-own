import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.ANALYSIS_DATABASE_URL) {
  throw new Error("ANALYSIS_DATABASE_URL must be set");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle/analysis",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.ANALYSIS_DATABASE_URL,
  },
});
