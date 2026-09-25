import { INVOICE_TERMS, SALES_TAX_RATE_PCT } from '../constants';
import { SALES_CHANNEL_META } from '../constants';
import {
  applyInvoiceFilters,
  byNewest,
  daysAgoIso,
  invoiceNumberFor,
  isoDay,
  paginate,
  pctChange,
  resolvePaymentStatus,
  returnNumberFor,
  roundMoney,
  shortDayLabel,
} from '../utils';
import type { PaginatedResponse } from '@/types';
import type {
  ChannelPoint,
  InvoiceDetail,
  InvoiceLine,
  InvoicePayment,
  InvoiceStatus,
  SalesChannel,
  SalesDashboardStats,
  SalesFilters,
  SalesReturnFilters,
  SalesReturnLine,
  SalesReturnRecord,
  SalesTrendPoint,
  TopProductPoint,
  InvoiceSummary,
} from '../types';

/** Mock round-trip latency for Sales calls. */
export const SALES_MOCK_LATENCY_MS = 280;

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

function weighted<T extends string>(rnd: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rnd() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[0][0];
}

/* -------------------------------------------------------------------------- */
/*  Seeds                                                                     */
/* -------------------------------------------------------------------------- */

interface SeedCustomer {
  id: string;
  name: string;
}

const SEED_CUSTOMERS: SeedCustomer[] = [
  { id: 'cus_01', name: 'Maria Garcia' },
  { id: 'cus_02', name: 'James Carter' },
  { id: 'cus_03', name: 'Aisha Bello' },
  { id: 'cus_04', name: 'Tom Nguyen' },
  { id: 'cus_05', name: 'Priya Patel' },
  { id: 'cus_06', name: 'Luis Romero' },
  { id: 'cus_07', name: 'Emma Wilson' },
  { id: 'cus_08', name: 'Daniel Kim' },
  { id: 'cus_09', name: 'Northside Cafe' },
  { id: 'cus_10', name: 'Bright Mart Retail' },
];

interface SeedProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
}

const SEED_PRODUCTS: SeedProduct[] = [
  { id: 'prd_01', name: 'Sunflower Oil 1L', sku: 'GRO-101', price: 12.99, cost: 8.4 },
  { id: 'prd_02', name: 'Basmati Rice 5kg', sku: 'GRO-214', price: 18.5, cost: 13.1 },
  { id: 'prd_03', name: 'Whole Milk 1L', sku: 'DAI-322', price: 2.49, cost: 1.6 },
  { id: 'prd_04', name: 'Arabica Coffee 250g', sku: 'BEV-118', price: 9.75, cost: 6.2 },
  { id: 'prd_05', name: 'Sea Salt Crisps 150g', sku: 'SNK-410', price: 3.25, cost: 1.8 },
  { id: 'prd_06', name: 'Organic Green Tea', sku: 'BEV-226', price: 6.5, cost: 3.9 },
  { id: 'prd_07', name: 'Dark Chocolate 90g', sku: 'SNK-305', price: 4.2, cost: 2.35 },
  { id: 'prd_08', name: 'Orange Juice 1L', sku: 'BEV-141', price: 4.99, cost: 3.1 },
  { id: 'prd_09', name: 'Spaghetti 500g', sku: 'GRO-337', price: 2.75, cost: 1.55 },
  { id: 'prd_10', name: 'Olive Oil 500ml', sku: 'GRO-152', price: 14.5, cost: 9.8 },
  { id: 'prd_11', name: 'Greek Yogurt 4pk', sku: 'DAI-411', price: 5.4, cost: 3.2 },
  { id: 'prd_12', name: 'Almond Cookies 200g', sku: 'SNK-219', price: 5.9, cost: 3.4 },
  { id: 'prd_13', name: 'Sparkling Water 6pk', sku: 'BEV-302', price: 6.25, cost: 3.75 },
  { id: 'prd_14', name: 'Peanut Butter 400g', sku: 'GRO-423', price: 7.8, cost: 4.9 },
];

const SEED_CASHIERS = ['Ava Reynolds', 'Noah Kim', 'Sofia Martinez', 'Liam Brooks'] as const;
const TAX_RATE = SALES_TAX_RATE_PCT;

/* -------------------------------------------------------------------------- */
/*  Invoice generation                                                        */
/* -------------------------------------------------------------------------- */

