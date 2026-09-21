import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
import { tokenStorage } from '@/utils/storage';
import type { ApiError, ApiResponse } from '@/types';

/* -------------------------------------------------------------------------- */
/*  Axios instance                                                            */
/* -------------------------------------------------------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* -------------------------------------------------------------------------- */
/*  Request interceptor – attach the bearer token                             */
/* -------------------------------------------------------------------------- */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the multipart boundary for file uploads.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/* -------------------------------------------------------------------------- */
/*  Refresh-token plumbing (placeholder)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Ensures concurrent 401s result in a single refresh request.
 * Replace `refreshAccessToken` with the real endpoint when the backend lands.
 */
let refreshPromise: Promise<string> | null = null;

/**
 * TODO(backend): implement the real refresh call here, e.g.
 *   const { data } = await axios.post<ApiResponse<{ token: string }>>(
 *     `${api.defaults.baseURL}${API_ENDPOINTS.AUTH_REFRESH}`,
 *     { refreshToken: tokenStorage.getRefreshToken() },
 *   );
 *   tokenStorage.setTokens(data.data.token, data.data.refreshToken);
 *   return data.data.token;
 *
 * Until then it rejects so the 401 handler clears the local session.
 */
async function performRefresh(): Promise<string> {
  throw new Error(`Refresh endpoint not implemented (${API_ENDPOINTS.AUTH_REFRESH})`);
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Concurrent 401s share a single in-flight refresh request.
  refreshPromise ??= performRefresh();

  try {
    const token = await refreshPromise;
    tokenStorage.setTokens(token);
    return token;
  } finally {
    refreshPromise = null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Auth side-effects (decoupled from the store to avoid circular imports)     */
/* -------------------------------------------------------------------------- */

/** Fired when the session can no longer be recovered. */
function handleSessionExpired(): void {
  tokenStorage.clear();
  localStorage.removeItem(STORAGE_KEYS.USER);

  toast.error('Your session has expired. Please sign in again.');

  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?redirect=${redirect}`);
  }
}

/* -------------------------------------------------------------------------- */
/*  Error mapping                                                             */
/* -------------------------------------------------------------------------- */

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Some fields need your attention.',
  429: 'Too many requests. Please slow down.',
  500: 'Something went wrong on our end. Please try again.',
  502: 'The server is temporarily unavailable.',
  503: 'The service is under maintenance. Please try again shortly.',
};

interface ServerErrorBody {
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/** Normalise any thrown value into a predictable `ApiError`. */
export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ServerErrorBody>;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;

    if (!axiosError.response) {
      const isTimeout = axiosError.code === 'ECONNABORTED';
      return {
        status: 0,
        code: axiosError.code,
        message: isTimeout
          ? 'The request timed out. Please try again.'
          : 'Network error. Please check your connection.',
      };
    }

    return {
      status,
      code: body?.code ?? axiosError.code,
      message:
        body?.message ??
        body?.error ??
        (status ? FALLBACK_MESSAGES[status] : undefined) ??
        'An unexpected error occurred.',
      details: body?.errors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred.' };
}

/* -------------------------------------------------------------------------- */
/*  Response interceptor – refresh once, then surface a friendly error        */
/* -------------------------------------------------------------------------- */

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = originalRequest?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return await api(originalRequest);
      } catch {
        handleSessionExpired();
        return Promise.reject(normalizeApiError(error));
      }
    }

    if (status === 401 && !isAuthCall) {
      handleSessionExpired();
    }

    return Promise.reject(normalizeApiError(error));
  },
);

/* -------------------------------------------------------------------------- */
/*  Thin typed helpers – use these inside services / TanStack Query hooks      */
/* -------------------------------------------------------------------------- */

export async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, config);
  return data;
}

export async function httpPost<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, body, config);
  return data;
}

export async function httpPut<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const { data } = await api.put<ApiResponse<T>>(url, body, config);
  return data;
}

export async function httpPatch<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const { data } = await api.patch<ApiResponse<T>>(url, body, config);
  return data;
}

export async function httpDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const { data } = await api.delete<ApiResponse<T>>(url, config);
  return data;
}

export default api;