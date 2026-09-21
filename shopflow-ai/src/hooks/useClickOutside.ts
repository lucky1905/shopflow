import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `handler` when a pointerdown/ESC interaction happens outside the
 * referenced element. Used by dropdowns, popovers and the profile menu.
 *
 * @param enabled Set to `false` to suspend listening (e.g. while closed).
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  enabled = true,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element || element.contains(event.target as Node)) return;
      handlerRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handlerRef.current();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return ref;
}