interface BuildContext {
  rnd: () => number;
  sequence: number;
}

function buildInvoice(ctx: BuildContext, daysAgo: number): InvoiceDetail {
  const { rnd } = ctx;
  const createdAt = daysAgoIso(daysAgo, 9 + Math.floor(rnd() * 10), Math.floor(rnd() * 60));
  const channel: SalesChannel = weighted(rnd, { pos: 60, online: 27, wholesale: 13 });
  const customer = pick(rnd, SEED_CUSTOMERS);
  const invoiceNumber = invoiceNumberFor(++ctx.sequence, new Date(createdAt));

  const lineCount = 1 + Math.floor(rnd() * 4);
  const chosen = new Set<number>();
  const lines: InvoiceLine[] = [];
  while (lines.length < lineCount) {
    const index = Math.floor(rnd() * SEED_PRODUCTS.length);
    if (chosen.has(index)) continue;
    chosen.add(index);
    const product = SEED_PRODUCTS[index];
    const quantity = 1 + Math.floor(rnd() * (channel === 'wholesale' ? 8 : 4));
    const discountPct = rnd() < (channel === 'wholesale' ? 0.5 : 0.15) ? 10 : 0;
    const gross = product.price * quantity;
    lines.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitPrice: product.price,
      quantity,
      discountPct,
      lineTotal: roundMoney(gross * (1 - discountPct / 100)),
      cost: product.cost,
    });
  }

  const subtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
  );
  const discountTotal = roundMoney(
    lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity * (line.discountPct / 100),
      0,
    ),
  );
  const taxable = roundMoney(subtotal - discountTotal);
  const taxTotal = roundMoney(taxable * (TAX_RATE / 100));
  const total = roundMoney(taxable + taxTotal);

  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + 14);

  let status: InvoiceStatus;
  const roll = rnd();
  if (daysAgo <= 1 && roll < 0.2) status = 'draft';
  else if (roll < 0.68) status = 'paid';
  else if (roll < 0.8) status = 'partial';
  else if (roll < 0.88 && daysAgo >= 15) status = 'overdue';
  else if (roll < 0.96) status = 'sent';
  else status = 'void';

  let paidAmount = 0;
  if (status === 'paid') paidAmount = total;
  else if (status === 'partial') paidAmount = roundMoney(total * (0.3 + rnd() * 0.4));

  const payments: InvoicePayment[] = [];
  if (paidAmount > 0) {
    payments.push({
      id: `pay_${ctx.sequence}_1`,
      method: weighted(rnd, { card: 50, cash: 35, mobile: 10, transfer: 5 }),
      amount: paidAmount,
      paidAt: createdAt,
      reference: `TXN-${String(100000 + Math.floor(rnd() * 899999))}`,
    });
  }

  return {
    id: `inv_${ctx.sequence}`,
    invoiceNumber,
    customerId: customer.id,
    customerName: customer.name,
    channel,
    status,
    paymentStatus: resolvePaymentStatus(total, paidAmount, 0),
    createdAt,
    dueDate: dueDate.toISOString().slice(0, 10),
    subtotal,
    discountTotal,
    taxTotal,
    total,
    paidAmount,
    refundedTotal: 0,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    cashierName: channel === 'wholesale' ? 'Account desk' : pick(rnd, SEED_CASHIERS),
    taxRatePct: TAX_RATE,
    note: rnd() < 0.12 ? 'Customer requested gift wrapping.' : '',
    shippingAddress:
      channel === 'online'
        ? '128 Harbor Lane, Suite 4 · Portland, OR 97201'
        : channel === 'wholesale'
          ? 'Dock 2 · 4100 Industrial Way, Portland, OR 97210'
          : 'In-store pickup',
    terms: INVOICE_TERMS,
    lines,
    payments,
    returnIds: [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Seed the database                                                         */
/* -------------------------------------------------------------------------- */

const rnd = mulberry32(20260924);
const ctx: BuildContext = { rnd, sequence: 0 };

const invoices: InvoiceDetail[] = [];
for (let daysAgo = 89; daysAgo >= 0; daysAgo -= 1) {
  const ordersToday = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < ordersToday; i += 1) invoices.push(buildInvoice(ctx, daysAgo));
}
invoices.sort(byNewest);

/* -------------------------------------------------------------------------- */
/*  Returns generation                                                        */
/* -------------------------------------------------------------------------- */

const RETURN_REASONS = ['Defective / damaged', 'Wrong item', 'Changed mind', 'Expired', 'Other'];
const REFUND_METHODS = ['original', 'cash', 'store_credit'] as const;

const returns: SalesReturnRecord[] = [];
let returnSequence = 0;

for (const invoice of invoices) {
  if (returns.length >= 16) break;
  if (invoice.status !== 'paid' || invoice.total < 40) continue;
  const daysAgo = Math.floor((Date.now() - new Date(invoice.createdAt).getTime()) / 86_400_000);
  if (daysAgo < 3 || daysAgo > 80 || rnd() > 0.18) continue;

  const line = pick(rnd, invoice.lines);
  const quantity = Math.min(2, line.quantity);
  const refundTotal = roundMoney(line.lineTotal * (quantity / line.quantity));
  const processed = returns.length % 4 !== 3; // every 4th stays pending
  const createdAt = daysAgoIso(Math.max(1, daysAgo - 1), 11, 15);
  const record: SalesReturnRecord = {
    id: `ret_${returnSequence + 1}`,
    returnNumber: returnNumberFor(++returnSequence, new Date(createdAt)),
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    lines: [
      {
        productId: line.productId,
        name: line.name,
        sku: line.sku,
        quantity,
        unitPrice: line.unitPrice,
        reason: pick(rnd, RETURN_REASONS),
        lineTotal: roundMoney(line.unitPrice * quantity),
      } satisfies SalesReturnLine,
    ],
    refundTotal,
    refundMethod: pick(rnd, REFUND_METHODS),
    status: processed ? 'processed' : 'pending',
    note: processed ? '' : 'Awaiting manager approval.',
    processedAt: processed ? createdAt : null,
    createdAt,
  };

  if (processed) {
    invoice.refundedTotal = roundMoney(invoice.refundedTotal + refundTotal);
    invoice.paymentStatus = resolvePaymentStatus(
      invoice.total,
      invoice.paidAmount,
      invoice.refundedTotal,
    );
  }
  invoice.returnIds.push(record.id);
  returns.push(record);
}
returns.sort(byNewest);

/* -------------------------------------------------------------------------- */
/*  Analytics helpers                                                         */
/* -------------------------------------------------------------------------- */

const COUNTABLE = (invoice: InvoiceDetail) => invoice.status !== 'void' && invoice.status !== 'draft';

function withinDays(iso: string, days: number): boolean {
  const cutoff = Date.now() - days * 86_400_000;
  return new Date(iso).getTime() >= cutoff;
}

function statsForWindow(days: number) {
  const cutoff = Date.now() - days * 86_400_000;
  const previousCutoff = cutoff - days * 86_400_000;
  let netRevenue = 0;
  let grossRevenue = 0;
  let orderCount = 0;
  let unitsSold = 0;
  let refundTotal = 0;
  let overdueTotal = 0;
  let prevNet = 0;
  let prevOrders = 0;

  for (const invoice of invoices) {
    const at = new Date(invoice.createdAt).getTime();
    if (at >= cutoff && COUNTABLE(invoice)) {
      orderCount += 1;
      unitsSold += invoice.itemCount;
      grossRevenue += invoice.total;
      netRevenue += invoice.total - invoice.refundedTotal;
      if (invoice.status === 'overdue') overdueTotal += invoice.total - invoice.paidAmount;
    } else if (at >= previousCutoff && at < cutoff && COUNTABLE(invoice)) {
      prevNet += invoice.total - invoice.refundedTotal;
      prevOrders += 1;
    }
  }
  for (const record of returns) {
    if (record.status === 'processed' && withinDays(record.createdAt, days)) {
      refundTotal += record.refundTotal;
    }
  }

  const pendingRefunds = returns.filter((record) => record.status === 'pending').length;
  const net = roundMoney(netRevenue);
  return {
    netRevenue: net,
    grossRevenue: roundMoney(grossRevenue),
    orderCount,
    avgOrderValue: orderCount > 0 ? roundMoney(net / orderCount) : 0,
    refundTotal: roundMoney(refundTotal),
    unitsSold,
    revenueChangePct: pctChange(net, roundMoney(prevNet)),
    orderChangePct: pctChange(orderCount, prevOrders),
    pendingRefunds,
    overdueTotal: roundMoney(overdueTotal),
  };
}

function buildTrend(days: number) {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i -= 1) buckets.set(isoDay(i), { revenue: 0, orders: 0 });

  for (const invoice of invoices) {
    if (!COUNTABLE(invoice)) continue;
    const key = invoice.createdAt.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += invoice.total - invoice.refundedTotal;
    bucket.orders += 1;
  }

  return Array.from(buckets, ([date, bucket]) => ({
    date,
    label: shortDayLabel(date),
    revenue: roundMoney(bucket.revenue),
    orders: bucket.orders,
  }));
}

