/**
 * Token storage with two lifetimes, picked by the "remember me" checkbox at login.
 *
 * - remember me off → browser cookies whose Max-Age mirrors the refresh token's own
 *   expiry (the API's SHORT_SESSION_TTL). Every rotation rewrites them, so the window
 *   slides while the session is in use and the browser drops the tokens on its own once
 *   the session has been idle for that long.
 * - remember me on → localStorage, so the session survives browser restarts until the
 *   refresh token's REFRESH_TOKEN_TTL runs out.
 *
 * The API itself never reads or writes cookies; these are client-side buckets only.
 */

const ACCESS_TOKEN_KEY = 'rkpi.accessToken';
const REFRESH_TOKEN_KEY = 'rkpi.refreshToken';
const EXPIRES_AT_KEY = 'rkpi.sessionExpiresAt';

const STORAGE_KEYS = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRES_AT_KEY];

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  /** Refresh token deadline as epoch milliseconds; the session is dead past this point. */
  expiresAt: number;
  /** true when the user asked to be remembered, so the session lives in localStorage. */
  persistent: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;

  for (const entry of document.cookie.split('; ')) {
    if (entry.startsWith(prefix)) {
      return decodeURIComponent(entry.slice(prefix.length));
    }
  }

  return null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  // Secure is skipped on plain HTTP so local development keeps working; production runs behind HTTPS.
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Strict${secure}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
}

function readLocalSession(): StoredSession | null {
  try {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY));

    if (!accessToken || !refreshToken || !Number.isFinite(expiresAt)) {
      return null;
    }

    return { accessToken, expiresAt, persistent: true, refreshToken };
  } catch {
    return null;
  }
}

function readCookieSession(): StoredSession | null {
  const accessToken = readCookie(ACCESS_TOKEN_KEY);
  const refreshToken = readCookie(REFRESH_TOKEN_KEY);
  const expiresAt = Number(readCookie(EXPIRES_AT_KEY));

  if (!accessToken || !refreshToken || !Number.isFinite(expiresAt)) {
    return null;
  }

  return { accessToken, expiresAt, persistent: false, refreshToken };
}

function clearStorage(): void {
  for (const key of STORAGE_KEYS) {
    deleteCookie(key);

    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  }
}

export const tokenStore = {
  /** Returns the live session, or null once it has expired or was never stored. */
  get(): StoredSession | null {
    const session = readLocalSession() ?? readCookieSession();

    if (!session) {
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      // Cookies expire themselves, localStorage does not — drop it either way.
      tokenStore.clear();
      return null;
    }

    return session;
  },

  set(session: StoredSession): void {
    // Switching between the two lifetimes must not leave a stale copy in the other bucket.
    clearStorage();

    if (session.persistent) {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
        localStorage.setItem(EXPIRES_AT_KEY, String(session.expiresAt));
      } catch {
        // Private-mode/blocked storage: the session simply won't survive a reload.
      }
    } else {
      const maxAgeSeconds = Math.max(1, Math.ceil((session.expiresAt - Date.now()) / 1000));
      writeCookie(ACCESS_TOKEN_KEY, session.accessToken, maxAgeSeconds);
      writeCookie(REFRESH_TOKEN_KEY, session.refreshToken, maxAgeSeconds);
      writeCookie(EXPIRES_AT_KEY, String(session.expiresAt), maxAgeSeconds);
    }

    notify();
  },

  clear(): void {
    clearStorage();
    notify();
  },

  /** Notifies on every local write/clear, and on sign-outs from another tab. */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

// A "remember me" sign-out in one tab must not leave the others believing they are signed in.
window.addEventListener('storage', (event) => {
  if (event.storageArea === localStorage && (event.key === null || STORAGE_KEYS.includes(event.key))) {
    notify();
  }
});
