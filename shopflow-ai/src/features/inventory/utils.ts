import type { Product } from './types';
import { STOCK_STATUS_META } from './constants';
import type { StockStatus } from './types';

/* -------------------------------------------------------------------------- */
/*  Codes — SKU & barcode                                                     */
/* -------------------------------------------------------------------------- */

/** "Whole Milk" → "WHO", "Paper Towels" → "PAT" (first letters, max 3). */
export function categoryPrefix(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GEN';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Suggests a fresh SKU like `GRO-482`. Callers should still check uniqueness. */
export function generateSku(categoryName: string): string {
  return `${categoryPrefix(categoryName)}-${randomInt(100, 999)}`;
}

/** EAN-13 check digit (mod-10, weights 1/3). */
export function ean13Checksum(digits12: string): number {
  const sum = digits12
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

/** Generates a valid 13-digit EAN-style barcode (never all zeros). */
export function generateBarcode(): string {
  const first = String(randomInt(2, 9));
  const rest = Array.from({ length: 11 }, () => randomInt(0, 9)).join('');
  const body = `${first}${rest}`;
  return `${body}${ean13Checksum(body)}`;
}

export function isValidBarcodeFormat(value: string): boolean {
  return /^(\d{8}|\d{12,13})$/.test(value);
}

/* -------------------------------------------------------------------------- */
/*  Stock helpers                                                             */
/* -------------------------------------------------------------------------- */

export function getStockStatus(stock: number, reorderPoint: number): StockStatus {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= reorderPoint) return 'low_stock';
  return 'in_stock';
}

export function getStockStatusLabel(stock: number, reorderPoint: number): string {
  return STOCK_STATUS_META[getStockStatus(stock, reorderPoint)].label;
}

/** Gross margin % of retail price (0 when price is 0). */
export function computeMarginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function computeStockValue(product: Pick<Product, 'stock' | 'cost' | 'price'>): {
  costValue: number;
  retailValue: number;
} {
  return {
    costValue: product.stock * product.cost,
    retailValue: product.stock * product.price,
  };
}

/** "78 → 83 (+5)" preview text for adjustment forms. */
export function describeAdjustment(
  mode: 'in' | 'out' | 'set',
  quantity: number,
  currentStock: number,
): string {
  if (mode === 'set') return `${currentStock} → ${quantity}`;
  const next = mode === 'in' ? currentStock + quantity : currentStock - quantity;
  const delta = mode === 'in' ? `+${quantity}` : `−${quantity}`;
  return `${currentStock} → ${next} (${delta})`;
}

/* -------------------------------------------------------------------------- */
/*  Clipboard & CSV export                                                    */
/* -------------------------------------------------------------------------- */

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch {
    return false;
  }
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export interface ProductCsvContext {
  categoryNameOf: (product: Product) => string;
  supplierNameOf: (product: Product) => string;
}

/** Builds an Excel-friendly CSV (BOM + CRLF) from the given products. */
export function productsToCsv(
  products: Product[],
  context: ProductCsvContext,
): string {
  const header = [
    'Name',
    'SKU',
    'Barcode',
    'Category',
    'Supplier',
    'Price',
    'Cost',
    'Stock',
    'Reorder point',
    'Unit',
    'Status',
    'Updated',
  ];

  const rows = products.map((product) => [
    product.name,
    product.sku,
    product.barcode,
    context.categoryNameOf(product),
    context.supplierNameOf(product),
    product.price.toFixed(2),
    product.cost.toFixed(2),
    String(product.stock),
    String(product.reorderPoint),
    product.unit,
    product.status,
    product.updatedAt,
  ]);

  return [
    '\uFEFF',
    header.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
