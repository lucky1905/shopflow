import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from '@/constants';

/** Format a number as currency. */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return `${CURRENCY_SYMBOLS[currency] ?? ''}0.00`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency] ?? ''}${amount.toFixed(2)}`;
  }
}

/** Compact number formatting: 1_200 -> 1.2K */
export function formatCompactNumber(value: number | null | undefined): string {
  const amount = value ?? 0;
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/** 1234 -> "1,234" */
export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(value ?? 0);
}

/** 12.5 -> "12.5%" */
export function formatPercent(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  const amount = value ?? 0;
  return `${amount > 0 ? '+' : ''}${amount.toFixed(fractionDigits)}%`;
}

/** ISO date -> "Mar 08, 2026" */
export function formatDate(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/** ISO date -> "Mar 08, 2026, 4:32 PM" */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

/** "5 minutes ago" */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return 'just now';
}

/** "John Doe" -> "JD" */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Truncate long strings for table cells. */
export function truncate(value: string, maxLength = 40): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

/** "inventory_item" | "inventory-item" | "inventoryItem" -> "Inventory Item" */
export function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}