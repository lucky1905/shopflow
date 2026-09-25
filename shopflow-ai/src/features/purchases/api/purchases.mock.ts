import { PAYMENT_TERMS_DAYS, PURCHASE_STATUS_COLORS } from '../constants';
import {
  applyOrderFilters,
  byNewest,
  daysAgoIso,
  grnNumberFor,
  isoDay,
  paginate,
  poNumberFor,
  pctChange,
  roundMoney,
  shortDayLabel,
} from '../utils';
import type { PaginatedResponse } from '@/types';
import type {
  DeliveryStatus,
  Grn,
  GrnInput,
  GrnLine,
  GrnStatus,
  PaymentFilters,
  PaymentRecordInput,
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderFilters,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseSupplier,
  PurchaseTrendRange,
  PurchasesDashboardStats,
  SupplierPaymentRow,
  SupplierPaymentStatus,
  SpendTrendPoint,
  SupplierSpendPoint,
  PoStatusPoint,
} from '../types';

/** Mock round-trip latency for Purchases calls. */
export const PURCHASES_MOCK_LATENCY_MS = 300;

/* -------------------------------------------------------------------------- */
/*  Deterministic PRNG                                                        */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, rows: readonly T[]): T {
  return rows[Math.floor(rnd() * rows.length)];
}

/* -------------------------------------------------------------------------- */
/*  Seeds                                                                     */
/* -------------------------------------------------------------------------- */

const SEED_SUPPLIERS: PurchaseSupplier[] = [
  { id: 'sup_1', name: 'Harbor Wholesale Co.', contactName: 'Elena Petrova', email: 'elena@harborwholesale.com', phone: '+1 (555) 310-4471', leadTimeDays: 5, paymentTerms: 'Net 30' },
  { id: 'sup_2', name: 'GreenLeaf Produce', contactName: 'Marcus Hill', email: 'marcus@greenleafproduce.com', phone: '+1 (555) 220-9184', leadTimeDays: 2, paymentTerms: 'Net 15' },
  { id: 'sup_3', name: 'Nordic Dairy Group', contactName: 'Ingrid Solberg', email: 'ingrid@nordicdairy.com', phone: '+1 (555) 671-2200', leadTimeDays: 3, paymentTerms: 'Net 30' },
  { id: 'sup_4', name: 'Summit Beverages', contactName: 'Carlos Mendez', email: 'carlos@summitbev.com', phone: '+1 (555) 844-6712', leadTimeDays: 4, paymentTerms: 'Net 30' },
  { id: 'sup_5', name: 'Golden Grain Mills', contactName: 'Aiko Tanaka', email: 'aiko@goldengrain.com', phone: '+1 (555) 119-3345', leadTimeDays: 7, paymentTerms: 'Net 45' },
  { id: 'sup_6', name: 'Sweetened Confectionery', contactName: 'Owen Blake', email: 'owen@sweetenedco.com', phone: '+1 (555) 553-8890', leadTimeDays: 6, paymentTerms: 'Net 30' },
  { id: 'sup_7', name: 'Coastal Pantry Ltd.', contactName: 'Nadia Rahman', email: 'nadia@coastalpantry.com', phone: '+1 (555) 766-1123', leadTimeDays: 8, paymentTerms: 'Net 30' },
  { id: 'sup_8', name: 'Prime Paper & Pack', contactName: 'Victor Lane', email: 'victor@primepack.com', phone: '+1 (555) 902-4456', leadTimeDays: 10, paymentTerms: 'Net 60' },
];

interface SeedSupplyProduct {
  id: string;
  name: string;
  sku: string;
  cost: number;
}

