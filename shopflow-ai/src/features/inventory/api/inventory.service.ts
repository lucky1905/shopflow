import { API_ENDPOINTS, PAGE_SIZE_OPTIONS } from '@/constants';
import { createId, sleep } from '@/lib/utils';
import {
  httpDelete,
  httpGet,
  httpPost,
  httpPut,
  normalizeApiError,
} from '@/services/api';
import { mockDb, MOCK_LATENCY_MS } from './inventory.mock';
import {
  deriveCategories,
  mapBackendProduct,
  toBackendProductInput,
  toNumber,
  type BackendProduct,
} from './productMapper';
import type { ApiError, PaginatedResponse } from '@/types';
import type {
  BulkStockAdjustmentInput,
  Category,
  CategoryInput,
  CategoryUpdateInput,
  CategoryWithCount,
  InventorySummary,
  Product,
  ProductDetail,
  ProductFilters,
  ProductInput,
  ProductUpdateInput,
  StockAdjustmentInput,
  StockMovement,
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SupplierWithCount,
} from '../types';
import { ANALYTICS_PALETTE } from '@/features/analytics/constants';
import { categoryPrefix, generateBarcode, getStockStatus } from '../utils';

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Normalizes unknown throwables into the app-wide ApiError shape. */
function rethrow(error: unknown): never {
  throw normalizeApiError(error);
}

/**
 * Builds the error thrown when a screen hits a backend endpoint that does not
 * exist yet. `501` keeps it distinguishable from a real server fault.
 */
/** Rounds to a fixed number of decimals without floating-point drift. */
function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function notImplemented(resource: string): ApiError {
  return {
    status: 501,
    message: `The ${resource} endpoint is not implemented on the backend yet.`,
  };

}
/* -------------------------------------------------------------------------- */
/*  Uniqueness guards (mock mirrors what the backend will enforce)            */
/* -------------------------------------------------------------------------- */

export class UniqueConstraintError extends Error {
  readonly field: 'sku' | 'barcode' | 'name';

  constructor(field: 'sku' | 'barcode' | 'name', message: string) {
    super(message);
    this.name = 'UniqueConstraintError';
    this.field = field;
  }
}

function assertUniqueSku(sku: string, excludeId?: string): void {
  const clash = mockDb.products.some(
    (product) =>
      product.sku.toLowerCase() === sku.trim().toLowerCase() && product.id !== excludeId,
  );
  if (clash) throw new UniqueConstraintError('sku', `SKU "${sku}" is already in use.`);
}

function assertUniqueBarcode(barcode: string, excludeId?: string): void {
  if (!barcode) return;
  const clash = mockDb.products.some(
    (product) => product.barcode === barcode.trim() && product.id !== excludeId,
  );
  if (clash) throw new UniqueConstraintError('barcode', `Barcode "${barcode}" is already in use.`);
}

