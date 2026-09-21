import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { tokenStorage, storage } from '@/utils/storage';
import { authService } from '@/services/auth.service';
import type { ApiError, AuthState, AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** Re-hydrate the session from storage on boot. */
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null, token: null });
          throw error as ApiError;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return response;
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null, token: null });
          throw error as ApiError;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await authService.logout();
        storage.remove(STORAGE_KEYS.USER);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setUser: (user) => {
        set({ user });
        if (user) {
          storage.set(STORAGE_KEYS.USER, user);
        } else {
          storage.remove(STORAGE_KEYS.USER);
        }
      },

      checkAuth: () => {
        const token = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        const user = get().user ?? storage.get<User>(STORAGE_KEYS.USER);

        if (token && user) {
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false });
        } else {
          tokenStorage.clear();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        // `isLoading` starts as `true`; `checkAuth()` settles it on mount.
        if (!state) return;
        const token = tokenStorage.getAccessToken();
        state.isAuthenticated = Boolean(token && state.user);
      },
    },
  ),
);