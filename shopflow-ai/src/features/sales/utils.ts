import type { BadgeVariant } from '@/types';
import type {
  InvoiceDetail,
  InvoiceStatus,
  PaymentStatus,
  SalesDateRange,
  SalesFilters,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Money                                                                     */
/* -------------------------------------------------------------------------- */

/** Two-decimal rounding used by every money computation in the module. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/*  Documents                                                                 */
/* -------------------------------------------------------------------------- */

function dateStamp(at: Date): string {
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${at.getFullYear()}${month}${day}`;
}

/** `INV-20260924-0017` */
export function invoiceNumberFor(sequence: number, at = new Date()): string {
  return `INV-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

/** `RMA-20260924-0003` */
export function returnNumberFor(sequence: number, at = new Date()): string {
  return `RMA-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

/* -------------------------------------------------------------------------- */
/*  Derived statuses                                                          */
/* -------------------------------------------------------------------------- */

/** Recomputes the payment status from totals (single source of truth). */
export function resolvePaymentStatus(
  total: number,
  paidAmount: number,
  refundedTotal: number,
): PaymentStatus {
  if (refundedTotal > 0 && refundedTotal >= total - 0.005) return 'refunded';
  if (refundedTotal > 0) return 'partially_refunded';
  if (paidAmount >= total - 0.005) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
}

export function invoiceStatusBadge(status: InvoiceStatus): BadgeVariant {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'overdue':
      return 'danger';
    case 'sent':
      return 'info';
    case 'void':
      return 'secondary';
    case 'draft':
    default:
      return 'outline';
  }
}

/** Invoices that can still accept a return (not void / fully refunded). */
export function isInvoiceReturnable(invoice: InvoiceDetail): boolean {
  return invoice.status !== 'void' && invoice.refundedTotal < invoice.total - 0.005;
}

/* -------------------------------------------------------------------------- */
/*  Filtering (shared by the mock service and client-side helpers)            */
/* -------------------------------------------------------------------------- */

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function withinDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = iso.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/** Case-insensitive match across number, customer and total. */
export function invoiceMatchesSearch(
  invoice: { invoiceNumber: string; customerName: string; total: number },
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return (
    invoice.invoiceNumber.toLowerCase().includes(query) ||
    invoice.customerName.toLowerCase().includes(query) ||
    String(invoice.total).includes(query)
  );
}

/** Applies search + status/channel/date/amount filters to a list. */
export function applyInvoiceFilters<
  T extends {
    invoiceNumber: string;
    customerName: string;
    total: number;
    status: InvoiceStatus;
    channel: string;
    createdAt: string;
  },
>(invoices: T[], filters: SalesFilters): T[] {
  const min = parseAmount(filters.minAmount);
  const max = parseAmount(filters.maxAmount);

  return invoices.filter((invoice) => {
    if (!invoiceMatchesSearch(invoice, filters.search)) return false;
    if (filters.status !== 'all' && invoice.status !== filters.status) return false;
    if (filters.channel !== 'all' && invoice.channel !== filters.channel) return false;
    if (!withinDateRange(invoice.createdAt, filters.dateFrom, filters.dateTo)) return false;
    if (min !== null && invoice.total < min) return false;
    if (max !== null && invoice.total > max) return false;
    return true;
  });
}

/** Newest first. */
export function byNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/** Standard `{ items, total, page, pageSize, totalPages }` page slice. */
export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: current,
    pageSize,
    totalPages,
  };
}


/* -------------------------------------------------------------------------- */
/*  Ranges                                                                    */
/* -------------------------------------------------------------------------- */

export function rangeDays(range: SalesDateRange): number {
  return range === '7d' ? 7 : range === '90d' ? 90 : 30;
}

/** Short axis label: `Sep 24`. */
export function shortDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysAgoIso(days: number, hour = 12, minute = 0): string {
  const at = new Date();
  at.setDate(at.getDate() - days);
  at.setHours(hour, minute, 0, 0);
  return at.toISOString();
}

export function isoDay(daysAgo: number): string {
  return daysAgoIso(daysAgo).slice(0, 10);
}

/** Percentage change with a floor of 0 to avoid /0 → Infinity. */
export function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return roundMoney(((current - previous) / previous) * 100);
}