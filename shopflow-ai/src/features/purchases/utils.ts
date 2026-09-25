import type { BadgeVariant } from '@/types';
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderStatus,
  PurchaseTrendRange,
  SupplierPaymentStatus,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Money & documents                                                         */
/* -------------------------------------------------------------------------- */

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateStamp(at: Date): string {
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${at.getFullYear()}${month}${day}`;
}

/** `PO-20260924-0007` */
export function poNumberFor(sequence: number, at = new Date()): string {
  return `PO-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

/** `GRN-20260924-0003` */
export function grnNumberFor(sequence: number, at = new Date()): string {
  return `GRN-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

export function purchaseStatusBadge(status: PurchaseOrderStatus): BadgeVariant {
  switch (status) {
    case 'received':
      return 'success';
    case 'partial':
      return 'warning';
    case 'sent':
      return 'info';
    case 'cancelled':
      return 'secondary';
    case 'draft':
    default:
      return 'outline';
  }
}

export function paymentStatusBadge(status: SupplierPaymentStatus): BadgeVariant {
  switch (status) {
    case 'paid':
      return 'success';
    case 'partial':
      return 'warning';
    case 'overdue':
    case 'unpaid':
      return 'danger';
    default:
      return 'outline';
  }
}

/** Open orders that still need receiving (sent / partial). */
export function isOpenForReceiving(order: PurchaseOrder): boolean {
  return order.status === 'sent' || order.status === 'partial';
}

/* -------------------------------------------------------------------------- */
/*  Filtering                                                                 */
/* -------------------------------------------------------------------------- */

export function purchaseMatchesSearch(
  order: { poNumber: string; supplierName: string; total: number },
  rawQuery: string,
): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return (
    order.poNumber.toLowerCase().includes(query) ||
    order.supplierName.toLowerCase().includes(query) ||
    String(order.total).includes(query)
  );
}

function withinDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = iso.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function applyOrderFilters<T extends PurchaseOrder>(
  orders: T[],
  filters: PurchaseOrderFilters,
): T[] {
  return orders.filter((order) => {
    if (!purchaseMatchesSearch(order, filters.search)) return false;
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.supplierId !== 'all' && order.supplierId !== filters.supplierId) return false;
    if (filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) {
      return false;
    }
    if (!withinDateRange(order.createdAt, filters.dateFrom, filters.dateTo)) return false;
    return true;
  });
}

export function byNewest(a: { createdAt: string }, b: { createdAt: string }): number {
  return b.createdAt.localeCompare(a.createdAt);
}

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
/*  Ranges & dates                                                            */
/* -------------------------------------------------------------------------- */

export function rangeDays(range: PurchaseTrendRange): number {
  return range === '7d' ? 7 : range === '90d' ? 90 : 30;
}

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

export function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return roundMoney(((current - previous) / previous) * 100);
}

/** Whole days until a target date (negative = overdue). */
export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / 86_400_000);
}