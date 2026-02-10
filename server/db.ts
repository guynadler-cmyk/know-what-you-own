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

const dbUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("EXTERNAL_DATABASE_URL or DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

console.log("DB initialized ✅");



