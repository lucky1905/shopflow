import { API_ENDPOINTS } from '@/constants';
import { createId, sleep } from '@/lib/utils';
import { httpDelete, httpGet, httpPost, normalizeApiError } from '@/services/api';
import { mapBackendSale, paginateSales, type BackendSale } from './saleMapper';
import { mapBackendProduct, type BackendProduct } from '@/features/inventory/api/productMapper';
import { inventoryService, mockDb } from '@/features/inventory/api';
import {
  changeDue,
  computeCartTotals,
  lineNet,
  receiptNumberFor,
  returnNumberFor,
  roundMoney,
  saleMatchesQuery,
  sortCatalog,
  tendersCoverTotal,
} from '../utils';
import type { ApiError, PaginatedResponse } from '@/types';
import type {
  AiRecommendation,
  CatalogSearch,
  CheckoutInput,
  HoldCartInput,
  HeldCart,
  PosCategory,
  PosCustomer,
  PosCustomerInput,
  PosProduct,
  PosSummary,
  ReturnInput,
  ReturnRecord,
  ReturnableLine,
  SaleFilters,
} from '../types';
import type { CartItem, CartTotals, Sale, SaleItem } from '../types';
import { POS_MOCK_LATENCY_MS, posMockDb } from './pos.mock';

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

function unwrap<T>(response: T): T {
  // The FastAPI backend returns the resource directly, with no data envelope.
  return response;
}

/**
 * Builds the error thrown when a screen hits a backend endpoint that does not
 * exist yet. `501` keeps it distinguishable from a real server fault, and the
 * message names the gap so it is actionable during development.
 */
function notImplemented(resource: string): ApiError {
  return {
    status: 501,
    message: `The ${resource} endpoint is not implemented on the backend yet.`,
  };
}

/** Normalizes unknown throwables into the app-wide ApiError shape. */
function rethrow(error: unknown): never {
  throw normalizeApiError(error);
}

/** Inventory product â†’ POS catalog projection. */
function toPosProduct(product: {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: string;
  imageUrl: string | null;
}): PosProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    sku: product.sku,
    barcode: product.barcode,
    categoryId: product.categoryId,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    unit: product.unit,
    status: product.status as PosProduct['status'],
    imageUrl: product.imageUrl,
  };
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/* -------------------------------------------------------------------------- */
/*  Mock â€” catalog & customers                                                */
/* -------------------------------------------------------------------------- */

const mockCatalogApi = {
  async search({ query, categoryId }: CatalogSearch): Promise<PosProduct[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    let products = mockDb.products.filter((product) => product.status === 'active');
    if (categoryId) products = products.filter((product) => product.categoryId === categoryId);
    return sortCatalog(products.map(toPosProduct), query).slice(0, 60);
  },

  async categories(): Promise<PosCategory[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const counts = new Map<string, number>();
    for (const product of mockDb.products) {
      if (product.status !== 'active') continue;
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return mockDb.categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      productCount: counts.get(category.id) ?? 0,
    }));
  },

  async lookup(code: string): Promise<PosProduct | null> {
    await sleep(POS_MOCK_LATENCY_MS / 3);
    const trimmed = code.trim();
    if (!trimmed) return null;
    const lowered = trimmed.toLowerCase();
    const match = mockDb.products.find(
      (product) =>
        product.barcode === trimmed ||
        product.sku.toLowerCase() === lowered ||
        product.id === trimmed ||
        product.name.toLowerCase() === lowered,
    );
    return match && match.status === 'active' ? toPosProduct(match) : null;
  },
};

