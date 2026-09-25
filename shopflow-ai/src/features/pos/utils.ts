import { clamp } from '@/lib/utils';
import type { BadgeVariant } from '@/types';
import { MAX_LINE_QUANTITY } from './constants';
import type {
  CartItem,
  CartTotals,
  OrderDiscount,
  PaymentTender,
  PosProduct,
  Sale,
  SaleStatus,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Money helpers                                                             */
/* -------------------------------------------------------------------------- */

/** Two-decimal rounding used by every money computation in the module. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Net amount of a cart line after its per-line discount. */
export function lineNet(item: CartItem): number {
  const gross = item.unitPrice * item.quantity;
  return roundMoney(gross * (1 - item.discountPct / 100));
}

/* -------------------------------------------------------------------------- */
/*  Cart totals                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Single source of truth for checkout math:
 *   line discounts → order discount → tax → total.
 */
export function computeCartTotals(
  items: CartItem[],
  orderDiscount: OrderDiscount,
  taxRatePct: number,
): CartTotals {
  let units = 0;
  let subtotal = 0;
  let lineDiscountTotal = 0;
  let costTotal = 0;

  for (const item of items) {
    units += item.quantity;
    const gross = item.unitPrice * item.quantity;
    subtotal += gross;
    lineDiscountTotal += gross * (item.discountPct / 100);
    costTotal += item.cost * item.quantity;
  }

  subtotal = roundMoney(subtotal);
  lineDiscountTotal = roundMoney(lineDiscountTotal);
  costTotal = roundMoney(costTotal);

  const afterLineDiscounts = roundMoney(subtotal - lineDiscountTotal);

  let orderDiscountAmount =
    orderDiscount.type === 'percent'
      ? afterLineDiscounts * (clamp(orderDiscount.value, 0, 100) / 100)
      : Math.min(Math.max(orderDiscount.value, 0), afterLineDiscounts);
  orderDiscountAmount = roundMoney(orderDiscountAmount);

  const discountTotal = roundMoney(lineDiscountTotal + orderDiscountAmount);
  const taxableAmount = roundMoney(afterLineDiscounts - orderDiscountAmount);
  const taxAmount = roundMoney(taxableAmount * (clamp(taxRatePct, 0, 100) / 100));
  const total = roundMoney(taxableAmount + taxAmount);

  return {
    units,
    lines: items.length,
    subtotal,
    lineDiscountTotal,
    orderDiscountAmount,
    discountTotal,
    taxableAmount,
    taxAmount,
    total,
    costTotal,
  };
}

/* -------------------------------------------------------------------------- */
/*  Product search                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Relevance score for the POS grid. Exact barcode / SKU matches (scanned
 * codes) always win over name matches so Enter adds the right product.
 */
export function productMatchScore(product: PosProduct, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 1;

  if (product.barcode === query) return 100;
  if (product.sku.toLowerCase() === query) return 90;

  const name = product.name.toLowerCase();
  if (name === query) return 80;
  if (name.startsWith(query)) return 60;
  if (name.includes(query)) return 40;
  if (product.sku.toLowerCase().includes(query)) return 30;
  if (product.barcode.includes(query)) return 25;
  if (product.description.toLowerCase().includes(query)) return 10;
  return 0;
}

/** Filters + sorts catalog results for the grid (best match first). */
export function sortCatalog(products: PosProduct[], rawQuery: string): PosProduct[] {
  const query = rawQuery.trim();
  if (!query) {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }

  return products
    .map((product) => ({ product, score: productMatchScore(product, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .map((entry) => entry.product);
}

/* -------------------------------------------------------------------------- */
/*  Quantity & payment helpers                                                */
/* -------------------------------------------------------------------------- */

/** Clamps a requested quantity into [1, min(stock, MAX_LINE_QUANTITY)]. */
export function clampQuantity(quantity: number, stockOnHand: number): number {
  if (!Number.isFinite(quantity)) return 1;
  const ceiling = Math.max(1, Math.min(Math.floor(stockOnHand), MAX_LINE_QUANTITY));
  return Math.min(Math.max(Math.round(quantity), 1), ceiling);
}

/** Portion of the total still uncovered by the current tenders. */
export function remainingDue(payments: PaymentTender[], total: number): number {
  const paid = payments.reduce((sum, tender) => sum + tender.amount, 0);
  return Math.max(0, roundMoney(total - paid));
}

/** `true` when the tenders exactly cover the sale total. */
export function tendersCoverTotal(payments: PaymentTender[], total: number): boolean {
  return remainingDue(payments, total) < 0.005;
}

/** Cash handed over minus the sale total (card/mobile tender exactly). */
export function changeDue(payments: PaymentTender[], total: number): number {
  const tendered = payments.reduce((sum, tender) => sum + (tender.tendered ?? tender.amount), 0);
  return Math.max(0, roundMoney(tendered - total));
}

/* -------------------------------------------------------------------------- */
/*  Documents (receipts / returns)                                            */
/* -------------------------------------------------------------------------- */

function dateStamp(at: Date): string {
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  return `${at.getFullYear()}${month}${day}`;
}

/** `INV-20260923-0007` */
export function receiptNumberFor(sequence: number, at = new Date()): string {
  return `INV-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

/** `RET-20260923-0002` */
export function returnNumberFor(sequence: number, at = new Date()): string {
  return `RET-${dateStamp(at)}-${String(sequence).padStart(4, '0')}`;
}

export function saleStatusMeta(status: SaleStatus): { label: string; badge: BadgeVariant } {
  switch (status) {
    case 'completed':
      return { label: 'Completed', badge: 'success' };
    case 'partially_refunded':
      return { label: 'Partially refunded', badge: 'warning' };
    case 'refunded':
      return { label: 'Refunded', badge: 'danger' };
  }
}

/** Sale can still accept a return for at least one unit. */
export function isSaleReturnable(sale: Sale): boolean {
  return sale.status !== 'refunded' && sale.refundedTotal < sale.total - 0.005;
}

/** Case-insensitive match across receipt number, customer and total. */
export function saleMatchesQuery(sale: Sale, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  return (
    sale.receiptNumber.toLowerCase().includes(query) ||
    sale.customerName.toLowerCase().includes(query) ||
    String(sale.total).includes(query)
  );
}

/** "2" / "1.5 kg" — `pc` units skip the suffix for cleaner rows. */
export function formatQuantityUnit(quantity: number, unit: string): string {
  return unit === 'pc' ? `${quantity}` : `${quantity} ${unit}`;
}