const ACCESS_TOKEN_KEY = 'rkpi.accessToken';
const REFRESH_TOKEN_KEY = 'rkpi.refreshToken';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenStore = {
  get(): StoredTokens | null {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        return null;
      }

      return { accessToken, refreshToken };
    } catch {
      return null;
    }
  },

  set(tokens: StoredTokens): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    } catch {
      // Private-mode/blocked storage: session simply won't survive a reload.
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Nothing to do if storage is unavailable.
    }
  },
};