const mockCustomersApi = {
  async list(search = ''): Promise<PosCustomer[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const query = search.trim().toLowerCase();
    const matches = posMockDb.customers.filter(
      (customer) =>
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    );
    return [...matches].sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(input: PosCustomerInput): Promise<PosCustomer> {
    await sleep(POS_MOCK_LATENCY_MS);
    const customer: PosCustomer = {
      id: `cus_${createId('c')}`,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      loyaltyPoints: 0,
      tier: 'bronze',
      totalSpent: 0,
      visitCount: 0,
      createdAt: new Date().toISOString(),
    };
    posMockDb.customers.push(customer);
    return customer;
  },
};

/* -------------------------------------------------------------------------- */
/*  Mock â€” sales (checkout + history)                                         */
/* -------------------------------------------------------------------------- */

function assertCheckoutValid(input: CheckoutInput): {
  cartItems: CartItem[];
  totals: CartTotals;
} {
  if (input.items.length === 0) throw { message: 'The cart is empty.' } as const;

  const cartItems: CartItem[] = input.items.map((line) => {
    const product = mockDb.products.find((candidate) => candidate.id === line.productId);
    if (!product) {
      throw { message: 'One of the products is no longer in the catalog.' } as const;
    }
    if (product.stock < line.quantity) {
      throw { message: `Only ${product.stock} Ã— ${product.name} left in stock.` } as const;
    }
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      categoryId: product.categoryId,
      unitPrice: line.unitPrice,
      cost: product.cost,
      quantity: line.quantity,
      unit: product.unit,
      imageUrl: product.imageUrl,
      stockOnHand: product.stock,
      discountPct: line.discountPct,
    };
  });

  const totals = computeCartTotals(cartItems, input.orderDiscount, input.taxRatePct);
  if (!tendersCoverTotal(input.payments, totals.total)) {
    throw { message: 'Payments do not cover the total due.' } as const;
  }
  return { cartItems, totals };
}

/**
 * Spreads order-level discount and tax across lines so receipt rows always
 * add up exactly to the header totals (last line absorbs rounding).
 */
function allocateSaleItems(
  cartItems: CartItem[],
  totals: CartTotals,
  taxRatePct: number,
): SaleItem[] {
  const afterLine = roundMoney(totals.subtotal - totals.lineDiscountTotal);
  const orderRatio = afterLine > 0 ? 1 - totals.orderDiscountAmount / afterLine : 1;

  let sumNet = 0;
  let sumTax = 0;

  return cartItems.map((item, index) => {
    const isLast = index === cartItems.length - 1;
    const net = isLast
      ? roundMoney(totals.taxableAmount - sumNet)
      : roundMoney(lineNet(item) * orderRatio);
    const tax = isLast
      ? roundMoney(totals.taxAmount - sumTax)
      : roundMoney(net * (taxRatePct / 100));
    sumNet = roundMoney(sumNet + net);
    sumTax = roundMoney(sumTax + tax);

    return {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discountPct: item.discountPct,
      lineTotal: net,
      taxAmount: tax,
      cost: item.cost,
    };
  });
}

const mockSalesApi = {
  async list(filters: SaleFilters) {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const matched = posMockDb.sales.filter((sale) => saleMatchesQuery(sale, filters.search));
    const total = matched.length;
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
    const page = Math.min(Math.max(filters.page, 1), totalPages);
    const start = (page - 1) * filters.pageSize;
    return {
      items: matched.slice(start, start + filters.pageSize),
      total,
      page,
      pageSize: filters.pageSize,
      totalPages,
    };
  },

  async get(id: string): Promise<Sale> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const sale = posMockDb.sales.find((candidate) => candidate.id === id);
    if (!sale) throw { message: 'Sale not found.' } as const;
    return sale;
  },

  async checkout(input: CheckoutInput): Promise<Sale> {
    await sleep(POS_MOCK_LATENCY_MS + 150);
    const { cartItems, totals } = assertCheckoutValid(input);
    const items = allocateSaleItems(cartItems, totals, input.taxRatePct);
    const sequence = posMockDb.counters.sale;
    posMockDb.counters.sale += 1;

    const now = new Date();
    const customer = input.customerId
      ? posMockDb.customers.find((candidate) => candidate.id === input.customerId)
      : null;

    const sale: Sale = {
      id: createId('sale'),
      receiptNumber: receiptNumberFor(sequence, now),
      status: 'completed',
      items,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Walk-in customer',
      cashierId: 'usr_demo',
      cashierName: 'Alex Morgan',
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxAmount,
      total: totals.total,
      payments: input.payments,
      changeDue: changeDue(input.payments, totals.total),
      note: input.note,
      refundedTotal: 0,
      createdAt: now.toISOString(),
    };
    posMockDb.sales.unshift(sale);

    // Best-effort stock sync while mocks are on â€” the real backend will
    // decrement stock atomically inside the checkout endpoint.
    for (const line of input.items) {
      try {
        await inventoryService.products.adjustStock({
          productId: line.productId,
          mode: 'out',
          quantity: line.quantity,
          reason: 'Sale',
          note: `${sale.receiptNumber}${input.note ? ` Â· ${input.note}` : ''}`,
        });
      } catch {
        /* never block a completed sale on stock bookkeeping */
      }
    }

    return sale;
  },
};

