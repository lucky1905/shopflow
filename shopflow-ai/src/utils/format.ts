import { CURRENCY_SYMBOLS, DEFAULT_CURRENCY } from '@/constants';
import { formatIndianNumber } from './inr';

/**
 * Formats a number as currency using Indian digit grouping.
 *
 * With the default currency (INR) this renders `₹1,25,000.00` / `₹2,34,56,789`.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options: Intl.NumberFormatOptions = {},
): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return `${CURRENCY_SYMBOLS[currency] ?? ''}0`;

  const symbol = CURRENCY_SYMBOLS[currency] ?? '';

  // `notation: 'compact'` is used by stat tiles; keep it compact and readable.
  if (options.notation === 'compact') {
    const digits = options.maximumFractionDigits ?? 1;
    const abs = Math.abs(amount);
    if (abs >= 1e7) return `${symbol}${formatIndianNumber(amount / 1e7, digits)} Cr`;
    if (abs >= 1e5) return `${symbol}${formatIndianNumber(amount / 1e5, digits)} L`;
    if (abs >= 1e3) return `${symbol}${formatIndianNumber(amount / 1e3, digits)} K`;
    return `${symbol}${formatIndianNumber(amount, 0)}`;
  }

  const fractionDigits = options.maximumFractionDigits ?? 2;
  return `${symbol}${formatIndianNumber(amount, fractionDigits)}`;
}

/** Compact number formatting with Indian grouping: 1.2L / 2.3Cr */
export function formatCompactNumber(value: number | null | undefined): string {
  const amount = value ?? 0;
  const abs = Math.abs(amount);
  if (abs >= 1e7) return `${formatIndianNumber(amount / 1e7, 1)} Cr`;
  if (abs >= 1e5) return `${formatIndianNumber(amount / 1e5, 1)} L`;
  if (abs >= 1e3) return `${formatIndianNumber(amount / 1e3, 1)} K`;
  return formatIndianNumber(amount, 0);
}

/** 1234567 -> "12,34,567" (Indian digit grouping) */
export function formatNumber(value: number | null | undefined): string {
  return formatIndianNumber(value ?? 0, 0);
}

/** 12.5 -> "+12.5%" */
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
  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/** ISO date -> "Mar 08, 2026, 4:32 pm" */
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

  const formatter = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' });
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
