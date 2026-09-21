import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useNotificationStore } from '@/store';
import type { ApiError, NotificationType } from '@/types';

const DEFAULT_DURATION = 4000;

export interface UseToastReturn {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  /** Show a toast from any thrown value (ApiError | Error | string). */
  fromError: (error: unknown) => void;
  /** Also pushes into the in-app notification panel. */
  notify: (type: NotificationType, title: string, message: string) => void;
  dismiss: (id?: string) => void;
}

/** Thin, consistent wrapper around react-hot-toast. */
export function useToast(): UseToastReturn {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const success = useCallback((message: string) => {
    toast.success(message, { duration: DEFAULT_DURATION });
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message, { duration: DEFAULT_DURATION + 2000 });
  }, []);

  const info = useCallback((message: string) => {
    toast(message, { icon: 'ℹ️', duration: DEFAULT_DURATION });
  }, []);

  const warning = useCallback((message: string) => {
    toast(message, { icon: '⚠️', duration: DEFAULT_DURATION + 1000 });
  }, []);

  const fromError = useCallback(
    (unknownError: unknown) => {
      const message =
        typeof unknownError === 'string'
          ? unknownError
          : ((unknownError as ApiError)?.message ?? 'Something went wrong. Please try again.');
      toast.error(message, { duration: DEFAULT_DURATION + 2000 });
    },
    [],
  );

  const notify = useCallback(
    (type: NotificationType, title: string, message: string) => {
      addNotification({ type, title, message });
      if (type === 'success') success(title);
      else if (type === 'error') error(title);
      else if (type === 'warning') warning(title);
      else info(title);
    },
    [addNotification, success, error, warning, info],
  );

  const dismiss = useCallback((id?: string) => toast.dismiss(id), []);

  return useMemo(
    () => ({ success, error, info, warning, fromError, notify, dismiss }),
    [success, error, info, warning, fromError, notify, dismiss],
  );
}