/* -------------------------------------------------------------------------- */
/*  Mock â€” returns & refunds                                                  */
/* -------------------------------------------------------------------------- */

function computeReturnable(sale: Sale): ReturnableLine[] {
  const returned = new Map<string, number>();
  for (const record of posMockDb.returns) {
    if (record.saleId !== sale.id) continue;
    for (const line of record.items) {
      returned.set(line.productId, (returned.get(line.productId) ?? 0) + line.quantity);
    }
  }
  return sale.items.map((item) => ({
    productId: item.productId,
    name: item.name,
    sku: item.sku,
    unitPrice: roundMoney(item.lineTotal / item.quantity),
    purchasableQty: item.quantity,
    returnableQty: Math.max(0, item.quantity - (returned.get(item.productId) ?? 0)),
  }));
}

const mockReturnsApi = {
  async returnable(saleId: string): Promise<ReturnableLine[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const sale = posMockDb.sales.find((candidate) => candidate.id === saleId);
    if (!sale) throw { message: 'Sale not found.' } as const;
    return computeReturnable(sale);
  },

  async create(input: ReturnInput): Promise<ReturnRecord> {
    await sleep(POS_MOCK_LATENCY_MS + 150);
    const sale = posMockDb.sales.find((candidate) => candidate.id === input.saleId);
    if (!sale) throw { message: 'Sale not found.' } as const;
    if (input.items.length === 0) {
      throw { message: 'Select at least one item to return.' } as const;
    }
    if (sale.status === 'refunded') {
      throw { message: 'This sale was already fully refunded.' } as const;
    }

    const returnable = new Map(computeReturnable(sale).map((line) => [line.productId, line]));

    let refundTotal = 0;
    const items = input.items.map((line) => {
      const available = returnable.get(line.productId);
      if (!available || line.quantity <= 0 || line.quantity > available.returnableQty) {
        throw { message: 'Return quantity exceeds what can still be refunded.' } as const;
      }
      const lineTotal = roundMoney(available.unitPrice * line.quantity);
      refundTotal = roundMoney(refundTotal + lineTotal);
      return {
        productId: line.productId,
        name: available.name,
        sku: available.sku,
        quantity: line.quantity,
        unitPrice: available.unitPrice,
        lineTotal,
        reason: line.reason,
      };
    });

    const sequence = posMockDb.counters.return;
    posMockDb.counters.return += 1;
    const now = new Date();

    const record: ReturnRecord = {
      id: createId('ret'),
      returnNumber: returnNumberFor(sequence, now),
      saleId: sale.id,
      saleReceiptNumber: sale.receiptNumber,
      customerName: sale.customerName,
      items,
      refundTotal,
      refundMethod: input.refundMethod,
      restocked: input.restock,
      note: input.note,
      cashierName: 'Alex Morgan',
      createdAt: now.toISOString(),
    };

    sale.refundedTotal = roundMoney(sale.refundedTotal + refundTotal);
    sale.status = sale.refundedTotal >= sale.total - 0.005 ? 'refunded' : 'partially_refunded';
    posMockDb.returns.unshift(record);

    if (input.restock) {
      for (const line of items) {
        try {
          await inventoryService.products.adjustStock({
            productId: line.productId,
            mode: 'in',
            quantity: line.quantity,
            reason: 'Customer return',
            note: `${record.returnNumber}${input.note ? ` Â· ${input.note}` : ''}`,
          });
        } catch {
          /* best-effort restock while mocks are on */
        }
      }
    }

    return record;
  },
};

/* -------------------------------------------------------------------------- */
/*  Mock â€” held carts                                                         */
/* -------------------------------------------------------------------------- */

