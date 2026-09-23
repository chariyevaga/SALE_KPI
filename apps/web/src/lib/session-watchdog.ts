import { useEffect } from 'react';

import { ensureFreshSession } from './api-client';
import { tokenStore } from './token-store';
import { useAuthStore } from '../store/auth-store';

/** How often the session deadline is re-checked while the app is open. */
const CHECK_INTERVAL_MS = 15_000;
/** Rotate this long before the deadline so an active user never walks into it. */
const RENEW_BEFORE_EXPIRY_MS = 5 * 60_000;
/** Interaction older than this no longer counts as "the user is still at the screen". */
const ACTIVITY_WINDOW_MS = 60_000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Keeps the stored session and the signed-in UI in agreement.
 *
 * Token rotation normally rides along with API traffic, but a user can read a screen or fill a
 * form for a long time without triggering a single request. So while the user is interacting the
 * watchdog rotates the pair before it lapses — which slides a short session's window forward — and
 * once the tokens are gone it ends the session, which sends the router back to the login page.
 */
export function useSessionWatchdog(): void {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let lastActivityAt = Date.now();

    function markActivity(): void {
      lastActivityAt = Date.now();
    }

    function check(): void {
      const session = tokenStore.get();

      if (!session) {
        // Short-session cookies expire inside the browser; nothing else reports that.
        clearSession('expired');
        return;
      }

      const now = Date.now();
      const isActive = now - lastActivityAt < ACTIVITY_WINDOW_MS;

      if (isActive && session.expiresAt - now < RENEW_BEFORE_EXPIRY_MS) {
        void ensureFreshSession();
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        // Coming back from a locked screen can land well past the deadline; don't wait for the tick.
        markActivity();
        check();
      }
    }

    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, markActivity, { passive: true });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, markActivity);
      }

      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, clearSession]);
}
