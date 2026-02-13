import "dotenv/config";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pkg;

const internalDbUrl = process.env.DATABASE_URL;

if (!internalDbUrl) {
  throw new Error("DATABASE_URL must be set for internal database");
}

const internalPool = new Pool({
  connectionString: internalDbUrl,
});

export const internalDb = drizzle(internalPool, { schema });

console.log("Internal DB initialized ✅");