function assertUniqueCategoryName(name: string, excludeId?: string): void {
  const clash = mockDb.categories.some(
    (category) =>
      category.name.toLowerCase() === name.trim().toLowerCase() && category.id !== excludeId,
  );
  if (clash) throw new UniqueConstraintError('name', `Category "${name}" already exists.`);
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                          */
/* -------------------------------------------------------------------------- */

function recordMovement(input: {
  productId: string;
  type: StockMovement['type'];
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference: string;
  note: string;
  user: string;
}): StockMovement {
  const movement: StockMovement = {
    id: `mov_${createId()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };
  mockDb.movements.push(movement);
  return movement;
}

function nextSku(categoryName: string): string {
  const prefix = categoryPrefix(categoryName);
  const used = mockDb.products
    .map((product) => Number(product.sku.replace(`${prefix}-`, '')))
    .filter((value) => Number.isFinite(value));
  const next = (used.length > 0 ? Math.max(...used, 100) : 100) + 1;
  return `${prefix}-${next}`;
}

function buildSummary(): InventorySummary {
  const active = mockDb.products.filter((product) => product.status === 'active');

  let totalUnits = 0;
  let inventoryValue = 0;
  let retailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const product of active) {
    totalUnits += product.stock;
    inventoryValue += product.stock * product.cost;
    retailValue += product.stock * product.price;
    const stockStatus = getStockStatus(product.stock, product.reorderPoint);
    if (stockStatus === 'low_stock') lowStockCount += 1;
    if (stockStatus === 'out_of_stock') outOfStockCount += 1;
  }

  const activeSkus = active.length;
  const draftCount = mockDb.products.filter((product) => product.status === 'draft').length;
  const archivedCount = mockDb.products.filter((product) => product.status === 'archived').length;
  const aboveReorder = active.filter(
    (product) => getStockStatus(product.stock, product.reorderPoint) === 'in_stock',
  ).length;

  const stats = {
    totalSkus: activeSkus + draftCount,
    activeSkus,
    draftCount,
    archivedCount,
    totalUnits,
    inventoryValue,
    retailValue,
    lowStockCount,
    outOfStockCount,
    stockHealthPct: activeSkus > 0 ? Math.round((aboveReorder / activeSkus) * 100) : 100,
  };

  const lowStockProducts = active
    .filter((product) => getStockStatus(product.stock, product.reorderPoint) !== 'in_stock')
    .sort((a, b) => a.stock - b.stock);

  const recentMovements = [...mockDb.movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  const categoryBreakdown = mockDb.categories
    .map((category) => {
      const items = active.filter((product) => product.categoryId === category.id);
      const value = items.reduce((sum, product) => sum + product.stock * product.price, 0);
      return {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        skuCount: items.length,
        units: items.reduce((sum, product) => sum + product.stock, 0),
        value,
        sharePct: 0,
      };
    })
    .filter((item) => item.skuCount > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => ({
      ...item,
      sharePct: retailValue > 0 ? Math.round((item.value / retailValue) * 100) : 0,
    }));

  return { stats, lowStockProducts, recentMovements, categoryBreakdown };
}

/* -------------------------------------------------------------------------- */
/*  Products â€” mock implementation                                            */
/* -------------------------------------------------------------------------- */

function applyProductFilters(filters: ProductFilters): Product[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = mockDb.products.filter((product) => {
    if (filters.status !== 'all' && product.status !== filters.status) return false;

    const stockStatus = getStockStatus(product.stock, product.reorderPoint);
    if (filters.stockStatus !== 'all' && stockStatus !== filters.stockStatus) return false;

    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(product.categoryId)) {
      return false;
    }

    if (
      filters.supplierIds.length > 0 &&
      (product.supplierId === null || !filters.supplierIds.includes(product.supplierId))
    ) {
      return false;
    }

    if (search) {
      const haystack = [product.name, product.sku, product.barcode].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  const direction = filters.sortDirection === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return direction * a.name.localeCompare(b.name);
      case 'stock':
        return direction * (a.stock - b.stock);
      case 'price':
        return direction * (a.price - b.price);
      case 'createdAt':
        return direction * a.createdAt.localeCompare(b.createdAt);
      case 'updatedAt':
      default:
        return direction * a.updatedAt.localeCompare(b.updatedAt);
    }
  });
}

function paginate(
  products: Product[],
  page: number,
  pageSize: number,
): PaginatedResponse<Product> {
  const safePageSize = PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? pageSize
    : 10;
  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: products.slice(start, start + safePageSize),
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

const mockProductsApi = {
  async list(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
    await sleep(MOCK_LATENCY_MS);
    return paginate(applyProductFilters(filters), filters.page, filters.pageSize);
  },

  async get(id: string): Promise<ProductDetail> {
    await sleep(MOCK_LATENCY_MS);
    const product = mockDb.products.find((item) => item.id === id);
    if (!product) throw { message: 'Product not found.', status: 404 } as const;

    const movements = mockDb.movements
      .filter((movement) => movement.productId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12);

    return { product: { ...product }, movements };
  },

  async create(input: ProductInput): Promise<Product> {
    await sleep(MOCK_LATENCY_MS);
    assertUniqueSku(input.sku);
    assertUniqueBarcode(input.barcode);

    const now = new Date().toISOString();
    const stock = Math.max(0, Math.round(input.stock));
    const product: Product = {
      id: `prd_${createId()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      sku: input.sku.trim().toUpperCase(),
      barcode: input.barcode.trim(),
      categoryId: input.categoryId,
      supplierId: input.supplierId === '' ? null : input.supplierId,
      price: input.price,
      cost: input.cost,
      stock,
      reorderPoint: input.reorderPoint,
      unit: input.unit,
      status: input.status,
      imageUrl: input.imageUrl === '' ? null : input.imageUrl,
      isFeatured: input.isFeatured,
      createdAt: now,
      updatedAt: now,
    };

    mockDb.products.push(product);
    if (stock > 0) {
      recordMovement({
        productId: product.id,
        type: 'opening',
        delta: stock,
        previousStock: 0,
        newStock: stock,
        reason: 'Opening stock',
        reference: 'MANUAL-CREATE',
        note: 'Recorded at product creation',
        user: 'Alex Morgan',
      });
    }
    return { ...product };
  },

  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    await sleep(MOCK_LATENCY_MS);
    const product = mockDb.products.find((item) => item.id === id);
    if (!product) throw { message: 'Product not found.', status: 404 } as const;

    if (input.sku !== undefined) assertUniqueSku(input.sku, id);
    if (input.barcode !== undefined) assertUniqueBarcode(input.barcode, id);

    if (input.name !== undefined) product.name = input.name.trim();
    if (input.description !== undefined) product.description = input.description.trim();
    if (input.sku !== undefined) product.sku = input.sku.trim().toUpperCase();
    if (input.barcode !== undefined) product.barcode = input.barcode.trim();
    if (input.categoryId !== undefined) product.categoryId = input.categoryId;
    if (input.supplierId !== undefined) {
      product.supplierId = input.supplierId === '' ? null : input.supplierId;
    }
    if (input.price !== undefined) product.price = input.price;
    if (input.cost !== undefined) product.cost = input.cost;
    if (input.reorderPoint !== undefined) product.reorderPoint = input.reorderPoint;
    if (input.unit !== undefined) product.unit = input.unit;
    if (input.status !== undefined) product.status = input.status;
    if (input.imageUrl !== undefined) {
      product.imageUrl = input.imageUrl === '' ? null : input.imageUrl;
    }
    if (input.isFeatured !== undefined) product.isFeatured = input.isFeatured;
    product.updatedAt = new Date().toISOString();

    return { ...product };
  },

  async remove(id: string): Promise<void> {
    await sleep(MOCK_LATENCY_MS);
    const index = mockDb.products.findIndex((item) => item.id === id);
    if (index === -1) throw { message: 'Product not found.', status: 404 } as const;
    mockDb.products.splice(index, 1);
    mockDb.movements = mockDb.movements.filter((movement) => movement.productId !== id);
  },

  async adjustStock(input: StockAdjustmentInput): Promise<Product> {
    await sleep(MOCK_LATENCY_MS);
    const product = mockDb.products.find((item) => item.id === input.productId);
    if (!product) throw { message: 'Product not found.', status: 404 } as const;

    const quantity = Math.round(input.quantity);
    if (quantity < 0) throw { message: 'Quantity cannot be negative.', status: 422 } as const;

    const previousStock = product.stock;
    let newStock: number;
    let type: StockMovement['type'];

    if (input.mode === 'set') {
      newStock = quantity;
      type = 'adjust';
    } else if (input.mode === 'in') {
      newStock = previousStock + quantity;
      type = 'in';
    } else {
      newStock = Math.max(0, previousStock - quantity);
      type = 'out';
    }

    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    recordMovement({
      productId: product.id,
      type,
      delta: newStock - previousStock,
      previousStock,
      newStock,
      reason: input.reason,
      reference: '',
      note: input.note,
      user: 'Alex Morgan',
    });

    return { ...product };
  },

  async bulkAdjustStock(input: BulkStockAdjustmentInput): Promise<number> {
    await sleep(MOCK_LATENCY_MS);
    let updated = 0;

    for (const productId of input.productIds) {
      const product = mockDb.products.find((item) => item.id === productId);
      if (!product) continue;

      const previousStock = product.stock;
      const newStock =
        input.mode === 'in'
          ? previousStock + input.quantity
          : Math.max(0, previousStock - input.quantity);

      product.stock = newStock;
      product.updatedAt = new Date().toISOString();
      updated += 1;

      recordMovement({
        productId,
        type: input.mode,
        delta: newStock - previousStock,
        previousStock,
        newStock,
        reason: input.reason,
        reference: 'BULK',
        note: input.note,
        user: 'Alex Morgan',
      });
    }

    return updated;
  },

  async bulkUpdateStatus(productIds: string[], status: Product['status']): Promise<number> {
    await sleep(MOCK_LATENCY_MS);
    let updated = 0;

    for (const productId of productIds) {
      const product = mockDb.products.find((item) => item.id === productId);
      if (!product || product.status === status) continue;
      product.status = status;
      product.updatedAt = new Date().toISOString();
      updated += 1;
    }

    return updated;
  },

  async bulkDelete(productIds: string[]): Promise<number> {
    await sleep(MOCK_LATENCY_MS);
    const idSet = new Set(productIds);
    const before = mockDb.products.length;

    mockDb.products = mockDb.products.filter((product) => !idSet.has(product.id));
    mockDb.movements = mockDb.movements.filter((movement) => !idSet.has(movement.productId));

    return before - mockDb.products.length;
  },

  async suggestSku(categoryName: string): Promise<string> {
    await sleep(MOCK_LATENCY_MS / 2);
    return nextSku(categoryName);
  },

  async suggestBarcode(): Promise<string> {
    await sleep(MOCK_LATENCY_MS / 2);
    let barcode = generateBarcode();
    while (mockDb.products.some((product) => product.barcode === barcode)) {
      barcode = generateBarcode();
    }
    return barcode;
  },

  async findByCode(code: string): Promise<Product | null> {
    await sleep(MOCK_LATENCY_MS / 2);
    const needle = code.trim().toLowerCase();
    return (
      mockDb.products.find(
        (product) => product.barcode === needle || product.sku.toLowerCase() === needle,
      ) ?? null
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Joined lookups (category / supplier rows with aggregates)                 */
/* -------------------------------------------------------------------------- */

function buildCategoryRows(): CategoryWithCount[] {
  return mockDb.categories.map((category) => {
    const items = mockDb.products.filter((product) => product.categoryId === category.id);
    return {
      ...category,
      productCount: items.length,
      units: items.reduce((sum, product) => sum + product.stock, 0),
      value: items.reduce((sum, product) => sum + product.stock * product.price, 0),
    };
  });
}

function buildSupplierRows(): SupplierWithCount[] {
  return mockDb.suppliers.map((supplier) => {
    const items = mockDb.products.filter((product) => product.supplierId === supplier.id);
    return {
      ...supplier,
      productCount: items.length,
      units: items.reduce((sum, product) => sum + product.stock, 0),
      value: items.reduce((sum, product) => sum + product.stock * product.price, 0),
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Categories â€” mock implementation                                          */
/* -------------------------------------------------------------------------- */

const mockCategoriesApi = {
  async list(): Promise<CategoryWithCount[]> {
    await sleep(MOCK_LATENCY_MS);
    return buildCategoryRows();
  },

  async create(input: CategoryInput): Promise<Category> {
    await sleep(MOCK_LATENCY_MS);
    assertUniqueCategoryName(input.name);

    const now = new Date().toISOString();
    const category: Category = {
      id: `cat_${createId()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      color: input.color,
      createdAt: now,
      updatedAt: now,
    };
    mockDb.categories.push(category);
    return { ...category };
  },

  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    await sleep(MOCK_LATENCY_MS);
    const category = mockDb.categories.find((item) => item.id === id);
    if (!category) throw { message: 'Category not found.', status: 404 } as const;

    if (input.name !== undefined) {
      assertUniqueCategoryName(input.name, id);
      category.name = input.name.trim();
    }
    if (input.description !== undefined) category.description = input.description.trim();
    if (input.color !== undefined) category.color = input.color;
    category.updatedAt = new Date().toISOString();

    return { ...category };
  },

  async remove(id: string): Promise<void> {
    await sleep(MOCK_LATENCY_MS);
    const index = mockDb.categories.findIndex((item) => item.id === id);
    if (index === -1) throw { message: 'Category not found.', status: 404 } as const;
    if (mockDb.products.some((product) => product.categoryId === id)) {
      throw {
        message: 'This category still has products. Move them first.',
        status: 409,
      } as const;
    }
    mockDb.categories.splice(index, 1);
  },
};

/* -------------------------------------------------------------------------- */
/*  Suppliers â€” mock implementation                                           */
/* -------------------------------------------------------------------------- */

const mockSuppliersApi = {
  async list(): Promise<SupplierWithCount[]> {
    await sleep(MOCK_LATENCY_MS);
    return buildSupplierRows();
  },

  async create(input: SupplierInput): Promise<Supplier> {
    await sleep(MOCK_LATENCY_MS);
    const now = new Date().toISOString();
    const supplier: Supplier = {
      id: `sup_${createId()}`,
      name: input.name.trim(),
      contactName: input.contactName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      address: input.address.trim(),
      leadTimeDays: input.leadTimeDays,
      status: input.status,
      notes: input.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    mockDb.suppliers.push(supplier);
    return { ...supplier };
  },

  async update(id: string, input: SupplierUpdateInput): Promise<Supplier> {
    await sleep(MOCK_LATENCY_MS);
    const supplier = mockDb.suppliers.find((item) => item.id === id);
    if (!supplier) throw { message: 'Supplier not found.', status: 404 } as const;

    if (input.name !== undefined) supplier.name = input.name.trim();
    if (input.contactName !== undefined) supplier.contactName = input.contactName.trim();
    if (input.email !== undefined) supplier.email = input.email.trim();
    if (input.phone !== undefined) supplier.phone = input.phone.trim();
    if (input.address !== undefined) supplier.address = input.address.trim();
    if (input.leadTimeDays !== undefined) supplier.leadTimeDays = input.leadTimeDays;
    if (input.status !== undefined) supplier.status = input.status;
    if (input.notes !== undefined) supplier.notes = input.notes.trim();
    supplier.updatedAt = new Date().toISOString();

    return { ...supplier };
  },

  async remove(id: string): Promise<void> {
    await sleep(MOCK_LATENCY_MS);
    const index = mockDb.suppliers.findIndex((item) => item.id === id);
    if (index === -1) throw { message: 'Supplier not found.', status: 404 } as const;

    // Detach products instead of blocking the delete.
    for (const product of mockDb.products) {
      if (product.supplierId === id) {
        product.supplierId = null;
        product.updatedAt = new Date().toISOString();
      }
    }
    mockDb.suppliers.splice(index, 1);
  },
};

/* -------------------------------------------------------------------------- */
/*  Analytics â€” mock implementation                                           */
/* -------------------------------------------------------------------------- */

const mockAnalyticsApi = {
  async summary(): Promise<InventorySummary> {
    await sleep(MOCK_LATENCY_MS);
    return buildSummary();
  },
};

/* -------------------------------------------------------------------------- */
/*  Real API implementations (typed, ready for the backend)                   */
/*  Flip with VITE_USE_MOCK_API=false â€” mirrors the auth service pattern.     */
/* -------------------------------------------------------------------------- */

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

/**
 * Real API implementation backed by the FastAPI `/products` endpoints.
 *
 * The backend has no pagination, search or sorting — it returns the full
 * product list — so those are applied client-side here to keep the existing
 * table behaviour (filters + pagination) identical.
 */
const realProductsApi = {
  async list(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
    try {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      let products = rows.map(mapBackendProduct);

      if (filters.search) {
        const q = filters.search.trim().toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q),
        );
      }

      if (filters.categoryIds.length > 0) {
        products = products.filter((p) => filters.categoryIds.includes(p.categoryId));
      }

      if (filters.status && filters.status !== 'all') {
        products = products.filter((p) => p.status === filters.status);
      }

      if (filters.stockStatus && filters.stockStatus !== 'all') {
        products = products.filter((p) => {
          if (filters.stockStatus === 'in_stock') return p.stock > 0;
          if (filters.stockStatus === 'low_stock') return p.stock <= p.reorderPoint && p.stock > 0;
          if (filters.stockStatus === 'out_of_stock') return p.stock <= 0;
          return true;
        });
      }

      const sorted = [...products];
      const dir = filters.sortDirection === 'asc' ? 1 : -1;
      sorted.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return (a.price - b.price) * dir;
          case 'stock':
            return (a.stock - b.stock) * dir;
          case 'name':
            return a.name.localeCompare(b.name) * dir;
          case 'createdAt':
          default:
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        }
      });

      const total = sorted.length;
      const start = (filters.page - 1) * filters.pageSize;
      return {
        items: sorted.slice(start, start + filters.pageSize),
        total,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
      };
    } catch (error) {
      rethrow(error);
    }
  },

  async get(id: string): Promise<ProductDetail> {
    try {
      const raw = await httpGet<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_ID(id));
      return { product: mapBackendProduct(raw), movements: [] };
    } catch (error) {
      rethrow(error);
    }
  },

  /** Exact barcode match, used by the POS scanner. */
  async getByBarcode(barcode: string): Promise<Product> {
    try {
      return mapBackendProduct(
        await httpGet<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_BARCODE(barcode)),
      );
    } catch (error) {
      rethrow(error);
    }
  },

  async create(input: ProductInput): Promise<Product> {
    try {
      const body = toBackendProductInput({
        name: input.name,
        barcode: input.barcode,
        categoryName: input.description || 'Uncategorised',
        price: input.price,
        cost: input.cost,
        stock: input.stock,
        reorderPoint: input.reorderPoint,
      });
      return mapBackendProduct(await httpPost<BackendProduct>(API_ENDPOINTS.PRODUCTS, body));
    } catch (error) {
      rethrow(error);
    }
  },

  /**
   * `ProductUpdateInput` omits `stock` (stock moves only through adjustments),
   * but the backend's PUT replaces the whole row, so the current stock is read
   * first and sent back unchanged.
   */
  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    try {
      const current = await httpGet<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_ID(id));

      const body = toBackendProductInput({
        name: input.name ?? current.product_name,
        barcode: input.barcode ?? current.barcode,
        categoryName: input.description || current.category || 'Uncategorised',
        price: input.price ?? toNumber(current.selling_price),
        cost: input.cost ?? toNumber(current.buying_price),
        stock: toNumber(current.stock),
        reorderPoint: input.reorderPoint ?? toNumber(current.min_stock),
      });

      return mapBackendProduct(
        await httpPut<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_ID(id), body),
      );
    } catch (error) {
      rethrow(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await httpDelete(API_ENDPOINTS.PRODUCT_BY_ID(id));
    } catch (error) {
      rethrow(error);
    }
  },

  /**
   * The backend exposes no adjustment route, so stock is written through a
   * read-modify-write against the product row. `mode` decides whether
   * `quantity` is added, removed, or treated as the new absolute count.
   */
  async adjustStock(input: StockAdjustmentInput): Promise<Product> {
    try {
      const current = await httpGet<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_ID(input.productId));
      const onHand = toNumber(current.stock);

      const nextStock =
        input.mode === 'set'
          ? Math.max(0, input.quantity)
          : Math.max(0, input.mode === 'in' ? onHand + input.quantity : onHand - input.quantity);

      return mapBackendProduct(
        await httpPut<BackendProduct>(API_ENDPOINTS.PRODUCT_BY_ID(input.productId), {
          barcode: current.barcode,
          product_name: current.product_name,
          category: current.category,
          buying_price: toNumber(current.buying_price),
          selling_price: toNumber(current.selling_price),
          stock: nextStock,
          min_stock: toNumber(current.min_stock),
        }),
      );
    } catch (error) {
      rethrow(error);
    }
  },

  async bulkAdjustStock(input: BulkStockAdjustmentInput): Promise<number> {
    const results = await Promise.allSettled(
      input.productIds.map((productId) =>
        realProductsApi.adjustStock({
          productId,
          quantity: input.quantity,
          mode: input.mode,
          reason: input.reason,
          note: input.note,
        }),
      ),
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  },

  async bulkUpdateStatus(productIds: string[], status: Product['status']): Promise<number> {
    // The backend has no lifecycle-status column, so there is nothing to change.
    void productIds;
    void status;
    return 0;
  },


  /** Scans a barcode or SKU and returns the matching product. */
  async findByCode(code: string): Promise<Product | null> {
    try {
      return await realProductsApi.getByBarcode(code);
    } catch {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      const match = rows.find(
        (row) => row.barcode === code.trim() || String(row.product_id) === code.trim(),
      );
      return match ? mapBackendProduct(match) : null;
    }
  },

  /** SKU suggestions are derived from the next free product id. */
  async suggestSku(categoryName: string): Promise<string> {
    void categoryName;
    const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
    const nextId = rows.reduce((max, row) => Math.max(max, row.product_id), 0) + 1;
    return `SKU-${String(nextId).padStart(5, '0')}`;
  },

  /** EAN-13 suggestions are derived from the same running id. */
  async suggestBarcode(categoryName = ''): Promise<string> {
    void categoryName;
    const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
    const nextId = rows.reduce((max, row) => Math.max(max, row.product_id), 0) + 1;
    return `890${String(nextId).padStart(9, '0')}`;
  },

  async bulkDelete(productIds: string[]): Promise<number> {
    const results = await Promise.allSettled(
      productIds.map((id) => realProductsApi.remove(id)),
    );
    return results.filter((r) => r.status === 'fulfilled').length;
  },
};

/**
 * Categories have no backend endpoint. They are derived from the product
 * list so the categories screens keep working against the real API.
 */
const realCategoriesApi = {
  async list(): Promise<CategoryWithCount[]> {
    try {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      return deriveCategories(rows.map(mapBackendProduct)).map((category) => ({
        ...category,
        description: `${category.productCount} product${category.productCount === 1 ? '' : 's'}`,
        color: 'hsl(var(--primary))',
        createdAt: new Date().toISOString(),
      })) as unknown as CategoryWithCount[];
    } catch (error) {
      rethrow(error);
    }
  },

  async create(input: CategoryInput): Promise<Category> {
    void input;
    // The backend stores the category as a string on each product, so a
    // category only exists once a product uses it.
    throw notImplemented('category management');
  },

  async update(id: string, input: CategoryUpdateInput): Promise<Category> {
    void id;
    void input;
    throw notImplemented('category management');
  },

  async remove(id: string): Promise<void> {
    void id;
    throw notImplemented('category management');
  },
};


/**
 * Suppliers have no backend endpoint yet. Reads fall back to the mock
 * dataset so the screens stay usable; writes surface a clear 501.
 */
const realSuppliersApi = {
  async list(): Promise<SupplierWithCount[]> {
    return mockSuppliersApi.list();
  },

  async get(id: string): Promise<Supplier> {
    const all = await mockSuppliersApi.list();
    const match = all.find((supplier) => supplier.id === id);
    if (!match) throw notImplemented('suppliers');
    return match;
  },

  async create(input: SupplierInput): Promise<Supplier> {
    void input;
    throw notImplemented('suppliers');
  },

  async update(id: string, input: SupplierUpdateInput): Promise<Supplier> {
    void id;
    void input;
    throw notImplemented('suppliers');
  },

  async remove(id: string): Promise<void> {
    void id;
    throw notImplemented('suppliers');
  },
};

/**
 * Inventory summary is computed from the real product list — the backend has
 * no dedicated summary endpoint.
 */
/**
 * Inventory summary computed from the real product list.
 *
 * The backend has no summary endpoint, so the aggregates the dashboard needs
 * are derived client-side. The backend also has no stock-movement table, so
 * `recentMovements` is empty and the timeline renders its own empty state.
 */
const realAnalyticsApi = {
  async summary(): Promise<InventorySummary> {
    try {
      const rows = await httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS);
      const products = rows.map(mapBackendProduct);

      const inventoryValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
      const retailValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
      const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
      const lowStockProducts = products
        .filter((p) => p.stock <= p.reorderPoint)
        .sort((a, b) => a.stock / (a.reorderPoint || 1) - b.stock / (b.reorderPoint || 1));
      const healthyCount = products.filter((p) => p.stock > p.reorderPoint).length;

      // Category rollup for the analytics donut.
      const byCategory = new Map<string, { name: string; units: number; value: number; skuCount: number }>();
      for (const product of products) {
        const key = product.categoryId;
        const existing = byCategory.get(key);
        if (existing) {
          existing.units += product.stock;
          existing.value += product.price * product.stock;
          existing.skuCount += 1;
        } else {
          byCategory.set(key, {
            name: product.description.split(' - ')[0] || 'Uncategorised',
            units: product.stock,
            value: product.price * product.stock,
            skuCount: 1,
          });
        }
      }

      const categoryBreakdown = Array.from(byCategory.entries())
        .map(([categoryId, entry], index) => ({
          categoryId,
          name: entry.name,
          color: ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length],
          skuCount: entry.skuCount,
          units: entry.units,
          value: entry.value,
          sharePct: retailValue > 0 ? roundTo((entry.value / retailValue) * 100, 1) : 0,
        }))
        .sort((a, b) => b.value - a.value);

      return {
        stats: {
          totalSkus: products.length,
          activeSkus: products.length,
          draftCount: 0,
          archivedCount: 0,
          totalUnits,
          inventoryValue,
          retailValue,
          lowStockCount: lowStockProducts.filter((p) => p.stock > 0).length,
          outOfStockCount: products.filter((p) => p.stock <= 0).length,
          stockHealthPct: products.length > 0 ? roundTo((healthyCount / products.length) * 100, 1) : 0,
        },
        lowStockProducts,
        recentMovements: [],
        categoryBreakdown,
      };
    } catch (error) {
      rethrow(error);
    }
  },
};
/* -------------------------------------------------------------------------- */
/*  Public service surface â€” the only import UI code should use.              */
/* -------------------------------------------------------------------------- */

export const inventoryService = {
  products: USE_MOCK_API ? mockProductsApi : realProductsApi,
  categories: USE_MOCK_API ? mockCategoriesApi : realCategoriesApi,
  suppliers: USE_MOCK_API ? mockSuppliersApi : realSuppliersApi,
  analytics: USE_MOCK_API ? mockAnalyticsApi : realAnalyticsApi,
} as const;

export type InventoryService = typeof inventoryService;
















