import { computeCartTotals, receiptNumberFor, returnNumberFor, roundMoney } from '../utils';
import { DEFAULT_TAX_RATE_PCT } from '../constants';
import type {
  CartItem,
  HeldCart,
  PaymentTender,
  PosCustomer,
  ReturnRecord,
  Sale,
  SaleItem,
  SaleStatus,
} from '../types';

/** Mock round-trip latency for POS calls (kept snappy for cashier UX). */
export const POS_MOCK_LATENCY_MS = 320;

function daysAgoIso(days: number, hour: number, minute = 0): string {
  const at = new Date();
  at.setDate(at.getDate() - days);
  at.setHours(hour, minute, 0, 0);
  return at.toISOString();
}

/* -------------------------------------------------------------------------- */
/*  Customers                                                                 */
/* -------------------------------------------------------------------------- */

const SEED_CUSTOMERS: PosCustomer[] = [
  { id: 'cus_1', name: 'Maria Garcia', email: 'maria.garcia@example.com', phone: '+1 (555) 201-8841', loyaltyPoints: 1240, tier: 'gold', totalSpent: 2380.5, visitCount: 64, createdAt: daysAgoIso(210, 10) },
  { id: 'cus_2', name: 'James Carter', email: 'j.carter@example.com', phone: '+1 (555) 771-3320', loyaltyPoints: 640, tier: 'silver', totalSpent: 1120.75, visitCount: 33, createdAt: daysAgoIso(180, 11) },
  { id: 'cus_3', name: 'Aisha Bello', email: 'aisha.b@example.com', phone: '+1 (555) 664-9087', loyaltyPoints: 210, tier: 'bronze', totalSpent: 310.4, visitCount: 9, createdAt: daysAgoIso(95, 14) },
  { id: 'cus_4', name: 'Tom Nguyen', email: 'tom.nguyen@example.com', phone: '+1 (555) 382-1145', loyaltyPoints: 880, tier: 'silver', totalSpent: 1560.2, visitCount: 41, createdAt: daysAgoIso(150, 16) },
  { id: 'cus_5', name: 'Priya Patel', email: 'priya.p@example.com', phone: '+1 (555) 909-2274', loyaltyPoints: 1450, tier: 'gold', totalSpent: 2740.9, visitCount: 70, createdAt: daysAgoIso(240, 9) },
  { id: 'cus_6', name: 'Luis Romero', email: 'luis.romero@example.com', phone: '+1 (555) 445-6612', loyaltyPoints: 95, tier: 'bronze', totalSpent: 142.6, visitCount: 4, createdAt: daysAgoIso(40, 12) },
  { id: 'cus_7', name: 'Emma Wilson', email: 'emma.w@example.com', phone: '+1 (555) 230-8890', loyaltyPoints: 520, tier: 'silver', totalSpent: 940.15, visitCount: 27, createdAt: daysAgoIso(120, 15) },
];

/* -------------------------------------------------------------------------- */
/*  Product snapshots (mirror the inventory seeds used by history + holds)    */
/* -------------------------------------------------------------------------- */

interface SeedProductRow {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
}

const SEED_PRODUCTS: Record<string, SeedProductRow> = {
  prd_01: { id: 'prd_01', name: 'Sunflower Oil 1L', sku: 'GRO-101', barcode: '4006381333931', categoryId: 'cat_1', price: 12.99, cost: 8.4, stock: 34, unit: 'pc' },
  prd_02: { id: 'prd_02', name: 'Basmati Rice 5kg', sku: 'GRO-214', barcode: '5011026123457', categoryId: 'cat_1', price: 18.5, cost: 13.1, stock: 142, unit: 'pack' },
  prd_03: { id: 'prd_03', name: 'Whole Milk 1L', sku: 'DAI-322', barcode: '4400103210199', categoryId: 'cat_3', price: 2.49, cost: 1.6, stock: 96, unit: 'pc' },
};

function seedCartItem(productId: string, quantity: number, discountPct = 0): CartItem {
  const row = SEED_PRODUCTS[productId];
  return {
    productId: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.categoryId,
    unitPrice: row.price,
    cost: row.cost,
    quantity,
    unit: row.unit,
    imageUrl: null,
    stockOnHand: row.stock,
    discountPct,
  };
}

