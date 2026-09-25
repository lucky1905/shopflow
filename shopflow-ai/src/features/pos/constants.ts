import { Banknote, BookUser, CreditCard, Smartphone, SplitSquareVertical } from 'lucide-react';
import type { BadgeVariant, LucideIconLike } from '@/types';
import type {
  PaymentMethod,
  RecommendationTag,
  RefundMethod,
  ReturnReason,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Payment methods                                                           */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHODS = ['cash', 'card', 'mobile'] as const;

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; hint: string; badge: BadgeVariant; icon: LucideIconLike }
> = {
  cash: {
    label: 'Cash',
    hint: 'Record tendered cash and calculate change',
    badge: 'success',
    icon: Banknote,
  },
  card: {
    label: 'Card',
    hint: 'Credit / debit terminal',
    badge: 'info',
    icon: CreditCard,
  },
  mobile: {
    label: 'UPI',
    hint: 'GPay, PhonePe, Paytm, BHIM QR',
    badge: 'gradient',
    icon: Smartphone,
  },
  credit: {
    label: 'Credit (Udhar)',
    hint: 'Customer pays later against a credit balance',
    badge: 'warning',
    icon: BookUser,
  },
  split: {
    label: 'Split Payment',
    hint: 'Combine two or more tenders on one bill',
    badge: 'default',
    icon: SplitSquareVertical,
  },
};

/* -------------------------------------------------------------------------- */
/*  Tax                                                                       */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TAX_RATE_PCT = 8.25;

export const TAX_RATE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '0', label: 'Tax exempt (0%)' },
  { value: '5', label: '5%' },
  { value: '7.5', label: '7.5%' },
  { value: '8.25', label: '8.25% (default)' },
  { value: '10', label: '10%' },
  { value: '20', label: '20% (VAT)' },
];

/* -------------------------------------------------------------------------- */
/*  Discounts & cash handling                                                 */
/* -------------------------------------------------------------------------- */

/** Percent presets shown in the order-discount modal. */
export const QUICK_DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25] as const;

/** Quick cash buttons (bills the customer may hand over). */
export const CASH_DENOMINATIONS = [5, 10, 20, 50, 100] as const;

/* -------------------------------------------------------------------------- */
/*  Limits                                                                    */
/* -------------------------------------------------------------------------- */

export const MAX_LINE_QUANTITY = 999;
export const MAX_SEARCH_LENGTH = 60;
export const HISTORY_PAGE_SIZE = 8;

/* -------------------------------------------------------------------------- */
/*  Returns                                                                   */
/* -------------------------------------------------------------------------- */

export const RETURN_REASON_META: Record<ReturnReason, { label: string }> = {
  defective: { label: 'Defective / damaged' },
  wrong_item: { label: 'Wrong item' },
  changed_mind: { label: 'Changed mind' },
  expired: { label: 'Expired' },
  other: { label: 'Other' },
};

export const RETURN_REASONS = Object.keys(RETURN_REASON_META) as ReturnReason[];

export const REFUND_METHOD_META: Record<
  RefundMethod,
  { label: string; description: string }
> = {
  original: {
    label: 'Original method',
    description: 'Refund back to the card / wallet used at checkout',
  },
  cash: {
    label: 'Cash',
    description: 'Hand back cash from the drawer',
  },
  store_credit: {
    label: 'Store credit',
    description: 'Issue credit the customer can spend later',
  },
};

export const REFUND_METHOD_OPTIONS = (Object.keys(REFUND_METHOD_META) as RefundMethod[]).map(
  (value) => ({ value, label: REFUND_METHOD_META[value].label }),
);

/* -------------------------------------------------------------------------- */
/*  AI recommendations                                                        */
/* -------------------------------------------------------------------------- */

export const RECOMMENDATION_TAG_META: Record<
  RecommendationTag,
  { label: string; badge: BadgeVariant }
> = {
  frequent: { label: 'Frequent', badge: 'success' },
  cross_sell: { label: 'Cross-sell', badge: 'info' },
  upsell: { label: 'Upsell', badge: 'warning' },
};

/* -------------------------------------------------------------------------- */
/*  Keyboard shortcuts (shown in the header help popover)                     */
/* -------------------------------------------------------------------------- */

export const POS_SHORTCUTS = [
  { keys: '/', description: 'Focus product search' },
  { keys: 'Enter', description: 'Add scanned barcode or top match' },
  { keys: 'F4', description: 'Hold the current cart' },
  { keys: 'F9', description: 'Open payment' },
  { keys: 'Esc', description: 'Close any dialog' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Receipt                                                                   */
/* -------------------------------------------------------------------------- */

export const RECEIPT_FOOTER = 'Thank you for shopping with us!';

