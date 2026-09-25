import type { BadgeVariant } from '@/types';
import type {
  DeliveryStatus,
  GrnFilters,
  GrnStatus,
  PaymentFilters,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
  SupplierPaymentStatus,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Status metadata                                                           */
/* -------------------------------------------------------------------------- */

export const PURCHASE_STATUS_META: Record<
  PurchaseOrderStatus,
  { label: string; badge: BadgeVariant }
> = {
  draft: { label: 'Draft', badge: 'outline' },
  sent: { label: 'Sent to supplier', badge: 'info' },
  partial: { label: 'Partially received', badge: 'warning' },
  received: { label: 'Received', badge: 'success' },
  cancelled: { label: 'Cancelled', badge: 'secondary' },
};

export const PURCHASE_STATUS_OPTIONS: Array<{
  value: PurchaseOrderStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent to supplier' },
  { value: 'partial', label: 'Partially received' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SUPPLIER_PAYMENT_STATUS_META: Record<
  SupplierPaymentStatus,
  { label: string; badge: BadgeVariant }
> = {
  unpaid: { label: 'Unpaid', badge: 'danger' },
  partial: { label: 'Partially paid', badge: 'warning' },
  paid: { label: 'Paid', badge: 'success' },
  overdue: { label: 'Overdue', badge: 'danger' },
};

export const SUPPLIER_PAYMENT_STATUS_OPTIONS: Array<{
  value: SupplierPaymentStatus | 'all';
  label: string;
}> = [
  { value: 'all', label: 'All payment states' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export const DELIVERY_STATUS_META: Record<
  DeliveryStatus,
  { label: string; badge: BadgeVariant }
> = {
  pending: { label: 'Awaiting dispatch', badge: 'outline' },
  in_transit: { label: 'In transit', badge: 'info' },
  delayed: { label: 'Delayed', badge: 'danger' },
  received: { label: 'Delivered', badge: 'success' },
};

export const DELIVERY_STATUS_OPTIONS: Array<{ value: DeliveryStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All deliveries' },
  { value: 'pending', label: 'Awaiting dispatch' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'received', label: 'Delivered' },
];

export const GRN_STATUS_META: Record<GrnStatus, { label: string; badge: BadgeVariant }> = {
  pending_inspection: { label: 'Pending inspection', badge: 'warning' },
  accepted: { label: 'Accepted', badge: 'success' },
  partial: { label: 'Partial receipt', badge: 'info' },
};

export const GRN_STATUS_OPTIONS: Array<{ value: GrnStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All GRNs' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'partial', label: 'Partial receipt' },
  { value: 'pending_inspection', label: 'Pending inspection' },
];

/* -------------------------------------------------------------------------- */
/*  Charts                                                                    */
/* -------------------------------------------------------------------------- */

export const PURCHASE_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: '#94a3b8',
  sent: '#06b6d4',
  partial: '#f59e0b',
  received: '#10b981',
  cancelled: '#ef4444',
};

export const PURCHASE_TREND_RANGES: Array<{ value: '7d' | '30d' | '90d'; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

/* -------------------------------------------------------------------------- */
/*  Filter defaults                                                           */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PURCHASE_FILTERS: PurchaseOrderFilters = {
  search: '',
  status: 'all',
  supplierId: 'all',
  paymentStatus: 'all',
  dateFrom: '',
  dateTo: '',
  page: 1,
  pageSize: 10,
};

export const DEFAULT_GRN_FILTERS: GrnFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
};

export const DEFAULT_PAYMENT_FILTERS: PaymentFilters = {
  search: '',
  status: 'all',
  supplierId: 'all',
  page: 1,
  pageSize: 10,
};

/* -------------------------------------------------------------------------- */
/*  Limits                                                                    */
/* -------------------------------------------------------------------------- */

/** Supplier pricing in the mock data is tax-inclusive. */
export const PURCHASE_TAX_RATE_PCT = 0;
export const PAYMENT_TERMS_DAYS = 30;