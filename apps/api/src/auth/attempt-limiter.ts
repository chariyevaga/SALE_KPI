import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Counts failed attempts per key (a username, an IP, an employee) in memory and blocks a key
 * that failed too often. It guards password entry against guessing: sign-in and the "current
 * password" of a password change. Like the scheduled jobs, it assumes a single API replica
 * (ADR-014); a restart forgets the counts, which only ever lets someone try again sooner.
 */
export interface AttemptLimit {
  /** Failures allowed inside `windowMs`; the next one blocks the key. */
  maxFailures: number;
  windowMs: number;
  /** How long a blocked key stays blocked. */
  blockMs: number;
}

interface KeyState {
  failures: number[];
  blockedUntil: number | null;
}

/** Keys with no recent failure are forgotten once the map grows past this. */
const PRUNE_ABOVE = 10_000;

export class AttemptLimiter {
  private readonly keys = new Map<string, KeyState>();

  constructor(
    private readonly limit: AttemptLimit,
    private readonly now: () => number = Date.now,
  ) {}

  /** Seconds until `key` may try again, or 0 when it is not blocked. */
  retryAfterSeconds(key: string): number {
    const state = this.keys.get(key);
    const current = this.now();

    if (!state?.blockedUntil || state.blockedUntil <= current) {
      return 0;
    }

    return Math.ceil((state.blockedUntil - current) / 1000);
  }

  recordFailure(key: string): void {
    const current = this.now();
    const state = this.keys.get(key) ?? { failures: [], blockedUntil: null };

    state.failures = state.failures.filter((at) => at > current - this.limit.windowMs);
    state.failures.push(current);

    if (state.failures.length >= this.limit.maxFailures) {
      state.blockedUntil = current + this.limit.blockMs;
      state.failures = [];
    }

    this.keys.set(key, state);
    this.prune(current);
  }

  /** A success clears the key, so a person who finally types it right starts over. */
  reset(key: string): void {
    this.keys.delete(key);
  }

  private prune(current: number): void {
    if (this.keys.size <= PRUNE_ABOVE) {
      return;
    }

    for (const [key, state] of this.keys) {
      const blocked = state.blockedUntil !== null && state.blockedUntil > current;
      const recent = state.failures.some((at) => at > current - this.limit.windowMs);

      if (!blocked && !recent) {
        this.keys.delete(key);
      }
    }
  }
}

/** 429 with how long to wait; the web client turns it into "try again in N minutes". */
export function tooManyAttempts(retryAfterSeconds: number): HttpException {
  return new HttpException(
    {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: `Too many failed attempts. Try again in ${retryAfterSeconds} seconds.`,
      code: 'AUTH_TOO_MANY_ATTEMPTS',
      retryAfterSeconds,
    },
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
