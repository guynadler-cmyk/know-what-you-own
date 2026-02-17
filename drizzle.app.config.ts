import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.APP_DATABASE_URL) {
  throw new Error("APP_DATABASE_URL is missing");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./drizzle/app",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.APP_DATABASE_URL,
  },
});
