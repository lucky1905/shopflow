import { useEffect, useRef } from 'react';

export interface KeyboardShortcutOptions {
  /** Require Ctrl (Windows/Linux) or Cmd (macOS). */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** Ignore the shortcut while the user is typing in a field. */
  ignoreWhenTyping?: boolean;
  enabled?: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

/**
 * Global keyboard shortcut listener.
 *
 * @example useKeyboardShortcut('k', () => toggle(), { mod: true })
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = {},
): void {
  const {
    mod = false,
    shift = false,
    alt = false,
    ignoreWhenTyping = false,
    enabled = true,
  } = options;

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (mod && !(event.ctrlKey || event.metaKey)) return;
      if (!mod && (event.ctrlKey || event.metaKey)) return;
      if (shift !== event.shiftKey) return;
      if (alt !== event.altKey) return;
      if (ignoreWhenTyping && isTypingTarget(event.target)) return;

      callbackRef.current(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, mod, shift, alt, ignoreWhenTyping, enabled]);
}
