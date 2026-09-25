/**
 * Mapping between the FastAPI `Product` schema and the frontend `Product`
 * model.
 *
 * The backend is intentionally small:
 *   { product_id, barcode, product_name, category, buying_price,
 *     selling_price, stock, min_stock, created_at }
 *
 * Frontend-only concepts (SKU, supplier, images, lifecycle status) have no
 * backend column yet, so they are derived deterministically rather than
 * dropped, which keeps the existing screens working unchanged.
 */
import type { Product, ProductStatus } from '../types';

/** Raw row shape returned by `GET /products` and `POST/PUT /products`. */
export interface BackendProduct {
  product_id: number;
  barcode: string;
  product_name: string;
  category: string;
  buying_price: number | string;
  selling_price: number | string;
  stock: number;
  min_stock: number;
  created_at?: string | null;
}

/** Body accepted by `POST /products` and `PUT /products/{id}`. */
export interface BackendProductInput {
  barcode: string;
  product_name: string;
  category: string;
  buying_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
}

/** Coerces the backend's Numeric columns (sent as strings) to numbers. */
export const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'string' ? Number(value) : (value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Deterministic pseudo-category id so grouping stays stable across loads. */
export const categoryIdFor = (category: string): string =>
  `cat-${category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'uncategorised'}`;

/** SKU is derived from the product id because the backend has no SKU column. */
const skuFor = (productId: number): string => `SKU-${String(productId).padStart(5, '0')}`;

/**
 * The backend has no lifecycle column, so every row maps to 'active'. Stock
 * level is surfaced separately through the `reorderPoint` comparison.
 */
function statusFor(): ProductStatus {
  return 'active';
}

export function mapBackendProduct(raw: BackendProduct): Product {
  const createdAt = raw.created_at ?? new Date().toISOString();
  const reorderPoint = toNumber(raw.min_stock);

  return {
    id: String(raw.product_id),
    name: raw.product_name,
    description: `${raw.category} - ${raw.product_name}`,
    sku: skuFor(raw.product_id),
    barcode: raw.barcode ?? '',
    categoryId: categoryIdFor(raw.category),
    supplierId: null,
    price: toNumber(raw.selling_price),
    cost: toNumber(raw.buying_price),
    stock: toNumber(raw.stock),
    reorderPoint,
    unit: 'pc',
    status: statusFor(),
    imageUrl: null,
    isFeatured: false,
    createdAt,
    updatedAt: createdAt,
  };
}

/** Maps the frontend product form onto the backend's flat create schema. */
export function toBackendProductInput(input: {
  name: string;
  barcode: string;
  categoryName: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
}): BackendProductInput {
  return {
    barcode: input.barcode,
    product_name: input.name,
    category: input.categoryName,
    buying_price: input.cost,
    selling_price: input.price,
    stock: Math.max(0, Math.trunc(input.stock)),
    min_stock: Math.max(0, Math.trunc(input.reorderPoint)),
  };
}

/** Distinct category rows derived from a product list (no backend endpoint). */
export function deriveCategories(
  products: Product[],
): Array<{ id: string; name: string; productCount: number }> {
  const map = new Map<string, { id: string; name: string; productCount: number }>();

  for (const product of products) {
    const existing = map.get(product.categoryId);
    if (existing) {
      existing.productCount += 1;
    } else {
      const name = product.description.split(' - ')[0] || 'Uncategorised';
      map.set(product.categoryId, { id: product.categoryId, name, productCount: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}




