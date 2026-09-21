import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ROUTES } from '@/constants';
import { useAuthStore } from '@/store';
import type { ApiError, LoginCredentials, RegisterData, User } from '@/types';

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Sign in and redirect (honours `redirectTo` when provided). */
  login: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  register: (data: RegisterData, redirectTo?: string) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
}

/**
 * Single entry point for auth actions in components.
 * Handles navigation + toasts so pages stay declarative.
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login, register, logout, checkAuth } =
    useAuthStore();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      try {
        await login(credentials);
        toast.success('Welcome back!');
        navigate(redirectTo ?? ROUTES.DASHBOARD, { replace: true });
      } catch (error) {
        const message = (error as ApiError)?.message ?? 'Unable to sign in.';
        toast.error(message);
        throw error;
      }
    },
    [login, navigate],
  );

  const handleRegister = useCallback(
    async (data: RegisterData, redirectTo?: string) => {
      try {
        await register(data);
        toast.success('Your store is ready. Welcome to ShopFlow AI!');
        navigate(redirectTo ?? ROUTES.DASHBOARD, { replace: true });
      } catch (error) {
        const message = (error as ApiError)?.message ?? 'Unable to create your account.';
        toast.error(message);
        throw error;
      }
    },
    [register, navigate],
  );

  const handleLogout = useCallback(
    async (redirectTo: string = ROUTES.LOGIN) => {
      await logout();
      checkAuth();
      toast.success('You have been signed out.');
      navigate(redirectTo, { replace: true });
    },
    [logout, checkAuth, navigate],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}