import { useCallback } from 'react';
import { useThemeStore } from '@/store';
import type { ResolvedTheme, ThemeMode } from '@/types';

export interface UseThemeReturn {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

/** Theme access with an ergonomic `isDark` flag for icons and chart colours. */
export function useTheme(): UseThemeReturn {
  const mode = useThemeStore((state) => state.mode);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleToggle = useCallback(() => toggleTheme(), [toggleTheme]);

  return {
    mode,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    toggleTheme: handleToggle,
  };
}