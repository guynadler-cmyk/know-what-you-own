import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

// Use either EXTERNAL_DATABASE_URL or DATABASE_URL
const dbUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("EXTERNAL_DATABASE_URL or DATABASE_URL is not set");
}

// Convert multiline CA cert from .env
const caCert = process.env.PG_CA_CERT?.replace(/\\n/g, "\n") || null;

// Detect local proxy / dev environment
const isLocalProxy = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

// Configure SSL
let sslConfig: false | { ca?: string; rejectUnauthorized: boolean; checkServerIdentity?: () => undefined } = false;

if (caCert) {
  sslConfig = {
    ca: caCert,
    rejectUnauthorized: true,
  };
  if (isLocalProxy) {
    sslConfig.checkServerIdentity = () => undefined; // Skip host verification locally
  }
} else {
  sslConfig = { rejectUnauthorized: false }; // fallback for local/no cert
}

// Create the pool
export const dbPool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

// Test connection
async function testConnection() {
  try {
    const res = await dbPool.query("SELECT NOW();");
    console.log("✅ DB connected. Server time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  } finally {
    await dbPool.end();
  }
}

if (require.main === module) {
  testConnection();
}