function buildTopProducts(days: number) {
  const totals = new Map<string, { name: string; units: number; revenue: number }>();
  for (const invoice of invoices) {
    if (!COUNTABLE(invoice) || !withinDays(invoice.createdAt, days)) continue;
    for (const line of invoice.lines) {
      const entry = totals.get(line.productId) ?? { name: line.name, units: 0, revenue: 0 };
      entry.units += line.quantity;
      entry.revenue += line.lineTotal;
      totals.set(line.productId, entry);
    }
  }
  return Array.from(totals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((entry) => ({ name: entry.name, units: entry.units, revenue: roundMoney(entry.revenue) }));
}

function buildChannels(days: number): ChannelPoint[] {
  const revenueByChannel = new Map<SalesChannel, number>();
  let total = 0;
  for (const invoice of invoices) {
    if (!COUNTABLE(invoice) || !withinDays(invoice.createdAt, days)) continue;
    const net = invoice.total - invoice.refundedTotal;
    revenueByChannel.set(invoice.channel, (revenueByChannel.get(invoice.channel) ?? 0) + net);
    total += net;
  }
  return (Object.keys(SALES_CHANNEL_META) as SalesChannel[]).map((channel) => {
    const revenue = roundMoney(revenueByChannel.get(channel) ?? 0);
    return {
      name: SALES_CHANNEL_META[channel].label,
      revenue,
      sharePct: total > 0 ? roundMoney((revenue / total) * 100) : 0,
      color: SALES_CHANNEL_META[channel].color,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Public mock API                                                           */
/* -------------------------------------------------------------------------- */

export interface SalesMockDb {
  listInvoices(filters: SalesFilters): PaginatedResponse<InvoiceSummary>;
  getInvoice(id: string): InvoiceDetail | null;
  listReturns(filters: SalesReturnFilters): PaginatedResponse<SalesReturnRecord>;
  processReturn(id: string): SalesReturnRecord | null;
  dashboard(): SalesDashboardStats;
  trend(days: number): SalesTrendPoint[];
  topProducts(days: number): TopProductPoint[];
  channels(days: number): ChannelPoint[];
  recentInvoices(limit: number): InvoiceSummary[];
}

export const salesMockDb: SalesMockDb = {
  listInvoices(filters) {
    const filtered = applyInvoiceFilters(invoices, filters);
    // InvoiceDetail extends InvoiceSummary — page slices satisfy the contract.
    return paginate(filtered, filters.page, filters.pageSize);
  },

  getInvoice(id) {
    return invoices.find((invoice) => invoice.id === id) ?? null;
  },

  listReturns(filters) {
    const query = filters.search.trim().toLowerCase();
    const filtered = returns.filter((record) => {
      if (filters.status !== 'all' && record.status !== filters.status) return false;
      if (!query) return true;
      return (
        record.returnNumber.toLowerCase().includes(query) ||
        record.invoiceNumber.toLowerCase().includes(query) ||
        record.customerName.toLowerCase().includes(query)
      );
    });
    return paginate(filtered, filters.page, filters.pageSize);
  },

  processReturn(id) {
    const record = returns.find((row) => row.id === id);
    if (!record || record.status === 'processed') return record ?? null;
    record.status = 'processed';
    record.processedAt = new Date().toISOString();
    const invoice = invoices.find((row) => row.id === record.invoiceId);
    if (invoice) {
      invoice.refundedTotal = roundMoney(invoice.refundedTotal + record.refundTotal);
      invoice.paymentStatus = resolvePaymentStatus(
        invoice.total,
        invoice.paidAmount,
        invoice.refundedTotal,
      );
    }
    return record;
  },

  dashboard() {
    return statsForWindow(30);
  },

  trend: buildTrend,
  topProducts: buildTopProducts,
  channels: buildChannels,

  recentInvoices(limit) {
    return invoices.filter(COUNTABLE).slice(0, limit);
  },
};