const SEED_SUPPLY_PRODUCTS: SeedSupplyProduct[] = [
  { id: 'prd_01', name: 'Sunflower Oil 1L', sku: 'GRO-101', cost: 8.4 },
  { id: 'prd_02', name: 'Basmati Rice 5kg', sku: 'GRO-214', cost: 13.1 },
  { id: 'prd_03', name: 'Whole Milk 1L', sku: 'DAI-322', cost: 1.6 },
  { id: 'prd_04', name: 'Arabica Coffee 250g', sku: 'BEV-118', cost: 6.2 },
  { id: 'prd_05', name: 'Sea Salt Crisps 150g', sku: 'SNK-410', cost: 1.8 },
  { id: 'prd_06', name: 'Organic Green Tea', sku: 'BEV-226', cost: 3.9 },
  { id: 'prd_07', name: 'Dark Chocolate 90g', sku: 'SNK-305', cost: 2.35 },
  { id: 'prd_08', name: 'Orange Juice 1L', sku: 'BEV-141', cost: 3.1 },
  { id: 'prd_09', name: 'Spaghetti 500g', sku: 'GRO-337', cost: 1.55 },
  { id: 'prd_10', name: 'Olive Oil 500ml', sku: 'GRO-152', cost: 9.8 },
  { id: 'prd_11', name: 'Greek Yogurt 4pk', sku: 'DAI-411', cost: 3.2 },
  { id: 'prd_12', name: 'Almond Cookies 200g', sku: 'SNK-219', cost: 3.4 },
  { id: 'prd_13', name: 'Sparkling Water 6pk', sku: 'BEV-302', cost: 3.75 },
  { id: 'prd_14', name: 'Peanut Butter 400g', sku: 'GRO-423', cost: 4.9 },
  { id: 'prd_15', name: 'Kraft Bags 500ct', sku: 'PKG-051', cost: 11.2 },
  { id: 'prd_16', name: 'Receipt Roll 80mm', sku: 'PKG-112', cost: 0.9 },
  { id: 'prd_17', name: 'Butter Blocks 1kg', sku: 'DAI-507', cost: 7.4 },
  { id: 'prd_18', name: 'Canned Tuna 400g', sku: 'GRO-618', cost: 4.15 },
  { id: 'prd_19', name: 'Oat Cereal 750g', sku: 'GRO-702', cost: 5.3 },
  { id: 'prd_20', name: 'Vanilla Extract 100ml', sku: 'GRO-811', cost: 6.6 },
];

const BUYERS = ['Dana Whitfield', 'Omar Haddad', 'Grace Liu'] as const;

/* -------------------------------------------------------------------------- */
/*  Purchase order generation                                                 */
/* -------------------------------------------------------------------------- */

interface BuildContext {
  rnd: () => number;
  sequence: number;
  grnSequence: number;
}

function addDays(iso: string, days: number): string {
  const at = new Date(iso);
  at.setDate(at.getDate() + days);
  return at.toISOString().slice(0, 10);
}

