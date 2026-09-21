import { create } from "zustand";

interface AuthState {
  user: { firstName?: string; lastName?: string; email?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  checkAuth: () => set({ isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

