interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined; // expired for fresh reads, but kept around for getStale()
    return entry.value as T;
  }

  /** Returns the last cached value even if its TTL has expired — used as a
   * fallback when a fresh fetch fails (e.g. upstream rate limiting), so a
   * temporary provider hiccup serves slightly-stale real data instead of an
   * empty/incomplete result. */
  getStale<T>(key: string): T | undefined {
    return this.store.get(key)?.value as T | undefined;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  // Prevents duplicate concurrent upstream calls for the same key
  // (e.g. several browser tabs polling live events at once).
  private inFlight = new Map<string, Promise<unknown>>();

  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = fn().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }
}