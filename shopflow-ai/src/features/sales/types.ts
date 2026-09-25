/* -------------------------------------------------------------------------- */
/*  Sales & Purchase Management — domain contracts (Phase 4)                  */
/*  Pure types only: no runtime imports.                                      */
/* -------------------------------------------------------------------------- */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'partially_refunded' | 'refunded';

export type SalesChannel = 'pos' | 'online' | 'wholesale';

export type RefundStatus = 'pending' | 'processed';

/** Sales-scope refund channel (POS exports its own `RefundMethod`). */
export type SalesRefundMethod = 'original' | 'cash' | 'store_credit';

export type SalesDateRange = '7d' | '30d' | '90d' | 'custom';

/* -------------------------------------------------------------------------- */
/*  Invoices                                                                  */
/* -------------------------------------------------------------------------- */

export interface InvoiceLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  /** Per-line discount, 0–100 (%). */
  discountPct: number;
  /** Net amount after the line discount. */
  lineTotal: number;
  /** Unit cost at time of sale (margin analytics). */
  cost: number;
}

export interface InvoicePayment {
  id: string;
  method: 'cash' | 'card' | 'transfer' | 'mobile';
  amount: number;
  paidAt: string;
  reference: string;
}

/** Lightweight projection used by tables, dashboards and charts. */
export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  channel: SalesChannel;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  /** Net-14 style due date for sent / partial / overdue invoices. */
  dueDate: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  refundedTotal: number;
  itemCount: number;
  cashierName: string;
}

/** Full document powering the details page and printable preview. */
export interface InvoiceDetail extends InvoiceSummary {
  taxRatePct: number;
  note: string;
  shippingAddress: string;
  terms: string;
  lines: InvoiceLine[];
  payments: InvoicePayment[];
  /** Ids of return records linked to this invoice. */
  returnIds: string[];
}

/* -------------------------------------------------------------------------- */
/*  Returns & refunds                                                         */
/* -------------------------------------------------------------------------- */

export interface SalesReturnLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  reason: string;
  lineTotal: number;
}

export interface SalesReturnRecord {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  lines: SalesReturnLine[];
  refundTotal: number;
  refundMethod: SalesRefundMethod;
  status: RefundStatus;
  note: string;
  processedAt: string | null;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Filters                                                                   */
/* -------------------------------------------------------------------------- */

export interface SalesFilters {
  search: string;
  status: InvoiceStatus | 'all';
  channel: SalesChannel | 'all';
  /** ISO date (`YYYY-MM-DD`); empty string = no bound. */
  dateFrom: string;
  dateTo: string;
  /** Free-form amount inputs — parsed by the service layer. */
  minAmount: string;
  maxAmount: string;
  page: number;
  pageSize: number;
}

export interface SalesReturnFilters {
  search: string;
  status: RefundStatus | 'all';
  page: number;
  pageSize: number;
}

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                 */
/* -------------------------------------------------------------------------- */

export interface SalesDashboardStats {
  netRevenue: number;
  grossRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  refundTotal: number;
  unitsSold: number;
  /** vs. the previous equal-length period. */
  revenueChangePct: number;
  orderChangePct: number;
  pendingRefunds: number;
  overdueTotal: number;
}

export interface SalesTrendPoint {
  /** Short axis label, e.g. `Sep 24`. */
  label: string;
  /** ISO date, e.g. `2026-09-24`. */
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductPoint {
  name: string;
  units: number;
  revenue: number;
}

export interface ChannelPoint {
  name: string;
  revenue: number;
  sharePct: number;
  color: string;
}

export interface SalesAnalytics {
  stats: SalesDashboardStats;
  trend: SalesTrendPoint[];
  topProducts: TopProductPoint[];
  channels: ChannelPoint[];
}