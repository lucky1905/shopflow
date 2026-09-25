/* -------------------------------------------------------------------------- */
/*  Inventory — domain contracts (Phase 2)                                    */
/*  Pure types only: no runtime imports.                                      */
/* -------------------------------------------------------------------------- */

export type ProductStatus = 'active' | 'draft' | 'archived';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type MovementType = 'in' | 'out' | 'adjust' | 'opening';

/** How a stock adjustment applies: add, remove, or set an exact count. */
export type StockAdjustmentMode = 'in' | 'out' | 'set';

export type SupplierStatus = 'active' | 'inactive';

export type ProductSortField = 'name' | 'stock' | 'price' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface Category {
  id: string;
  name: string;
  description: string;
  /** Hex color used for chips / dots / charts. */
  color: string;
  createdAt: string;
  updatedAt: string;
}

/** Category joined with computed product aggregates. */
export interface CategoryWithCount extends Category {
  productCount: number;
  units: number;
  /** Total retail value of stock in this category. */
  value: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  status: SupplierStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/** Supplier joined with computed product aggregates. */
export interface SupplierWithCount extends Supplier {
  productCount: number;
  units: number;
  value: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Human-facing identifier, e.g. `GRO-482`. Unique. */
  sku: string;
  /** EAN-8 / EAN-13 style digits. Unique when present. */
  barcode: string;
  categoryId: string;
  supplierId: string | null;
  price: number;
  cost: number;
  stock: number;
  /** Alert threshold — at/below this the product is "low stock". */
  reorderPoint: number;
  /** Sale unit: pc, kg, L, box… */
  unit: string;
  status: ProductStatus;
  /** Data URL (uploads) or remote URL. `null` → gradient thumb fallback. */
  imageUrl: string | null;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  /** Signed change applied to stock (+ received, − sold, ± correction). */
  delta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  /** External reference, e.g. `PO-2091` or a sale id. */
  reference: string;
  note: string;
  /** Display name of who performed the change. */
  user: string;
  createdAt: string;
}

/** Product plus its stock history (used by the details drawer). */
export interface ProductDetail {
  product: Product;
  movements: StockMovement[];
}

/* -------------------------------------------------------------------------- */
/*  Query / mutation payloads                                                 */
/* -------------------------------------------------------------------------- */

export interface ProductFilters {
  search: string;
  categoryIds: string[];
  supplierIds: string[];
  status: ProductStatus | 'all';
  stockStatus: StockStatus | 'all';
  page: number;
  pageSize: number;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
}

/** Full product payload for creation. */
export interface ProductInput {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
  unit: string;
  status: ProductStatus;
  imageUrl: string;
  isFeatured: boolean;
}

/** Updates never touch `stock` — quantity changes go through adjustments. */
export type ProductUpdateInput = Partial<Omit<ProductInput, 'stock'>>;

export interface StockAdjustmentInput {
  productId: string;
  mode: StockAdjustmentMode;
  /** Units added/removed, or the exact new count for `set`. */
  quantity: number;
  reason: string;
  note: string;
}

export interface BulkStockAdjustmentInput {
  productIds: string[];
  mode: 'in' | 'out';
  quantity: number;
  reason: string;
  note: string;
}

export interface CategoryInput {
  name: string;
  description: string;
  color: string;
}

/** All category fields are optional on update. */
export type CategoryUpdateInput = Partial<CategoryInput>;

export interface SupplierInput {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  status: SupplierStatus;
  notes: string;
}

/** All supplier fields are optional on update. */
export type SupplierUpdateInput = Partial<SupplierInput>;

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                 */
/* -------------------------------------------------------------------------- */

export interface InventoryStats {
  /** Non-archived products. */
  totalSkus: number;
  activeSkus: number;
  draftCount: number;
  archivedCount: number;
  /** Sum of on-hand units across active products. */
  totalUnits: number;
  /** Sum of `stock × cost`. */
  inventoryValue: number;
  /** Sum of `stock × price`. */
  retailValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  /** % of active SKUs above their reorder point. */
  stockHealthPct: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  skuCount: number;
  units: number;
  value: number;
  /** Share of total retail value, 0–100. */
  sharePct: number;
}

export interface InventorySummary {
  stats: InventoryStats;
  /** Active products at/below reorder point, most critical first. */
  lowStockProducts: Product[];
  /** Latest stock events across the catalog (newest first). */
  recentMovements: StockMovement[];
  categoryBreakdown: CategoryBreakdownItem[];
}
