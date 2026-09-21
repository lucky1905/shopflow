import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { useThemeStore, watchSystemTheme } from '@/store/useThemeStore';

/**
 * Bootstraps global client state once at app start:
 *  - applies the persisted theme (light / dark / system)
 *  - re-hydrates the persisted session (`checkAuth`)
 *  - mirrors OS theme changes while `mode === 'system'`
 *
 * Rendered by `AppProviders`, so layouts can assume state is ready.
 */
export function useAppBootstrap(): { isBootstrapped: boolean } {
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const { applyTheme, resolveTheme } = useThemeStore.getState();
    applyTheme(resolveTheme());
    checkAuth();
    setIsBootstrapped(true);
  }, [checkAuth]);

  useEffect(() => watchSystemTheme(), []);

  return { isBootstrapped };
}