const mockHoldsApi = {
  async list(): Promise<HeldCart[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    return [...posMockDb.holds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async save(input: HoldCartInput): Promise<HeldCart> {
    await sleep(POS_MOCK_LATENCY_MS);
    const totals = computeCartTotals(input.items, input.orderDiscount, input.taxRatePct);
    const hold: HeldCart = {
      id: `hold_${posMockDb.counters.hold}`,
      label: input.label.trim(),
      items: input.items,
      customerId: input.customerId,
      customerName: input.customerName,
      orderDiscount: input.orderDiscount,
      taxRatePct: input.taxRatePct,
      note: input.note,
      createdAt: new Date().toISOString(),
      units: totals.units,
      total: totals.total,
    };
    posMockDb.counters.hold += 1;
    posMockDb.holds.unshift(hold);
    return hold;
  },

  async remove(id: string): Promise<void> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const index = posMockDb.holds.findIndex((hold) => hold.id === id);
    if (index >= 0) posMockDb.holds.splice(index, 1);
  },
};

/* -------------------------------------------------------------------------- */
/*  Mock â€” AI recommendations (affinity + upsell rules)                       */
/* -------------------------------------------------------------------------- */

const mockAiApi = {
  async recommendations(productIds: string[]): Promise<AiRecommendation[]> {
    await sleep(POS_MOCK_LATENCY_MS / 2);

    const catalog = mockDb.products
      .filter((product) => product.status === 'active')
      .map(toPosProduct);
    const byId = new Map(catalog.map((product) => [product.id, product]));
    const inCart = new Set(productIds);
    const anchor =
      productIds.map((id) => byId.get(id)?.name).find((name) => name !== undefined) ??
      'this basket';

    const results: AiRecommendation[] = [];
    const seen = new Set<string>();
    const push = (recommendation: AiRecommendation): void => {
      if (inCart.has(recommendation.productId)) return;
      if (seen.has(recommendation.productId)) return;
      if (results.length >= 4) return;
      seen.add(recommendation.productId);
      results.push(recommendation);
    };

    // 1) Affinity â€” items frequently bought together with the basket.
    const affinity = new Map<string, number>();
    for (const sale of posMockDb.sales) {
      const saleIds = new Set(sale.items.map((item) => item.productId));
      const overlap = productIds.filter((id) => saleIds.has(id)).length;
      if (overlap === 0) continue;
      for (const item of sale.items) {
        if (inCart.has(item.productId)) continue;
        affinity.set(item.productId, (affinity.get(item.productId) ?? 0) + overlap);
      }
    }
    [...affinity.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, score]) => {
        const product = byId.get(id);
        if (!product || product.stock <= 0) return;
        push({
          productId: id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          imageUrl: product.imageUrl,
          tag: 'frequent',
          reason: `Frequently bought with ${anchor}`,
          confidence: Math.min(0.95, 0.55 + score * 0.1),
        });
      });

    // 2) Upsell â€” cheapest premium pick inside categories already in the basket.
    const cartProducts = productIds
      .map((id) => byId.get(id))
      .filter((product): product is PosProduct => product !== undefined);
    const maxPrice = cartProducts.length > 0 ? Math.max(...cartProducts.map((p) => p.price)) : 0;
    const cartCategories = new Set(cartProducts.map((p) => p.categoryId));
    const premium = catalog
      .filter(
        (product) =>
          cartCategories.has(product.categoryId) &&
          product.price > maxPrice &&
          product.stock > 0,
      )
      .sort((a, b) => a.price - b.price)[0];
    if (premium) {
      push({
        productId: premium.id,
        name: premium.name,
        price: premium.price,
        unit: premium.unit,
        imageUrl: premium.imageUrl,
        tag: 'upsell',
        reason: 'Upgrade pick for this aisle',
        confidence: 0.62,
      });
    }

    // 3) Fill with bestsellers so the strip is useful even with an empty cart.
    if (results.length < 4) {
      const frequency = new Map<string, number>();
      for (const sale of posMockDb.sales) {
        for (const item of sale.items) {
          frequency.set(item.productId, (frequency.get(item.productId) ?? 0) + item.quantity);
        }
      }
      [...frequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([id]) => {
          const product = byId.get(id);
          if (!product || product.stock <= 0) return;
          push({
            productId: id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            imageUrl: product.imageUrl,
            tag: 'cross_sell',
            reason: 'Popular with shoppers this week',
            confidence: 0.55,
          });
        });
    }

    // 4) Last resort: any in-stock product.
    if (results.length === 0) {
      for (const product of catalog.filter((candidate) => candidate.stock > 0).slice(0, 4)) {
        push({
          productId: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          imageUrl: product.imageUrl,
          tag: 'cross_sell',
          reason: 'Easy add-on',
          confidence: 0.4,
        });
      }
    }

    return results;
  },
};

/* -------------------------------------------------------------------------- */
/*  Mock â€” till summary                                                       */
/* -------------------------------------------------------------------------- */

