import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request facts that cross-cutting code needs without threading them through every
 * service signature — today the audit stamps and log entries (ADR-036).
 */
export interface RequestContext {
  requestId: string;
  /** `employees.id` of the caller; null for anonymous requests and system jobs. */
  actorId: string | null;
  ipAddress: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
  return storage.run(context, callback);
}

/** Undefined outside an HTTP request, e.g. in cron jobs and scripts. */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Called once authentication knows who is acting (access token guard, login, refresh). */
export function setRequestActor(actorId: string | null): void {
  const context = storage.getStore();

  if (context) {
    context.actorId = actorId;
  }
}
