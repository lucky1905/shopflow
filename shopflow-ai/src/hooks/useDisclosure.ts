import { useCallback, useMemo, useState } from 'react';

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (value: boolean) => void;
}

/**
 * Boolean open/close state with memoised handlers – the standard way to drive
 * modals, drawers and confirmation dialogs in this codebase.
 */
export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  return useMemo(
    () => ({ isOpen, open, close, toggle, setIsOpen }),
    [isOpen, open, close, toggle],
  );
}
