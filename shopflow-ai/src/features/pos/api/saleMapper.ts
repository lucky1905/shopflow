/**
 * Mapping between the FastAPI billing schemas and the POS `Sale` model.
 *
 * `POST /sales` accepts only `{ payment_method, items: [{ product_id,
 * quantity }] }` - unit prices are read from the database server-side, which
 * is the correct security posture. Everything the backend does not return
 * (receipt numbers, tenders, change due) is derived locally.
 */
import type { PaginatedResponse } from '@/types';
import type { PaymentMethod, Sale, SaleItem, SaleStatus } from '../types';

export interface BackendSaleItem {
  sale_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
}

export interface BackendSale {
  sale_id: number;
  user_id: number | null;
  total_amount: number | string;
  payment_method: string;
  sale_date: string | null;
  items: BackendSaleItem[];
}

const num = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'string' ? Number(value) : (value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Backend stores lowercase payment names; the UI uses its own set. */
function normalisePaymentMethod(value: string): PaymentMethod {
  const v = (value || '').toLowerCase();
  if (v.includes('card') || v.includes('credit') || v.includes('debit')) return 'card';
  // UPI and wallet settle through a mobile device.
  if (v.includes('upi') || v.includes('wallet') || v.includes('mobile')) return 'mobile';
  return 'cash';
}

export function mapBackendSale(raw: BackendSale, productNames: Map<number, string> = new Map()): Sale {
  const items: SaleItem[] = raw.items.map((item) => ({
    productId: String(item.product_id),
    name: productNames.get(item.product_id) ?? `Product ${item.product_id}`,
    sku: '',
    unitPrice: num(item.unit_price),
    quantity: item.quantity,
    discountPct: 0,
    lineTotal: num(item.subtotal),
    taxAmount: 0,
    cost: 0,
  }));

  const total = num(raw.total_amount);
  const createdAt = raw.sale_date ?? new Date().toISOString();

  return {
    id: String(raw.sale_id),
    receiptNumber: `INV-${String(raw.sale_id).padStart(6, '0')}`,
    status: 'completed' as SaleStatus,
    items,
    customerId: null,
    customerName: 'Walk-in customer',
    cashierId: raw.user_id ? String(raw.user_id) : 'system',
    cashierName: 'POS',
    subtotal: total,
    discountTotal: 0,
    taxTotal: 0,
    total,
    changeDue: 0,
    payments: [{ method: normalisePaymentMethod(raw.payment_method), amount: total }],
    note: '',
    refundedTotal: 0,
    createdAt,
  };
}

/** The backend returns every sale; filters and paging are applied here. */
export function paginateSales(
  sales: Sale[],
  filters: { search?: string; page: number; pageSize: number; status?: string },
): PaginatedResponse<Sale> {
  let rows = [...sales];

  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (sale) =>
        sale.receiptNumber.toLowerCase().includes(q) ||
        sale.customerName.toLowerCase().includes(q) ||
        sale.items.some((item) => item.name.toLowerCase().includes(q)),
    );
  }

  if (filters.status && filters.status !== 'all') {
    rows = rows.filter((sale) => sale.status === filters.status);
  }

  const total = rows.length;
  const start = (filters.page - 1) * filters.pageSize;

  return {
    items: rows.slice(start, start + filters.pageSize),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}




