import { HEALTH_STATUS_META } from './constants';
import type { AnalyticsHealthFactor, AnalyticsProductRow } from './types';

export { HEALTH_STATUS_META };

/** Converts rows to a downloadable CSV and triggers the browser download. */
export function exportToCSV<T extends object>(
  filename: string,
  rows: T[],
  columns: Array<{ key: keyof T | string; header: string; format?: (val: unknown, row: T) => string }>,
): void {
  if (!rows || rows.length === 0) return;

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const value = col.format
          ? col.format((row as Record<string, unknown>)[col.key as string], row)
          : (row as Record<string, unknown>)[col.key as string];
        return value === null || value === undefined ? '""' : `"${String(value).replace(/"/g, '""')}"`;
      })
      .join(','),
  );

  const link = document.createElement('a');
  link.setAttribute(
    'href',
    `data:text/csv;charset=utf-8,${encodeURIComponent([headerRow, ...dataRows].join('\n'))}`,
  );
  link.setAttribute('download', `${filename.replace(/\.csv$/, '')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Print isolation: the `print-area` wrapper is the only thing that renders. */
export function triggerPrintReport(): void {
  window.print();
}

export const compactMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export const percentLabel = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export function factorTone(factor: AnalyticsHealthFactor): string {
  if (factor.status === 'strong') return 'bg-success';
  if (factor.status === 'risk') return 'bg-destructive';
  return 'bg-warning';
}

export function barWidth(score: number): string {
  return `${Math.max(0, Math.min(100, score))}%`;
}

/**
 * Heatmap background. Blends the muted surface toward the primary brand hue
 * as intensity rises. `color-mix` is avoided so the result is identical in
 * every browser and stays readable in both themes.
 */
export function heatColor(intensity: number): string {
  const value = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0));
  if (value <= 0) return 'hsl(var(--muted))';
  // 15% -> 92% primary, remaining percentage stays as the muted base.
  return `color-mix(in srgb, hsl(var(--primary)) ${Math.round(15 + value * 77)}%, hsl(var(--muted)))`;
}

export function topProductCsvColumns(): Array<{
  key: keyof AnalyticsProductRow | string;
  header: string;
}> {
  return [
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    { key: 'unitsSold', header: 'Units sold' },
    { key: 'revenue', header: 'Revenue' },
    { key: 'marginPct', header: 'Margin %' },
    { key: 'growth', header: 'Growth %' },
  ];
}
