import { AsyncLocalStorage } from 'node:async_hooks';

const scope = new AsyncLocalStorage<true>();

/**
 * Marks writes as coming from AuditService so AuditGuardSubscriber lets them through.
 * Only AuditService may call this; any other caller would bypass the record trail.
 */
export function runAuditWrite<T>(callback: () => Promise<T>): Promise<T> {
  return scope.run(true, callback);
}

export function isAuditWrite(): boolean {
  return scope.getStore() === true;
}