function buildOrder(ctx: BuildContext, daysAgo: number): PurchaseOrder {
  const { rnd } = ctx;
  const createdAt = daysAgoIso(daysAgo, 9 + Math.floor(rnd() * 8), Math.floor(rnd() * 60));
  const supplier = pick(rnd, SEED_SUPPLIERS);
  const poNumber = poNumberFor(++ctx.sequence, new Date(createdAt));
  const expectedDate = addDays(createdAt.slice(0, 10), supplier.leadTimeDays);

  const lineCount = 2 + Math.floor(rnd() * 5);
  const chosen = new Set<number>();
  const items: PurchaseOrderLine[] = [];
  while (items.length < lineCount) {
    const index = Math.floor(rnd() * SEED_SUPPLY_PRODUCTS.length);
    if (chosen.has(index)) continue;
    chosen.add(index);
    const product = SEED_SUPPLY_PRODUCTS[index];
    const unitPrice = roundMoney(product.cost * (1.05 + rnd() * 0.2));
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice,
      quantity: 10 + Math.floor(rnd() * 50),
      receivedQty: 0,
    });
  }

  const subtotal = roundMoney(items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));

  let status: PurchaseOrderStatus;
  const roll = rnd();
  if (roll < 0.07) status = 'draft';
  else if (roll < 0.15) status = 'cancelled';
  else if (roll < 0.6) status = 'received';
  else if (roll < 0.72 && daysAgo >= 5) status = 'partial';
  else status = 'sent';

  // Drafts and cancellations only make sense for recent orders.
  if (daysAgo > 10 && (status === 'draft' || status === 'cancelled')) status = 'sent';
  if (daysAgo < 4 && status === 'received' && roll < 0.5) status = 'sent';

  let deliveryStatus: DeliveryStatus;
  if (status === 'received') deliveryStatus = 'received';
  else if (status === 'cancelled') deliveryStatus = 'pending';
  else {
    const overdue = expectedDate < new Date().toISOString().slice(0, 10);
    if (overdue && rnd() < 0.5) deliveryStatus = 'delayed';
    else deliveryStatus = rnd() < 0.55 ? 'in_transit' : 'pending';
  }

  const paymentDueDate = addDays(expectedDate, PAYMENT_TERMS_DAYS);
  let paidAmount = 0;
  if (status === 'received' || status === 'partial') {
    const payRoll = rnd();
    if (payRoll < 0.62) paidAmount = subtotal;
    else if (payRoll < 0.85) paidAmount = roundMoney(subtotal * (0.3 + rnd() * 0.4));
  }

  const paymentStatus: SupplierPaymentStatus =
    paidAmount >= subtotal - 0.005
      ? 'paid'
      : paidAmount > 0
        ? paymentDueDate < new Date().toISOString().slice(0, 10)
          ? 'overdue'
          : 'partial'
        : paymentDueDate < new Date().toISOString().slice(0, 10) &&
            status !== 'draft' &&
            status !== 'cancelled'
          ? 'overdue'
          : 'unpaid';

  return {
    id: `po_${ctx.sequence}`,
    poNumber,
    supplierId: supplier.id,
    supplierName: supplier.name,
    status,
    deliveryStatus,
    paymentStatus,
    createdAt,
    expectedDate,
    paymentDueDate,
    items,
    subtotal,
    taxTotal: 0,
    total: subtotal,
    paidAmount,
    createdBy: pick(rnd, BUYERS),
    note: rnd() < 0.15 ? 'Deliver before 10 AM at dock 2.' : '',
  };
}

/* -------------------------------------------------------------------------- */
/*  Seed the database                                                         */
/* -------------------------------------------------------------------------- */

const rnd = mulberry32(20260924);
const ctx: BuildContext = { rnd, sequence: 0, grnSequence: 0 };

const orders: PurchaseOrder[] = [];
for (let daysAgo = 119; daysAgo >= 0; daysAgo -= 1) {
  if (rnd() < 0.55) orders.push(buildOrder(ctx, daysAgo));
}
orders.sort(byNewest);

/* -------------------------------------------------------------------------- */
/*  GRN generation                                                            */
/* -------------------------------------------------------------------------- */

const grns: Grn[] = [];

function receivedQtyFor(order: PurchaseOrder, status: 'full' | 'partial'): number[] {
  return order.items.map((line) =>
    status === 'full' ? line.quantity : Math.floor(line.quantity * (0.4 + rnd() * 0.4)),
  );
}

function buildGrn(order: PurchaseOrder, status: GrnStatus, daysAgo: number): Grn {
  const quantities = receivedQtyFor(order, status === 'accepted' ? 'full' : 'partial');
  const lines: GrnLine[] = order.items.map((line, index) => ({
    productId: line.productId,
    name: line.name,
    sku: line.sku,
    orderedQty: line.quantity,
    receivedQty: quantities[index],
    damagedQty: quantities[index] > 0 && rnd() < 0.12 ? 1 : 0,
  }));
  const receivedAt = daysAgoIso(daysAgo, 10 + Math.floor(rnd() * 6), Math.floor(rnd() * 60));

  return {
    id: `grn_${++ctx.grnSequence}`,
    grnNumber: grnNumberFor(ctx.grnSequence, new Date(receivedAt)),
    poId: order.id,
    poNumber: order.poNumber,
    supplierName: order.supplierName,
    receivedAt,
    receivedBy: pick(rnd, BUYERS),
    status,
    lines,
    note: status === 'partial' ? 'Balance of the order still outstanding.' : '',
  };
}

