import crypto from "node:crypto";

export type CacheKeyType = "business" | "footnotes" | "temporal";

export function makeCacheKey(
  type: CacheKeyType,
  ticker: string,
  fiscalYear: string | number
): string {
  const payload = `${type}:${ticker.toUpperCase().trim()}:${fiscalYear}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}
