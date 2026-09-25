import { useKeyboardShortcut } from '@/hooks';

export interface UseExpressShortcutsOptions {
  /** Focus the search / barcode field. */
  focusSearch: () => void;
  /** Open payment for the current cart. */
  onCharge: () => void;
  /** Hold (park) the current bill. */
  onHold: () => void;
  /** Attach a customer to the bill. */
  onCustomer: () => void;
  /** Reset to an empty bill. */
  onNewBill: () => void;
  /** Abandon the bill and return to the normal POS view. */
  onCancel: () => void;
  /** Charge / hold are no-ops on an empty cart. */
  enabled: boolean;
}

/**
 * Express Billing keyboard workflow.
 *
 *   F1 / Ctrl+B  focus the barcode search field
 *   F2           open payment
 *   F3           hold bill
 *   F4           new customer
 *   Ctrl+N       new bill
 *   Esc          cancel
 *
 * F-keys bypass the typing guard so they work while the search field has
 * focus, which is the state the cashier is in almost all of the time.
 */
export function useExpressShortcuts({
  focusSearch,
  onCharge,
  onHold,
  onCustomer,
  onNewBill,
  onCancel,
  enabled,
}: UseExpressShortcutsOptions): void {
  const focus = (event: KeyboardEvent) => {
    event.preventDefault();
    focusSearch();
  };

  useKeyboardShortcut('F1', focus);
  useKeyboardShortcut('F2', (event) => {
    event.preventDefault();
    onCharge();
  }, { enabled });
  useKeyboardShortcut('F3', (event) => {
    event.preventDefault();
    onHold();
  }, { enabled });
  useKeyboardShortcut('F4', (event) => {
    event.preventDefault();
    onCustomer();
  }, { enabled });

  useKeyboardShortcut('b', (event) => {
    event.preventDefault();
    focusSearch();
  }, { mod: true, enabled });
  useKeyboardShortcut('n', (event) => {
    event.preventDefault();
    onNewBill();
  }, { mod: true, enabled });
  useKeyboardShortcut('Escape', (event) => {
    event.preventDefault();
    onCancel();
  }, { enabled });
}