const mockSummaryApi = {
  async get(): Promise<PosSummary> {
    await sleep(POS_MOCK_LATENCY_MS / 2);
    const todaySales = posMockDb.sales.filter((sale) => isToday(sale.createdAt));
    const todayReturns = posMockDb.returns.filter((record) => isToday(record.createdAt));

    const revenue = roundMoney(todaySales.reduce((sum, sale) => sum + sale.total, 0));
    const refundTotal = roundMoney(
      todayReturns.reduce((sum, record) => sum + record.refundTotal, 0),
    );
    const itemsSold = todaySales.reduce(
      (sum, sale) => sum + sale.items.reduce((lineSum, item) => lineSum + item.quantity, 0),
      0,
    );
    const salesCount = todaySales.length;

    return {
      salesCount,
      revenue,
      refundTotal,
      netRevenue: roundMoney(revenue - refundTotal),
      itemsSold,
      avgBasket: salesCount > 0 ? roundMoney(revenue / salesCount) : 0,
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Real API implementations (typed, ready for the backend)                   */
/*  Flip with VITE_USE_MOCK_API=false â€” mirrors the inventory/auth services.  */
/* -------------------------------------------------------------------------- */

/**
 * Real catalog API backed by `GET /products`.
 *
 * The backend has no dedicated POS search endpoint, so the product list is
 * fetched once and filtered locally by name / SKU / barcode — which is also
 * what the scanner lookup needs.
 */
const realCatalogApi = {
  async search(search: CatalogSearch): Promise<PosProduct[]> {
    try {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      let products = rows.map((product) => fromBackendProduct(product));

      if (search.query) {
        const q = search.query.trim().toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q),
        );
      }

      if (search.categoryId && search.categoryId !== 'all') {
        products = products.filter((p) => p.categoryId === search.categoryId);
      }

      return products;
    } catch (error) {
      rethrow(error);
    }
  },

  async categories(): Promise<PosCategory[]> {
    try {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      const products = rows.map((product) => fromBackendProduct(product));
      const map = new Map<string, PosCategory>();

      for (const product of products) {
        const existing = map.get(product.categoryId);
        if (existing) {
          existing.productCount += 1;
        } else {
          map.set(product.categoryId, {
            id: product.categoryId,
            name: product.description.split(' - ')[0] || 'Uncategorised',
            color: 'hsl(var(--primary))',
            productCount: 1,
          });
        }
      }

      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      rethrow(error);
    }
  },

  /** Exact barcode match used by the hardware scanner. */
  async lookup(code: string): Promise<PosProduct | null> {
    try {
      const raw = await httpGet<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_BARCODE(code));
      return fromBackendProduct(raw);
    } catch {
      // Fall back to a local scan in case the exact endpoint is unavailable.
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      const match = rows.find(
        (row) => row.barcode === code || String(row.product_id) === code.trim(),
      );
      return match ? fromBackendProduct(match) : null;
    }
  },
};

/** Converts a backend product row into the POS product shape. */
function fromBackendProduct(raw: BackendProduct): PosProduct {
  const mapped = mapBackendProduct(raw);
  return {
    id: mapped.id,
    name: mapped.name,
    description: mapped.description,
    sku: mapped.sku,
    barcode: mapped.barcode,
    categoryId: mapped.categoryId,
    price: mapped.price,
    cost: mapped.cost,
    stock: mapped.stock,
    unit: mapped.unit,
    status: 'active',
    imageUrl: mapped.imageUrl,
  };
}

/**
 * Customers have no backend endpoint. Reads fall back to the mock dataset so
 * the customer selector keeps working; writes surface a clear 501.
 */
const realCustomersApi = {
  async list(): Promise<PosCustomer[]> {
    return mockCustomersApi.list();
  },

  async get(id: string): Promise<PosCustomer> {
    const all = await mockCustomersApi.list();
    const match = all.find((customer) => customer.id === id);
    if (!match) throw notImplemented('customers');
    return match;
  },

  async create(input: PosCustomerInput): Promise<PosCustomer> {
    void input;
    throw notImplemented('customers');
  },
};

/**
 * Real sales API backed by the FastAPI `/sales` endpoints.
 *
 * The backend owns pricing and stock validation, so checkout only sends
 * product ids and quantities — the response carries the authoritative totals.
 */
