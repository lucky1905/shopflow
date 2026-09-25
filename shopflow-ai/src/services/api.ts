import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
import { tokenStorage } from '@/utils/storage';
import type { ApiError } from '@/types';

/* -------------------------------------------------------------------------- */
/*  Axios instance                                                            */
/* -------------------------------------------------------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  // Surface 4xx/5xx instead of silently succeeding on empty bodies.
  validateStatus: (status) => status >= 200 && status < 300,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* -------------------------------------------------------------------------- */
/*  Request interceptor â€“ attach the bearer token                             */
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

/**
 * Ensures concurrent 401s result in a single refresh request.
 */
let refreshPromise: Promise<string> | null = null;

/** Calls `POST /auth/refresh` and stores the rotated token pair. */
async function performRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // A bare axios call avoids re-entering this module's interceptors.
  const { data } = await axios.post<{
    access_token: string;
    refresh_token: string;
  }>(
    `${api.defaults.baseURL}${API_ENDPOINTS.AUTH_REFRESH}`,
    { refresh_token: refreshToken },
  );

  tokenStorage.setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

async function refreshAccessToken(): Promise<string> {
  // Concurrent 401s share a single in-flight refresh request.
  refreshPromise ??= performRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
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
  /** FastAPI's standard error field, e.g. "No product found with id 9." */
  detail?: string;
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
        body?.detail ??
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
/*  Response interceptor â€“ refresh once, then surface a friendly error        */
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
/*  Thin typed helpers â€“ use these inside services / TanStack Query hooks      */
/* -------------------------------------------------------------------------- */

/**
 * The FastAPI backend returns the resource directly (no `{ data }` envelope),
 * so this is an identity helper kept for call-site readability and to give one
 * place to unwrap an envelope if the API contract ever changes.
 */
export function unwrapData<T>(response: T): T {
  return response;
}

/** Raw JSON body from the backend (no { data } envelope). */
export async function httpGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

/** Raw JSON body from the backend (no { data } envelope). */
export async function httpPost<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function httpPut<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}

export async function httpPatch<T, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function httpDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}

export default api;