/* -------------------------------------------------------------------------- */
/*  Sale builder                                                              */
/* -------------------------------------------------------------------------- */

interface SeedLine {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  cost: number;
  quantity: number;
}

function L(
  productId: string,
  name: string,
  sku: string,
  unitPrice: number,
  cost: number,
  quantity: number,
): SeedLine {
  return { productId, name, sku, unitPrice, cost, quantity };
}

interface SeedSaleInput {
  seq: number;
  days: number;
  hour: number;
  minute?: number;
  customerId: string | null;
  customerName: string;
  lines: SeedLine[];
  method: PaymentTender['method'];
}

/** Resolves a seeded customer (empty id → walk-in). */
function cust(id: string): { customerId: string | null; customerName: string } {
  const found = SEED_CUSTOMERS.find((customer) => customer.id === id);
  return { customerId: found?.id ?? null, customerName: found?.name ?? 'Walk-in customer' };
}

function buildSeedSale(input: SeedSaleInput): Sale {
  const createdAt = daysAgoIso(input.days, input.hour, input.minute ?? 0);
  const cartItems: CartItem[] = input.lines.map((line) => ({
    productId: line.productId,
    name: line.name,
    sku: line.sku,
    barcode: '',
    categoryId: '',
    unitPrice: line.unitPrice,
    cost: line.cost,
    quantity: line.quantity,
    unit: 'pc',
    imageUrl: null,
    stockOnHand: 999,
    discountPct: 0,
  }));

  const totals = computeCartTotals(cartItems, { type: 'percent', value: 0 }, DEFAULT_TAX_RATE_PCT);
  const items: SaleItem[] = cartItems.map((item) => {
    const net = roundMoney(item.unitPrice * item.quantity);
    return {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discountPct: 0,
      lineTotal: net,
      taxAmount: roundMoney(net * (DEFAULT_TAX_RATE_PCT / 100)),
      cost: item.cost,
    };
  });

  const paid = input.method === 'cash' ? Math.ceil(totals.total / 5) * 5 : totals.total;
  const payments: PaymentTender[] =
    input.method === 'cash'
      ? [{ method: 'cash', amount: totals.total, tendered: paid }]
      : [{ method: input.method, amount: totals.total }];

  return {
    id: `sale_${input.seq}`,
    receiptNumber: receiptNumberFor(input.seq, new Date(createdAt)),
    status: 'completed' satisfies SaleStatus,
    items,
    customerId: input.customerId,
    customerName: input.customerName,
    cashierId: 'usr_demo',
    cashierName: 'Alex Morgan',
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxAmount,
    total: totals.total,
    payments,
    changeDue: roundMoney(paid - totals.total),
    note: '',
    refundedTotal: 0,
    createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/*  Seeded sales history (newest first after sort)                            */
/* -------------------------------------------------------------------------- */

const SEED_SALES: Sale[] = [
  buildSeedSale({ seq: 43, days: 0, hour: 11, minute: 40, ...cust('cus_3'), method: 'mobile', lines: [L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 2), L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 1)] }),
  buildSeedSale({ seq: 42, days: 0, hour: 10, minute: 22, ...cust('cus_1'), method: 'card', lines: [L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 1), L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 3)] }),
  buildSeedSale({ seq: 41, days: 0, hour: 9, minute: 5, ...cust(''), method: 'cash', lines: [L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 2), L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 1)] }),
  buildSeedSale({ seq: 40, days: 1, hour: 16, minute: 15, ...cust('cus_2'), method: 'card', lines: [L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 2)] }),
  buildSeedSale({ seq: 39, days: 1, hour: 12, minute: 3, ...cust(''), method: 'cash', lines: [L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 6), L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 1)] }),
  buildSeedSale({ seq: 38, days: 1, hour: 18, minute: 47, ...cust('cus_4'), method: 'card', lines: [L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 1), L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 1), L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 2)] }),
  buildSeedSale({ seq: 37, days: 2, hour: 9, minute: 31, ...cust('cus_5'), method: 'cash', lines: [L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 3)] }),
  buildSeedSale({ seq: 36, days: 2, hour: 14, minute: 12, ...cust('cus_1'), method: 'card', lines: [L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 4)] }),
  buildSeedSale({ seq: 35, days: 3, hour: 11, minute: 0, ...cust(''), method: 'mobile', lines: [L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 1)] }),
  buildSeedSale({ seq: 34, days: 4, hour: 15, minute: 20, ...cust('cus_2'), method: 'card', lines: [L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 1), L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 1)] }),
  buildSeedSale({ seq: 33, days: 5, hour: 10, minute: 45, ...cust('cus_6'), method: 'cash', lines: [L('prd_01', 'Sunflower Oil 1L', 'GRO-101', 12.99, 8.4, 2), L('prd_02', 'Basmati Rice 5kg', 'GRO-214', 18.5, 13.1, 1)] }),
  buildSeedSale({ seq: 32, days: 6, hour: 17, minute: 35, ...cust(''), method: 'card', lines: [L('prd_03', 'Whole Milk 1L', 'DAI-322', 2.49, 1.6, 12)] }),
];

