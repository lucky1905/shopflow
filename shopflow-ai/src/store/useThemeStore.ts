import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import type { ResolvedTheme, ThemeMode, ThemeState } from '@/types';

interface ThemeStore extends ThemeState {
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  /** Resolve the active mode against the OS preference. */
  resolveTheme: (mode?: ThemeMode) => ResolvedTheme;
  /** Push the resolved theme onto <html> (dark mode is class-based). */
  applyTheme: (theme?: ResolvedTheme) => void;
}

const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MEDIA_QUERY).matches;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedTheme: systemPrefersDark() ? 'dark' : 'light',

      setTheme: (mode) => {
        const resolvedTheme = get().resolveTheme(mode);
        set({ mode, resolvedTheme });
        get().applyTheme(resolvedTheme);
      },

      toggleTheme: () => {
        const next: ResolvedTheme = get().resolvedTheme === 'dark' ? 'light' : 'dark';
        set({ mode: next, resolvedTheme: next });
        get().applyTheme(next);
      },

      resolveTheme: (mode) => {
        const activeMode = mode ?? get().mode;
        if (activeMode === 'system') {
          return systemPrefersDark() ? 'dark' : 'light';
        }
        return activeMode;
      },

      applyTheme: (theme) => {
        const resolved = theme ?? get().resolvedTheme;
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.classList.toggle('dark', resolved === 'dark');
        root.style.colorScheme = resolved;
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      partialize: (state) => ({ mode: state.mode, resolvedTheme: state.resolvedTheme }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const resolved = state.resolveTheme();
        state.resolvedTheme = resolved;
        state.applyTheme(resolved);
      },
    },
  ),
);

/** Subscribe to OS theme changes while `mode === 'system'`. */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const media = window.matchMedia(MEDIA_QUERY);
  const listener = () => {
    const { mode, resolveTheme, applyTheme } = useThemeStore.getState();
    if (mode !== 'system') return;
    const resolved = resolveTheme('system');
    useThemeStore.setState({ resolvedTheme: resolved });
    applyTheme(resolved);
  };

  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}