for (const order of orders) {
  if (order.status === 'received') {
    const daysAgo = Math.max(
      0,
      Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 86_400_000) - 4,
    );
    const grn = buildGrn(order, 'accepted', daysAgo);
    grns.push(grn);
    for (const line of order.items) line.receivedQty = line.quantity;
  } else if (order.status === 'partial') {
    const grn = buildGrn(order, 'partial', Math.max(0, Math.floor(rnd() * 5)));
    grns.push(grn);
    for (const line of order.items) {
      const match = grn.lines.find((entry) => entry.productId === line.productId);
      line.receivedQty = match ? match.receivedQty : 0;
    }
  } else if (order.status === 'sent' && rnd() < 0.12 && grns.length < 24) {
    const grn = buildGrn(order, 'pending_inspection', Math.floor(rnd() * 3));
    grns.push(grn);
  }
}
grns.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

/* -------------------------------------------------------------------------- */
/*  Payments                                                                  */
/* -------------------------------------------------------------------------- */

function resolveRowPaymentStatus(order: PurchaseOrder): SupplierPaymentStatus {
  if (order.status === 'draft') return 'unpaid';
  if (order.paidAmount >= order.total - 0.005) return 'paid';
  if (order.paymentDueDate < new Date().toISOString().slice(0, 10)) return 'overdue';
  return order.paidAmount > 0 ? 'partial' : 'unpaid';
}

function toPaymentRow(order: PurchaseOrder): SupplierPaymentRow {
  const status = resolveRowPaymentStatus(order);
  return {
    poId: order.id,
    poNumber: order.poNumber,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    total: order.total,
    paidAmount: order.paidAmount,
    dueAmount: roundMoney(order.total - order.paidAmount),
    status,
    dueDate: order.paymentDueDate,
  };
}

const paymentEligible = orders.filter(
  (order) => order.status !== 'draft' && order.status !== 'cancelled',
);

/* -------------------------------------------------------------------------- */
/*  Analytics helpers                                                         */
/* -------------------------------------------------------------------------- */

function trendDays(range: PurchaseTrendRange): number {
  return range === '7d' ? 7 : range === '90d' ? 90 : 30;
}

function withinDays(iso: string, days: number): boolean {
  const cutoff = Date.now() - days * 86_400_000;
  return new Date(iso).getTime() >= cutoff;
}

function spendInWindow(days: number): number {
  let spend = 0;
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'draft') continue;
    if (withinDays(order.createdAt, days)) spend += order.total;
  }
  return roundMoney(spend);
}

function buildDashboard(): PurchasesDashboardStats {
  const open = orders.filter((order) => order.status === 'sent' || order.status === 'partial');
  const deliveries = open.filter((order) => order.deliveryStatus !== 'received');
  const monthSpend = spendInWindow(30);
  const prevSpend = spendInWindow(60) - monthSpend;
  const outstanding = paymentEligible.reduce(
    (sum, order) => sum + Math.max(0, order.total - order.paidAmount),
    0,
  );
  const overdue = paymentEligible.filter(
    (order) => resolveRowPaymentStatus(order) === 'overdue',
  ).length;
  const receivedThisMonth = orders.filter(
    (order) => order.status === 'received' && withinDays(order.createdAt, 30),
  ).length;

  return {
    openOrders: open.length,
    openOrderValue: roundMoney(open.reduce((sum, order) => sum + order.total, 0)),
    pendingDeliveries: deliveries.length,
    monthSpend,
    spendChangePct: pctChange(monthSpend, roundMoney(prevSpend)),
    outstandingBalance: roundMoney(outstanding),
    overduePayments: overdue,
    receivedThisMonth,
  };
}

