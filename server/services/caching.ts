type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  constructor(private defaultTTLms: number) {}

  get<T>(key: string): T | null {                                                      
    const entry = this.store.get(key);
    if (!entry) return null;
    console.log("[CACHE]", key, entry ? "HIT" : "MISS");

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs?: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTLms),
    });
  }
}
