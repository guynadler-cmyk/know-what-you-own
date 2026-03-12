import "dotenv/config";
import pkg from "pg";

const { Pool } = pkg;

const rawDbUrl = process.env.EXTERNAL_DATABASE_URL;
if (!rawDbUrl) throw new Error("EXTERNAL_DATABASE_URL must be set");

const parsedUrl = new URL(rawDbUrl);
parsedUrl.searchParams.delete("sslmode");

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

const pool = new Pool({ connectionString: parsedUrl.toString(), ssl: sslConfig });

async function main() {
  const client = await pool.connect();
  try {
    console.log("Connected to external DB. Adding tag columns...");

    await client.query(`
      ALTER TABLE ai_business_analysis
        ADD COLUMN IF NOT EXISTS theme_tags TEXT[],
        ADD COLUMN IF NOT EXISTS moat_tags TEXT[]
    `);
    console.log("Columns added (or already existed).");

    const { rowCount } = await client.query(`
      UPDATE ai_business_analysis
      SET
        theme_tags = ARRAY(
          SELECT elem->>'name'
          FROM jsonb_array_elements(
            COALESCE(result->'investmentThemes', '[]'::jsonb)
          ) AS elem
          WHERE elem->>'name' IS NOT NULL
        ),
        moat_tags = ARRAY(
          SELECT elem->>'name'
          FROM jsonb_array_elements(
            COALESCE(result->'moats', '[]'::jsonb)
          ) AS elem
          WHERE elem->>'name' IS NOT NULL
        )
      WHERE theme_tags IS NULL AND moat_tags IS NULL
    `);
    console.log(`Backfilled ${rowCount} rows with tag arrays.`);

    const { rows } = await client.query(
      "SELECT COUNT(*) AS total, COUNT(theme_tags) AS with_themes, COUNT(moat_tags) AS with_moats FROM ai_business_analysis"
    );
    console.log("Stats:", rows[0]);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
