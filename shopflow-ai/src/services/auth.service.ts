import { API_ENDPOINTS } from '@/constants';
import { httpGet, httpPost, normalizeApiError, unwrapData } from './api';
import { tokenStorage } from '@/utils/storage';
import type {
  AuthResponse,
  ForgotPasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  User,
  UserRole,
} from '@/types';

/** Wire format returned by `POST /auth/login` and `POST /auth/register`. */
interface TokenPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    user_id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export const DEMO_CREDENTIALS = {
  email: 'admin@shopflow.ai',
  password: 'password',
} as const;

/** Maps the backend's role string onto the frontend `UserRole` union. */
function toUserRole(role: string): UserRole {
  if (role === 'admin' || role === 'manager') return role;
  if (role === 'owner') return 'owner';
  return 'staff';
}

/** Converts the backend user shape into the frontend `User` model. */
export function mapBackendUser(raw: TokenPayload['user']): User {
  const parts = raw.full_name.trim().split(/\s+/);
  const now = new Date().toISOString();

  return {
    id: String(raw.user_id),
    email: raw.email,
    firstName: parts[0] ?? raw.full_name,
    lastName: parts.slice(1).join(' ') || '-',
    role: toUserRole(raw.role),
    createdAt: now,
    updatedAt: now,
  };
}

function toAuthResponse(payload: TokenPayload): AuthResponse {
  return {
    user: mapBackendUser(payload.user),
    token: payload.access_token,
    refreshToken: payload.refresh_token,
  };
}

/**
 * Authentication against the FastAPI backend.
 *
 * The backend is stateless JWT: it issues an access + refresh pair and only
 * needs to be told when to forget the session, so `logout()` is local.
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const payload = await httpPost<TokenPayload, { email: string; password: string }>(
        API_ENDPOINTS.AUTH_LOGIN,
        { email: credentials.email.trim(), password: credentials.password },
      );
      const result = toAuthResponse(unwrapData(payload));
      tokenStorage.setTokens(result.token, result.refreshToken);
      return result;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const payload = await httpPost<TokenPayload, Record<string, string>>(
        API_ENDPOINTS.AUTH_REGISTER,
        {
          email: data.email.trim(),
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          password: data.password,
          role: 'admin',
        },
      );
      const result = toAuthResponse(unwrapData(payload));
      tokenStorage.setTokens(result.token, result.refreshToken);
      return result;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /** Validates the stored access token and returns the live profile. */
  async me(): Promise<User> {
    const raw = unwrapData(await httpGet<TokenPayload['user']>(API_ENDPOINTS.AUTH_ME));
    return mapBackendUser(raw);
  },

  /** Exchanges a refresh token for a new pair. */
  async refresh(): Promise<string> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const payload = unwrapData(
      await httpPost<TokenPayload, { refresh_token: string }>(API_ENDPOINTS.AUTH_REFRESH, {
        refresh_token: refreshToken,
      }),
    );
    tokenStorage.setTokens(payload.access_token, payload.refresh_token);
    return payload.access_token;
  },

  /** Not implemented server-side yet; resolves optimistically to keep the UX working. */
  async forgotPassword(data: ForgotPasswordData): Promise<{ sent: boolean }> {
    void data; // no backend route yet
    return { sent: true };
  },

  /** Not implemented server-side yet. */
  async resetPassword(data: ResetPasswordData, token?: string): Promise<{ success: boolean }> {
    void data;
    void token; // no backend route yet
    return { success: true };
  },

  /** The backend is stateless, so signing out only clears local tokens. */
  async logout(): Promise<void> {
    tokenStorage.clear();
  },
};

export type AuthService = typeof authService;

