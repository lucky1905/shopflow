import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ROUTES, homePathForRole } from '@/constants';
import { useAuthStore } from '@/store';
import type {
  ApiError,
  EmployeeLoginCredentials,
  LoginCredentials,
  RegisterData,
  User,
} from '@/types';

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** `true` when the session came through the employee (staff) login flow. */
  isEmployeeSession: boolean;
  /** Sign in and redirect (honours `redirectTo` when provided). */
  login: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  /** Owner sign-in — always lands on the command centre. */
  loginAsOwner: (credentials: LoginCredentials, redirectTo?: string) => Promise<void>;
  /** Employee sign-in by badge code — always lands on the counter till. */
  loginAsEmployee: (credentials: EmployeeLoginCredentials, redirectTo?: string) => Promise<void>;
  register: (data: RegisterData, redirectTo?: string) => Promise<void>;
  logout: (redirectTo?: string) => Promise<void>;
}

/**
 * Single entry point for auth actions in components.
 * Handles navigation + toasts so pages stay declarative.
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    adminLogin,
    employeeLogin,
    register,
    logout,
    checkAuth,
  } = useAuthStore();

  /** `true` when the session came through the employee (staff) login flow. */
  const isEmployeeSession = user?.workspace === 'employee';

  const handleLogin = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      try {
        const response = await login(credentials);
        toast.success('Welcome back!');
        const target = redirectTo ?? homePathForRole(response.user.role);
        navigate(target, { replace: true });
      } catch (error) {
        const message = (error as ApiError)?.message ?? 'Unable to sign in.';
        toast.error(message);
        throw error;
      }
    },
    [login, navigate],
  );

  const handleOwnerLogin = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      try {
        await adminLogin(credentials);
        toast.success('Welcome back, Boss!');
        navigate(redirectTo ?? ROUTES.DASHBOARD, { replace: true });
      } catch (error) {
        const message = (error as ApiError)?.message ?? 'Unable to sign in.';
        toast.error(message);
        throw error;
      }
    },
    [adminLogin, navigate],
  );

  const handleEmployeeLogin = useCallback(
    async (credentials: EmployeeLoginCredentials, redirectTo?: string) => {
      try {
        await employeeLogin(credentials);
        toast.success('Shift started. Have a great day!');
        navigate(redirectTo ?? ROUTES.EMPLOYEE_BILLING, { replace: true });
      } catch (error) {
        const message = (error as ApiError)?.message ?? 'Unable to start shift.';
        toast.error(message);
        throw error;
      }
    },
    [employeeLogin, navigate],
  );

  const handleRegister = useCallback(
    async (data: RegisterData, redirectTo?: string) => {
      try {
        const response = await register(data);
        toast.success('Your store is ready. Welcome to ShopFlow AI!');
        const target = redirectTo ?? homePathForRole(response.user.role);
        navigate(target, { replace: true });
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
    isEmployeeSession,
    login: handleLogin,
    loginAsOwner: handleOwnerLogin,
    loginAsEmployee: handleEmployeeLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}