/* -------------------------------------------------------------------------- */
/*  Seeded return (partial refund of sale_36)                                 */
/* -------------------------------------------------------------------------- */

const SEED_RETURNS: ReturnRecord[] = [];

const REFUNDED_SALE = SEED_SALES.find((sale) => sale.id === 'sale_36');
if (REFUNDED_SALE) {
  const line = REFUNDED_SALE.items.find((item) => item.productId === 'prd_03');
  if (line) {
    const quantity = 2;
    const unitPrice = roundMoney(line.lineTotal / line.quantity);
    const refundTotal = roundMoney(unitPrice * quantity);
    const createdAt = daysAgoIso(1, 10, 30);

    SEED_RETURNS.push({
      id: 'ret_1',
      returnNumber: returnNumberFor(1, new Date(createdAt)),
      saleId: REFUNDED_SALE.id,
      saleReceiptNumber: REFUNDED_SALE.receiptNumber,
      customerName: REFUNDED_SALE.customerName,
      items: [
        { productId: line.productId, name: line.name, sku: line.sku, quantity, unitPrice, lineTotal: refundTotal, reason: 'changed_mind' },
      ],
      refundTotal,
      refundMethod: 'original',
      restocked: true,
      note: 'Carton leaked',
      cashierName: 'Alex Morgan',
      createdAt,
    });

    REFUNDED_SALE.refundedTotal = refundTotal;
    REFUNDED_SALE.status = 'partially_refunded';
  }
}

/* -------------------------------------------------------------------------- */
/*  Held carts                                                                */
/* -------------------------------------------------------------------------- */

const SEED_HOLDS: HeldCart[] = [
  { id: 'hold_1', label: 'ATM run – lane 2', items: [seedCartItem('prd_01', 1), seedCartItem('prd_03', 2)], customerId: null, customerName: 'Walk-in customer', orderDiscount: { type: 'percent', value: 0 }, taxRatePct: DEFAULT_TAX_RATE_PCT, note: 'Customer getting cash', createdAt: daysAgoIso(0, 11, 50), units: 0, total: 0 },
  { id: 'hold_2', label: 'Bulk order – Aisha', items: [seedCartItem('prd_02', 3), seedCartItem('prd_03', 6)], customerId: 'cus_3', customerName: 'Aisha Bello', orderDiscount: { type: 'percent', value: 5 }, taxRatePct: DEFAULT_TAX_RATE_PCT, note: '', createdAt: daysAgoIso(1, 15, 10), units: 0, total: 0 },
];

for (const hold of SEED_HOLDS) {
  hold.units = hold.items.reduce((sum, item) => sum + item.quantity, 0);
  hold.total = computeCartTotals(hold.items, hold.orderDiscount, hold.taxRatePct).total;
}

/* -------------------------------------------------------------------------- */
/*  Database assembly                                                         */
/* -------------------------------------------------------------------------- */

export const posMockDb = {
  counters: { sale: 44, return: 2, hold: 3, customer: 8 },
  customers: SEED_CUSTOMERS.map((customer) => ({ ...customer })),
  sales: [...SEED_SALES].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  holds: [...SEED_HOLDS].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  returns: SEED_RETURNS,
};