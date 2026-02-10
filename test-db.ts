import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    const res = await pool.query("SELECT NOW();");
    console.log("✅ DB connected. Time:", res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    process.exit(1);
  }
}

testConnection();
