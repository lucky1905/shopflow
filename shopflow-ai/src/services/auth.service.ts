import { API_ENDPOINTS } from '@/constants';
import { sleep } from '@/lib/utils';
import { tokenStorage } from '@/utils/storage';
import { httpPost, normalizeApiError } from './api';
import type {
  ApiResponse,
  AuthResponse,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  User,
} from '@/types';

/**
 * Until the ShopFlow backend is live the auth service runs against an
 * in-memory mock. Set `VITE_USE_MOCK_API=false` (see `.env.example`) to hit
 * the real endpoints – every call already points at `API_ENDPOINTS`.
 */
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
const MOCK_LATENCY_MS = 900;

export const DEMO_CREDENTIALS = {
  email: 'admin@shopflow.ai',
  password: 'password',
} as const;

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw { message: response.message ?? 'Request failed' } as const;
  }
  return response.data;
}

function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  return {
    id: 'usr_1',
    email: DEMO_CREDENTIALS.email,
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'owner',
    storeId: 'store_1',
    storeName: 'ShopFlow Main Store',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  await sleep(MOCK_LATENCY_MS);

  const isValid =
    credentials.email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    credentials.password === DEMO_CREDENTIALS.password;

  if (!isValid) {
    throw { message: 'Invalid email or password.', status: 401 } as const;
  }

  return {
    user: createMockUser({ email: credentials.email }),
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

async function mockRegister(data: RegisterData): Promise<AuthResponse> {
  await sleep(MOCK_LATENCY_MS);

  return {
    user: createMockUser({
      id: `usr_${Date.now().toString(36)}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'owner',
      storeId: `store_${Date.now().toString(36)}`,
      storeName: data.storeName,
    }),
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const result = USE_MOCK_API
        ? await mockLogin(credentials)
        : unwrap(await httpPost<AuthResponse, LoginCredentials>(API_ENDPOINTS.AUTH_LOGIN, credentials));

      tokenStorage.setTokens(result.token, result.refreshToken);
      return result;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const result = USE_MOCK_API
        ? await mockRegister(data)
        : unwrap(await httpPost<AuthResponse, RegisterData>(API_ENDPOINTS.AUTH_REGISTER, data));

      tokenStorage.setTokens(result.token, result.refreshToken);
      return result;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /** Request a password-reset email. Always resolves (no account enumeration). */
  async forgotPassword(data: ForgotPasswordData): Promise<{ sent: boolean }> {
    try {
      if (USE_MOCK_API) {
        await sleep(MOCK_LATENCY_MS);
        return { sent: true };
      }
      return unwrap(await httpPost<{ sent: boolean }, ForgotPasswordData>(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, data));
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /** Complete a password reset using the token from the email link. */
  async resetPassword(data: ResetPasswordData, token?: string): Promise<{ success: boolean }> {
    try {
      if (USE_MOCK_API) {
        await sleep(MOCK_LATENCY_MS);
        return { success: true };
      }
      return unwrap(
        await httpPost<{ success: boolean }, ResetPasswordData>(
          API_ENDPOINTS.AUTH_RESET_PASSWORD,
          data,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
        ),
      );
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      if (!USE_MOCK_API) {
        await httpPost<null>(API_ENDPOINTS.AUTH_LOGOUT);
      }
    } catch {
      /* logging out locally must never fail */
    } finally {
      tokenStorage.clear();
    }
  },
};

export type AuthService = typeof authService;