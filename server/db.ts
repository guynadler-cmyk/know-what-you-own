// // import { drizzle } from "drizzle-orm/neon-http";
// // import { neon } from "@neondatabase/serverless";
// // import * as schema from "@shared/schema";

// // if (!process.env.DATABASE_URL) {
// //   throw new Error("DATABASE_URL environment variable is not set");
// // }

// // const sql = neon(process.env.DATABASE_URL);
// // export const db = drizzle(sql, { schema });
// import { drizzle } from "drizzle-orm/neon-http";
// import { neon } from "@neondatabase/serverless";
// import * as schema from "@shared/schema";
// import "dotenv/config";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL is not set");
// }
// console.log("DATABASE_URL:", process.env.DATABASE_URL);

// const sql = neon(process.env.DATABASE_URL);

// export const db = drizzle(sql, { schema });

import "dotenv/config";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pkg;

const rawDbUrl = process.env.EXTERNAL_DATABASE_URL;

if (!rawDbUrl) {
  throw new Error("EXTERNAL_DATABASE_URL must be set for external database connection");
}

const parsedUrl = new URL(rawDbUrl);
parsedUrl.searchParams.delete("sslmode");
const dbUrl = parsedUrl.toString();

const rawCaCert = process.env.PG_CA_CERT;

function normalizePem(raw: string): string {
  let cert = raw.replace(/\\n/g, "\n").trim();
  if (!cert.startsWith("-----BEGIN")) {
    const base64 = cert.replace(/\s+/g, "");
    const lines = base64.match(/.{1,64}/g) || [];
    cert = `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----\n`;
  }
  return cert;
}

const sslConfig = rawCaCert
  ? { ca: normalizePem(rawCaCert), rejectUnauthorized: true, checkServerIdentity: () => undefined }
  : { rejectUnauthorized: false };

console.log(
  rawCaCert
    ? "DB SSL: using Cloud SQL server CA certificate (rejectUnauthorized: true)"
    : "DB SSL: no PG_CA_CERT found, falling back to rejectUnauthorized: false"
);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

export const db = drizzle(pool, { schema });

console.log("DB initialized ✅");



