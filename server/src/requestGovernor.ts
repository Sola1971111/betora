/**
 * SharpAPI's account-level limit is 12 requests/minute — shared across
 * every user of Betora, not per-user. This tracks how many upstream calls
 * have been made in the current rolling window and refuses new ones once
 * the budget is spent, so callers fall back to cached/stale data instead
 * of ever risking a 429. A small safety margin is kept below the true
 * limit (10 of 12) to absorb clock-skew/timing edge cases at the window
 * boundary — hitting 429 anyway defeats the whole point of this governor.
 */
class RequestGovernor {
  private windowStart = Date.now();
  private count = 0;
  private readonly limit: number;
  private readonly windowMs = 60_000;

  constructor(limit = 10) {
    this.limit = limit;
  }

  private resetIfNeeded() {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }
  }

  canSpend(): boolean {
    this.resetIfNeeded();
    return this.count < this.limit;
  }

  spend(): void {
    this.resetIfNeeded();
    this.count++;
  }

  remaining(): number {
    this.resetIfNeeded();
    return Math.max(0, this.limit - this.count);
  }
}

export const requestGovernor = new RequestGovernor();
