import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema"; // your analysis DB schema

if (!process.env.ANALYSIS_DATABASE_URL) {
  throw new Error("ANALYSIS_DATABASE_URL is missing");
}

// Convert multiline CA cert from .env (if provided)
const caCert = process.env.PG_CA_CERT?.replace(/\\n/g, "\n");

// Create Postgres pool
const analysisPool = new Pool({
  connectionString: process.env.ANALYSIS_DATABASE_URL,
  ssl: caCert
    ? {
        rejectUnauthorized: true,
        ca: caCert,
      }
    : {
        rejectUnauthorized: false, // fallback for local / no cert
      },
});

// Export DB instance with a single consistent name
export const analysisDb = drizzle(analysisPool, { schema });

console.log("Analysis DB initialized ✅");
console.log("PG_CA_CERT loaded?", !!process.env.PG_CA_CERT);
console.log("ANALYSIS_DATABASE_URL =", process.env.ANALYSIS_DATABASE_URL);
