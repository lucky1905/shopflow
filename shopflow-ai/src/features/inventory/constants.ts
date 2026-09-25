import type { BadgeVariant } from '@/types';
import type {
  MovementType,
  ProductFilters,
  ProductSortField,
  ProductStatus,
  SortDirection,
  StockAdjustmentMode,
  StockStatus,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Product lifecycle                                                         */
/* -------------------------------------------------------------------------- */

export const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; badge: BadgeVariant }
> = {
  active: { label: 'Active', badge: 'success' },
  draft: { label: 'Draft', badge: 'info' },
  archived: { label: 'Archived', badge: 'outline' },
};

/* -------------------------------------------------------------------------- */
/*  Stock status                                                              */
/* -------------------------------------------------------------------------- */

export const STOCK_STATUS_META: Record<
  StockStatus,
  { label: string; badge: BadgeVariant; bar: string; text: string; pulse: boolean }
> = {
  in_stock: {
    label: 'In stock',
    badge: 'success',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    pulse: false,
  },
  low_stock: {
    label: 'Low stock',
    badge: 'warning',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    pulse: true,
  },
  out_of_stock: {
    label: 'Out of stock',
    badge: 'danger',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    pulse: true,
  },
};

export const STOCK_STATUS_OPTIONS: Array<{ value: StockStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All stock levels' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Low stock' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

export const PRODUCT_STATUS_OPTIONS: Array<{ value: ProductStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

/* -------------------------------------------------------------------------- */
/*  Stock movements                                                           */
/* -------------------------------------------------------------------------- */

export const MOVEMENT_META: Record<
  MovementType,
  { label: string; chip: string; iconBg: string; iconText: string; sign: string }
> = {
  in: {
    label: 'Stock in',
    chip: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    sign: '+',
  },
  out: {
    label: 'Stock out',
    chip: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10',
    iconText: 'text-rose-600 dark:text-rose-400',
    sign: '−',
  },
  adjust: {
    label: 'Correction',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    sign: '',
  },
  opening: {
    label: 'Opening stock',
    chip: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/10',
    iconText: 'text-sky-600 dark:text-sky-400',
    sign: '+',
  },
};

export const MOVEMENT_REASONS: Record<StockAdjustmentMode, string[]> = {
  in: ['Purchase received', 'Customer return', 'Transfer in', 'Stock count correction', 'Other'],
  out: ['Sale', 'Damaged / expired', 'Transfer out', 'Stock count correction', 'Other'],
  set: ['Stock count', 'Audit correction', 'Other'],
};

/* -------------------------------------------------------------------------- */
/*  Options & presets                                                         */
/* -------------------------------------------------------------------------- */

export const UNIT_OPTIONS = ['pc', 'kg', 'g', 'L', 'ml', 'box', 'pack', 'set'] as const;

/** Palette for category colors (picks cycle through these). */
export const CATEGORY_COLOR_PALETTE = [
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#6366f1',
  '#ef4444',
  '#84cc16',
  '#f97316',
  '#14b8a6',
] as const;

export type ProductSortValue = `${ProductSortField}:${SortDirection}`;

export const PRODUCT_SORT_OPTIONS: Array<{ value: ProductSortValue; label: string }> = [
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'name:asc', label: 'Name A → Z' },
  { value: 'name:desc', label: 'Name Z → A' },
  { value: 'stock:asc', label: 'Stock low → high' },
  { value: 'stock:desc', label: 'Stock high → low' },
  { value: 'price:desc', label: 'Price high → low' },
  { value: 'price:asc', label: 'Price low → high' },
];

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  search: '',
  categoryIds: [],
  supplierIds: [],
  status: 'all',
  stockStatus: 'all',
  page: 1,
  pageSize: 10,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

/* -------------------------------------------------------------------------- */
/*  Image upload                                                              */
/* -------------------------------------------------------------------------- */

export const IMAGE_UPLOAD_MAX_MB = 5;
export const IMAGE_UPLOAD_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml';

/* -------------------------------------------------------------------------- */
/*  UI limits                                                                 */
/* -------------------------------------------------------------------------- */

export const LOW_STOCK_ALERTS_LIMIT = 6;
export const TIMELINE_PREVIEW_LIMIT = 6;
export const DETAIL_MOVEMENTS_LIMIT = 12;
