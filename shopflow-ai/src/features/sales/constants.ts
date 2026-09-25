import type { BadgeVariant } from '@/types';
import type {
  ChannelPoint,
  InvoiceStatus,
  PaymentStatus,
  RefundStatus,
  SalesChannel,
  SalesDateRange,
  SalesFilters,
  SalesReturnFilters,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Status metadata                                                           */
/* -------------------------------------------------------------------------- */

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'paid',
  'partial',
  'overdue',
  'void',
] as const;

export const INVOICE_STATUS_META: Record<
  InvoiceStatus,
  { label: string; badge: BadgeVariant }
> = {
  draft: { label: 'Draft', badge: 'outline' },
  sent: { label: 'Sent', badge: 'info' },
  paid: { label: 'Paid', badge: 'success' },
  partial: { label: 'Partially paid', badge: 'warning' },
  overdue: { label: 'Overdue', badge: 'danger' },
  void: { label: 'Void', badge: 'secondary' },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; badge: BadgeVariant }
> = {
  unpaid: { label: 'Unpaid', badge: 'danger' },
  partial: { label: 'Partial', badge: 'warning' },
  paid: { label: 'Paid', badge: 'success' },
  partially_refunded: { label: 'Part refunded', badge: 'warning' },
  refunded: { label: 'Refunded', badge: 'secondary' },
};

export const REFUND_STATUS_META: Record<RefundStatus, { label: string; badge: BadgeVariant }> = {
  pending: { label: 'Pending', badge: 'warning' },
  processed: { label: 'Processed', badge: 'success' },
};

/* -------------------------------------------------------------------------- */
/*  Channels                                                                  */
/* -------------------------------------------------------------------------- */

export const SALES_CHANNELS = ['pos', 'online', 'wholesale'] as const;

export const SALES_CHANNEL_META: Record<SalesChannel, { label: string; color: string }> = {
  pos: { label: 'POS', color: '#8b5cf6' },
  online: { label: 'Online', color: '#06b6d4' },
  wholesale: { label: 'Wholesale', color: '#f59e0b' },
};

/* -------------------------------------------------------------------------- */
/*  Filter options & defaults                                                 */
/* -------------------------------------------------------------------------- */

export const INVOICE_STATUS_OPTIONS: Array<{ value: InvoiceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...INVOICE_STATUSES.map((status) => ({
    value: status as InvoiceStatus | 'all',
    label: INVOICE_STATUS_META[status].label,
  })),
];

export const CHANNEL_OPTIONS: Array<{ value: SalesChannel | 'all'; label: string }> = [
  { value: 'all', label: 'All channels' },
  ...SALES_CHANNELS.map((channel) => ({
    value: channel as SalesChannel | 'all',
    label: SALES_CHANNEL_META[channel].label,
  })),
];

export const REFUND_STATUS_OPTIONS: Array<{ value: RefundStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All refunds' },
  { value: 'pending', label: 'Pending' },
  { value: 'processed', label: 'Processed' },
];

export const DEFAULT_SALES_FILTERS: SalesFilters = {
  search: '',
  status: 'all',
  channel: 'all',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  page: 1,
  pageSize: 10,
};

export const DEFAULT_RETURN_FILTERS: SalesReturnFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
};

/** Quick date-range presets for charts + dashboards. */
export const DATE_RANGE_PRESETS: Array<{ value: SalesDateRange; days: number; label: string }> = [
  { value: '7d', days: 7, label: '7 days' },
  { value: '30d', days: 30, label: '30 days' },
  { value: '90d', days: 90, label: '90 days' },
];

/* -------------------------------------------------------------------------- */
/*  Charts                                                                    */
/* -------------------------------------------------------------------------- */

export const SALES_CHART_PALETTE = [
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#6366f1',
] as const;

export const CHANNEL_SPLIT_SEED: ChannelPoint[] = [
  { name: 'POS', revenue: 0, sharePct: 0, color: SALES_CHANNEL_META.pos.color },
  { name: 'Online', revenue: 0, sharePct: 0, color: SALES_CHANNEL_META.online.color },
  { name: 'Wholesale', revenue: 0, sharePct: 0, color: SALES_CHANNEL_META.wholesale.color },
];

/* -------------------------------------------------------------------------- */
/*  UI limits                                                                 */
/* -------------------------------------------------------------------------- */

/** Sales tax applied to invoices in the mock data set. */
export const SALES_TAX_RATE_PCT = 8.25;
export const INVOICE_TERMS = 'Net 14. Payment due within 14 days of issue.';
export const RECENT_INVOICES_LIMIT = 6;