function buildTrend(range: PurchaseTrendRange): SpendTrendPoint[] {
  const days = trendDays(range);
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) buckets.set(isoDay(i), 0);

  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'draft') continue;
    const key = order.createdAt.slice(0, 10);
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }

  return Array.from(buckets, ([date, spend]) => ({
    date,
    label: shortDayLabel(date),
    spend: roundMoney(spend),
  }));
}

function buildSupplierSpend(): SupplierSpendPoint[] {
  const totals = new Map<string, { name: string; spend: number; orders: number }>();
  for (const order of orders) {
    if (order.status === 'cancelled' || order.status === 'draft') continue;
    if (!withinDays(order.createdAt, 90)) continue;
    const entry = totals.get(order.supplierId) ?? {
      name: order.supplierName,
      spend: 0,
      orders: 0,
    };
    entry.spend += order.total;
    entry.orders += 1;
    totals.set(order.supplierId, entry);
  }
  return Array.from(totals.values())
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6)
    .map((entry) => ({ ...entry, spend: roundMoney(entry.spend) }));
}

function buildStatusSplit(): PoStatusPoint[] {
  return (Object.keys(PURCHASE_STATUS_COLORS) as PurchaseOrderStatus[]).map((status) => ({
    name:
      status === 'sent'
        ? 'Sent'
        : status === 'partial'
          ? 'Partial'
          : status.charAt(0).toUpperCase() + status.slice(1),
    value: orders.filter((order) => order.status === status).length,
    color: PURCHASE_STATUS_COLORS[status],
  }));
}

/* -------------------------------------------------------------------------- */
/*  Public mock API                                                           */
/* -------------------------------------------------------------------------- */

export interface PurchasesMockDb {
  listOrders(filters: PurchaseOrderFilters): PaginatedResponse<PurchaseOrder>;
  getOrder(id: string): PurchaseOrderDetail | null;
  sendOrder(id: string): PurchaseOrder | null;
  markInTransit(id: string): PurchaseOrder | null;
  suppliers(): PurchaseSupplier[];
  deliveries(): PurchaseOrder[];
  listGrns(filters: { search: string; status: GrnStatus | 'all'; page: number; pageSize: number }): PaginatedResponse<Grn>;
  createGrn(input: GrnInput): Grn;
  listPayments(filters: PaymentFilters): PaginatedResponse<SupplierPaymentRow>;
  recordPayment(input: PaymentRecordInput): SupplierPaymentRow | null;
  dashboard(): PurchasesDashboardStats;
  trend(range: PurchaseTrendRange): SpendTrendPoint[];
  supplierSpend(): SupplierSpendPoint[];
  statusSplit(): PoStatusPoint[];
}

function findOrder(id: string): PurchaseOrder | undefined {
  return orders.find((order) => order.id === id);
}

