import { useKeyboardShortcut } from '@/hooks';

export interface UsePosShortcutsOptions {
  /** Focus the product / barcode search field. */
  focusSearch: () => void;
  /** Open the payment modal (cart must be chargeable). */
  onCharge: () => void;
  /** Hold (park) the current cart. */
  onHold: () => void;
  /** `false` while the cart is empty (charge/hold are no-ops). */
  enabled: boolean;
}

/**
 * Global POS keyboard shortcuts:
 *   `/` focus search · `F4` hold cart · `F9` charge.
 * F-keys bypass the typing guard (they never conflict with text input).
 */
export function usePosShortcuts({
  focusSearch,
  onCharge,
  onHold,
  enabled,
}: UsePosShortcutsOptions): void {
  useKeyboardShortcut(
    '/',
    (event) => {
      event.preventDefault();
      focusSearch();
    },
    { ignoreWhenTyping: true },
  );

  useKeyboardShortcut(
    'F4',
    (event) => {
      event.preventDefault();
      onHold();
    },
    { enabled },
  );

  useKeyboardShortcut(
    'F9',
    (event) => {
      event.preventDefault();
      onCharge();
    },
    { enabled },
  );
}