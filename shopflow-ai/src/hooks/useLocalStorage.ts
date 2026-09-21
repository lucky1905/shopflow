import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/utils/storage';

/**
 * `useState`-like hook backed by localStorage.
 * Mirrors writes made in other tabs via the `storage` event.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(
    () => storage.get<T>(key) ?? initialValue,
  );

  useEffect(() => {
    setStoredValue(storage.get<T>(key) ?? initialValue);
    // `initialValue` is intentionally excluded: it is a literal default.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        setStoredValue(JSON.parse(event.newValue) as T);
      } catch {
        /* ignore malformed payloads */
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((previous: T) => T)) => {
      setStoredValue((previous) => {
        const next =
          typeof value === 'function' ? (value as (prev: T) => T)(previous) : value;
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    storage.remove(key);
    setStoredValue(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue, removeValue];
}