const realSalesApi = {
  async list(filters: SaleFilters): Promise<PaginatedResponse<Sale>> {
    try {
      const [rawSales, products] = await Promise.all([
        httpGet<BackendSale[]>(API_ENDPOINTS.SALES),
        httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS).catch(() => [] as BackendProduct[]),
      ]);

      const names = new Map(products.map((p) => [p.product_id, p.product_name]));
      const sales = rawSales.map((sale) => mapBackendSale(sale, names));
      return paginateSales(sales, filters);
    } catch (error) {
      rethrow(error);
    }
  },

  async get(id: string): Promise<Sale> {
    try {
      const raw = await httpGet<BackendSale>(API_ENDPOINTS.SALE_BY_ID(id));
      let names = new Map<number, string>();
      try {
        const products = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
        names = new Map(products.map((p) => [p.product_id, p.product_name]));
      } catch {
        /* names are cosmetic only */
      }
      return mapBackendSale(raw, names);
    } catch (error) {
      rethrow(error);
    }
  },

  /**
   * Records a sale. Unit prices are recomputed server-side and stock is
   * decremented in the same transaction, so the request only carries ids.
   */
  async checkout(input: CheckoutInput): Promise<Sale> {
    try {
      const primary = input.payments[0];
      const body = {
        payment_method: primary?.method ?? 'cash',
        items: input.items.map((item) => ({
          product_id: Number(item.productId),
          quantity: item.quantity,
        })),
      };

      const created = await httpPost<BackendSale>(API_ENDPOINTS.SALES, body);

      let names = new Map<number, string>();
      try {
        const products = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
        names = new Map(products.map((p) => [p.product_id, p.product_name]));
      } catch {
        /* names are cosmetic only */
      }

      return mapBackendSale(created, names);
    } catch (error) {
      rethrow(error);
    }
  },
};

const realReturnsApi = {
  async returnable(saleId: string): Promise<ReturnableLine[]> {
    try {
      return unwrap(
        await httpGet<ReturnableLine[]>(`${API_ENDPOINTS.POS_SALES}/${saleId}/returnable`),
      );
    } catch (error) {
      rethrow(error);
    }
  },

  async create(input: ReturnInput): Promise<ReturnRecord> {
    try {
      return unwrap(await httpPost<ReturnRecord, ReturnInput>(`${API_ENDPOINTS.POS}/returns`, input));
    } catch (error) {
      rethrow(error);
    }
  },
};

const realHoldsApi = {
  async list(): Promise<HeldCart[]> {
    try {
      return unwrap(await httpGet<HeldCart[]>(`${API_ENDPOINTS.POS}/holds`));
    } catch (error) {
      rethrow(error);
    }
  },

  async save(input: HoldCartInput): Promise<HeldCart> {
    try {
      return unwrap(await httpPost<HeldCart, HoldCartInput>(`${API_ENDPOINTS.POS}/holds`, input));
    } catch (error) {
      rethrow(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await httpDelete(`${API_ENDPOINTS.POS}/holds/${id}`);
    } catch (error) {
      rethrow(error);
    }
  },
};

const realAiApi = {
  async recommendations(productIds: string[]): Promise<AiRecommendation[]> {
    try {
      return unwrap(
        await httpGet<AiRecommendation[]>(API_ENDPOINTS.AI_RECOMMENDATIONS, {
          params: { productIds: productIds.join(','), limit: 4 },
        }),
      );
    } catch (error) {
      rethrow(error);
    }
  },
};

const realSummaryApi = {
  async get(): Promise<PosSummary> {
    try {
      return unwrap(await httpGet<PosSummary>(`${API_ENDPOINTS.POS}/summary`));
    } catch (error) {
      rethrow(error);
    }
  },
};

/* -------------------------------------------------------------------------- */
/*  Public service surface â€” the only import UI code should use.              */
/* -------------------------------------------------------------------------- */

export const posService = {
  catalog: USE_MOCK_API ? mockCatalogApi : realCatalogApi,
  customers: USE_MOCK_API ? mockCustomersApi : realCustomersApi,
  sales: USE_MOCK_API ? mockSalesApi : realSalesApi,
  returns: USE_MOCK_API ? mockReturnsApi : realReturnsApi,
  holds: USE_MOCK_API ? mockHoldsApi : realHoldsApi,
  ai: USE_MOCK_API ? mockAiApi : realAiApi,
  summary: USE_MOCK_API ? mockSummaryApi : realSummaryApi,
} as const;

export type PosService = typeof posService;