export const purchasesMockDb: PurchasesMockDb = {
  listOrders(filters) {
    return paginate(applyOrderFilters(orders, filters), filters.page, filters.pageSize);
  },

  getOrder(id) {
    const order = findOrder(id);
    if (!order) return null;
    const timeline: PurchaseOrderDetail['timeline'] = [
      { id: 'created', label: `Order created by ${order.createdBy}`, at: order.createdAt },
    ];
    if (order.status !== 'draft') {
      timeline.push({ id: 'sent', label: 'Sent to supplier', at: order.createdAt });
    }
    for (const grn of grns.filter((entry) => entry.poId === order.id)) {
      timeline.push({ id: grn.id, label: `${grn.grnNumber} received`, at: grn.receivedAt });
    }
    if (order.paidAmount > 0) {
      timeline.push({
        id: 'paid',
        label: `Payment recorded (${order.paidAmount >= order.total ? 'full' : 'partial'})`,
        at: order.expectedDate,
      });
    }
    return {
      ...order,
      grnIds: grns.filter((entry) => entry.poId === order.id).map((entry) => entry.id),
      timeline,
    };
  },

  sendOrder(id) {
    const order = findOrder(id);
    if (!order || order.status !== 'draft') return order ?? null;
    order.status = 'sent';
    order.deliveryStatus = 'pending';
    return order;
  },

  markInTransit(id) {
    const order = findOrder(id);
    if (!order) return null;
    order.deliveryStatus = 'in_transit';
    return order;
  },

  suppliers() {
    return SEED_SUPPLIERS;
  },

  deliveries() {
    return orders
      .filter(
        (order) =>
          (order.status === 'sent' || order.status === 'partial') &&
          order.deliveryStatus !== 'received',
      )
      .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  },

  listGrns(filters) {
    const query = filters.search.trim().toLowerCase();
    const filtered = grns.filter((grn) => {
      if (filters.status !== 'all' && grn.status !== filters.status) return false;
      if (!query) return true;
      return (
        grn.grnNumber.toLowerCase().includes(query) ||
        grn.poNumber.toLowerCase().includes(query) ||
        grn.supplierName.toLowerCase().includes(query)
      );
    });
    return paginate(filtered, filters.page, filters.pageSize);
  },

  createGrn(input) {
    const order = findOrder(input.poId);
    if (!order) throw { message: 'Purchase order not found.', status: 404 };

    const lines: GrnLine[] = order.items.map((line) => {
      const entry = input.lines.find((row) => row.productId === line.productId);
      const receivedQty = Math.min(line.quantity, Math.max(0, entry?.receivedQty ?? 0));
      line.receivedQty = Math.min(line.quantity, line.receivedQty + receivedQty);
      return {
        productId: line.productId,
        name: line.name,
        sku: line.sku,
        orderedQty: line.quantity,
        receivedQty,
        damagedQty: Math.max(0, entry?.damagedQty ?? 0),
      };
    });

    const allReceived = order.items.every((line) => line.receivedQty >= line.quantity);
    const anyReceived = lines.some((line) => line.receivedQty > 0);

    const grn: Grn = {
      id: `grn_${++ctx.grnSequence}`,
      grnNumber: grnNumberFor(ctx.grnSequence),
      poId: order.id,
      poNumber: order.poNumber,
      supplierName: order.supplierName,
      receivedAt: new Date().toISOString(),
      receivedBy: input.receivedBy,
      status: allReceived ? 'accepted' : anyReceived ? 'partial' : 'pending_inspection',
      lines,
      note: input.note,
    };
    grns.unshift(grn);

    if (allReceived) {
      order.status = 'received';
      order.deliveryStatus = 'received';
    } else if (anyReceived) {
      order.status = 'partial';
    }
    return grn;
  },

  listPayments(filters) {
    const query = filters.search.trim().toLowerCase();
    const filtered = paymentEligible
      .map(toPaymentRow)
      .filter((row) => {
        if (filters.status !== 'all' && row.status !== filters.status) return false;
        if (filters.supplierId !== 'all' && row.supplierId !== filters.supplierId) return false;
        if (!query) return true;
        return (
          row.poNumber.toLowerCase().includes(query) ||
          row.supplierName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.dueAmount - a.dueAmount);
    return paginate(filtered, filters.page, filters.pageSize);
  },

  recordPayment(input) {
    const order = findOrder(input.poId);
    if (!order) return null;
    order.paidAmount = roundMoney(
      Math.min(order.total, order.paidAmount + Math.max(0, input.amount)),
    );
    order.paymentStatus =
      order.paidAmount >= order.total - 0.005 ? 'paid' : order.paidAmount > 0 ? 'partial' : 'unpaid';
    return toPaymentRow(order);
  },

  dashboard: buildDashboard,
  trend: buildTrend,
  supplierSpend: buildSupplierSpend,
  statusSplit: buildStatusSplit,
};


