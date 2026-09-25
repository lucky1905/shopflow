/* -------------------------------------------------------------------------- */
/*  POS (Smart Billing) â€” domain contracts                                    */
/*  Pure types only: no runtime imports.                                      */
/* -------------------------------------------------------------------------- */

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'credit' | 'split';

export type DiscountType = 'percent' | 'amount';

export type SaleStatus = 'completed' | 'partially_refunded' | 'refunded';

export type ReturnReason = 'defective' | 'wrong_item' | 'changed_mind' | 'expired' | 'other';

export type RefundMethod = 'original' | 'cash' | 'store_credit';

export type RecommendationTag = 'cross_sell' | 'upsell' | 'frequent';

/** Kept local so the POS barrel never clashes with the inventory barrel. */
export type PosProductStatus = 'active' | 'draft' | 'archived';

/* -------------------------------------------------------------------------- */
/*  Catalog (read-only projection of the inventory module)                    */
/* -------------------------------------------------------------------------- */

export interface PosProduct {
  id: string;
  name: string;
  description: string;
  /** Human-facing identifier, e.g. `GRO-482`. */
  sku: string;
  /** EAN-8 / EAN-13 style digits. */
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: PosProductStatus;
  imageUrl: string | null;
}

export interface PosCategory {
  id: string;
  name: string;
  color: string;
  /** Sellable products in this category (drives the grid count chip). */
  productCount: number;
}

/* -------------------------------------------------------------------------- */
/*  Cart                                                                      */
/* -------------------------------------------------------------------------- */

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  unitPrice: number;
  cost: number;
  quantity: number;
  unit: string;
  imageUrl: string | null;
  /** On-hand stock when the line was added â€” clamps quantity changes. */
  stockOnHand: number;
  /** Per-line discount, 0â€“100 (%). */
  discountPct: number;
}

export interface OrderDiscount {
  type: DiscountType;
  value: number;
}

export interface CartTotals {
  units: number;
  lines: number;
  /** Gross before any discount. */
  subtotal: number;
  lineDiscountTotal: number;
  orderDiscountAmount: number;
  discountTotal: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  /** Cost of goods â€” powers margin readouts. */
  costTotal: number;
}

/* -------------------------------------------------------------------------- */
/*  Payments & sales                                                          */
/* -------------------------------------------------------------------------- */

export interface PaymentTender {
  method: PaymentMethod;
  /** Portion of the sale total covered by this tender (sums to `total`). */
  amount: number;
  /** Cash only: banknotes handed over (â‰¥ `amount`); drives change due. */
  tendered?: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountPct: number;
  /** Net line amount after discount, before tax. */
  lineTotal: number;
  taxAmount: number;
  cost: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  status: SaleStatus;
  items: SaleItem[];
  customerId: string | null;
  customerName: string;
  cashierId: string;
  cashierName: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: PaymentTender[];
  changeDue: number;
  note: string;
  /** Cumulative refunded amount across returns for this sale. */
  refundedTotal: number;
  createdAt: string;
}

/** A receipt is the printable projection of a completed sale. */
export type Receipt = Sale;

export interface SaleFilters {
  search: string;
  page: number;
  pageSize: number;
}

/* -------------------------------------------------------------------------- */
/*  Hold / park carts                                                          */
/* -------------------------------------------------------------------------- */

export interface HeldCart {
  id: string;
  label: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  orderDiscount: OrderDiscount;
  taxRatePct: number;
  note: string;
  createdAt: string;
  /** Cached aggregates for the holds list (no recompute needed). */
  units: number;
  total: number;
}

export interface HoldCartInput {
  label: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  orderDiscount: OrderDiscount;
  taxRatePct: number;
  note: string;
}

/* -------------------------------------------------------------------------- */
/*  Customers                                                                 */
/* -------------------------------------------------------------------------- */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface PosCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  tier: LoyaltyTier;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
}

export interface PosCustomerInput {
  name: string;
  email: string;
  phone: string;
}

/* -------------------------------------------------------------------------- */
/*  Returns & refunds                                                         */
/* -------------------------------------------------------------------------- */

export interface ReturnInputLine {
  productId: string;
  quantity: number;
  reason: ReturnReason;
}

export interface ReturnInput {
  saleId: string;
  items: ReturnInputLine[];
  refundMethod: RefundMethod;
  /** Put returned units back on the shelf. */
  restock: boolean;
  note: string;
}

export interface ReturnLine {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reason: ReturnReason;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  saleId: string;
  saleReceiptNumber: string;
  customerName: string;
  items: ReturnLine[];
  refundTotal: number;
  refundMethod: RefundMethod;
  restocked: boolean;
  note: string;
  cashierName: string;
  createdAt: string;
}

/** A sale line with how many units may still be returned. */
export interface ReturnableLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  purchasableQty: number;
  returnableQty: number;
}

/* -------------------------------------------------------------------------- */
/*  Checkout                                                                  */
/* -------------------------------------------------------------------------- */

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  /** Echoed back for server-side validation; server recomputes totals. */
  unitPrice: number;
  discountPct: number;
}

export interface CheckoutInput {
  items: CheckoutItemInput[];
  customerId: string | null;
  orderDiscount: OrderDiscount;
  taxRatePct: number;
  note: string;
  payments: PaymentTender[];
}

/* -------------------------------------------------------------------------- */
/*  AI recommendations & session stats                                        */
/* -------------------------------------------------------------------------- */

export interface AiRecommendation {
  productId: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  tag: RecommendationTag;
  /** Short human explanation, e.g. "Frequently bought with Whole Milk". */
  reason: string;
  /** 0â€“1 score. */
  confidence: number;
}

export interface PosSummary {
  salesCount: number;
  /** Gross revenue before refunds. */
  revenue: number;
  refundTotal: number;
  netRevenue: number;
  itemsSold: number;
  avgBasket: number;
}

export interface CatalogSearch {
  query: string;
  categoryId: string | null;
}
