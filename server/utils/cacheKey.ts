export function businessCacheKey(ticker: string, fiscalYear: string): string {
  return `${ticker.toUpperCase()}:${fiscalYear}`;
}

export function footnotesCacheKey(ticker: string, fiscalYear: string): string {
  return `footnotes:${ticker.toUpperCase()}:${fiscalYear}`;
}

export function temporalCacheKey(ticker: string, fiscalYear: string): string {
  return `temporal:${ticker.toUpperCase()}:${fiscalYear}`;
}
