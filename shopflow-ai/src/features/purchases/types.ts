/* -------------------------------------------------------------------------- */
/*  Purchases — domain contracts (Phase 4)                                    */
/*  Pure types only: no runtime imports.                                      */
/*  Prefixed exports avoid clashing with the inventory barrel (`Supplier`,    */
/*  `Product`, …) when both feature barrels are re-exported.                   */
/* -------------------------------------------------------------------------- */

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';

export type SupplierPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type DeliveryStatus = 'pending' | 'in_transit' | 'delayed' | 'received';

export type GrnStatus = 'pending_inspection' | 'accepted' | 'partial';

export type PurchasePaymentMethod = 'bank' | 'cash' | 'check';

/** Chart ranges shared by the purchases dashboards. */
export type PurchaseTrendRange = '7d' | '30d' | '90d';

/* -------------------------------------------------------------------------- */
/*  Suppliers (purchase-side projection)                                      */
/* -------------------------------------------------------------------------- */

export interface PurchaseSupplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  paymentTerms: string;
}

/* -------------------------------------------------------------------------- */
/*  Purchase orders                                                           */
/* -------------------------------------------------------------------------- */

export interface PurchaseOrderLine {
  productId: string;
  name: string;
  sku: string;
  /** Agreed unit cost. */
  unitPrice: number;
  quantity: number;
  /** Units already received through GRNs. */
  receivedQty: number;
}

export interface PurchaseTimelineEvent {
  id: string;
  label: string;
  at: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: SupplierPaymentStatus;
  createdAt: string;
  expectedDate: string;
  paymentDueDate: string;
  items: PurchaseOrderLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  createdBy: string;
  note: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  grnIds: string[];
  timeline: PurchaseTimelineEvent[];
}

/* -------------------------------------------------------------------------- */
/*  Goods Received Notes                                                      */
/* -------------------------------------------------------------------------- */

export interface GrnLine {
  productId: string;
  name: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
}

export interface Grn {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierName: string;
  receivedAt: string;
  receivedBy: string;
  status: GrnStatus;
  lines: GrnLine[];
  note: string;
}

export interface GrnLineInput {
  productId: string;
  receivedQty: number;
  damagedQty: number;
}

export interface GrnInput {
  poId: string;
  receivedBy: string;
  note: string;
  lines: GrnLineInput[];
}

/* -------------------------------------------------------------------------- */
/*  Supplier payments                                                         */
/* -------------------------------------------------------------------------- */

export interface SupplierPaymentRow {
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: SupplierPaymentStatus;
  dueDate: string;
}

export interface PaymentRecordInput {
  poId: string;
  amount: number;
  method: PurchasePaymentMethod;
  reference: string;
}

/* -------------------------------------------------------------------------- */
/*  Filters                                                                   */
/* -------------------------------------------------------------------------- */

export interface PurchaseOrderFilters {
  search: string;
  status: PurchaseOrderStatus | 'all';
  supplierId: string | 'all';
  paymentStatus: SupplierPaymentStatus | 'all';
  /** ISO date (`YYYY-MM-DD`); empty string = no bound. */
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export interface GrnFilters {
  search: string;
  status: GrnStatus | 'all';
  page: number;
  pageSize: number;
}

export interface PaymentFilters {
  search: string;
  status: SupplierPaymentStatus | 'all';
  supplierId: string | 'all';
  page: number;
  pageSize: number;
}

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                 */
/* -------------------------------------------------------------------------- */

export interface PurchasesDashboardStats {
  openOrders: number;
  openOrderValue: number;
  pendingDeliveries: number;
  monthSpend: number;
  spendChangePct: number;
  outstandingBalance: number;
  overduePayments: number;
  receivedThisMonth: number;
}

export interface SpendTrendPoint {
  label: string;
  date: string;
  spend: number;
}

export interface SupplierSpendPoint {
  name: string;
  spend: number;
  orders: number;
}

export interface PoStatusPoint {
  name: string;
  value: number;
  color: string;
}