// Storage helpers – single access point for browser persistence.
import { STORAGE_KEYS } from '@/constants';

export const storage = {
  get<T>(key: string, fallback: T | null = null): T | null {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded / private mode – ignore */
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

/** Access-token helpers used by the axios interceptors. */
export const tokenStorage = {
  getAccessToken: () => storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN),
  setTokens: (accessToken: string, refreshToken?: string | null) => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  },
  clear: () => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },
};