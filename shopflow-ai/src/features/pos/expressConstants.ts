import type { PaymentMethod } from './types';

export interface ExpressPaymentOption {
  id: PaymentMethod;
  /** Short label shown on the button. */
  label: string;
  /** Hint under the label, e.g. "Most used in India". */
  hint: string;
  emoji: string;
  /** Rendered larger and first - the dominant Indian tender. */
  primary?: boolean;
}

/**
 * Payment tenders offered in Express Billing.
 *
 * UPI is flagged `primary` because it dominates Indian retail, so it is
 * rendered first and visually emphasised. "Credit" is the shopkeeper-friendly
 * name for udhar (store credit) and is what gets sent to the backend.
 */
export const EXPRESS_PAYMENT_OPTIONS: readonly ExpressPaymentOption[] = [
  { id: 'mobile', label: 'UPI', hint: 'GPay, PhonePe, Paytm', emoji: '📱', primary: true },
  { id: 'cash', label: 'Cash', hint: 'Rupees / notes', emoji: '💵' },
  { id: 'card', label: 'Card', hint: 'Debit / credit', emoji: '💳' },
  { id: 'credit', label: 'Credit', hint: 'Udhar - pay later', emoji: '📒' },
  { id: 'split', label: 'Split', hint: 'Two or more tenders', emoji: '⭐' },
];

/** Keyboard shortcut hints rendered on the Express payment bar. */
export const EXPRESS_SHORTCUTS: ReadonlyArray<{ keys: string; action: string }> = [
  { keys: 'F1', action: 'Search' },
  { keys: 'F2', action: 'Payment' },
  { keys: 'F3', action: 'Hold bill' },
  { keys: 'F4', action: 'New customer' },
  { keys: 'Ctrl+B', action: 'Barcode' },
  { keys: 'Ctrl+N', action: 'New bill' },
  { keys: 'Esc', action: 'Cancel' },
];

/** Maps a tender to the value stored in the backend `payment_method` column. */
export const toBackendPaymentMethod = (method: PaymentMethod): string => {
  switch (method) {
    case 'mobile':
      return 'upi';
    case 'card':
      return 'card';
    case 'credit':
      return 'credit';
    case 'split':
      return 'split';
    default:
      return 'cash';
  }
};
