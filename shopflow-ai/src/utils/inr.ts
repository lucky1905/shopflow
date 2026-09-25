/**
 * Indian numbering system helpers.
 *
 * `Intl.NumberFormat('en-IN')` already groups correctly in modern browsers,
 * but it is not guaranteed on older Android WebViews used by shop-floor
 * tablets, so the grouping is implemented explicitly here.
 */

/** Groups the integer part the Indian way: last 3, then pairs. `1234567.89` -> `12,34,567.89` */
export function formatIndianNumber(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0';

  const negative = value < 0;
  const abs = Math.abs(value);

  const fixed = abs.toFixed(fractionDigits);
  const [whole, fraction] = fixed.split('.');

  let grouped = '';
  const digits = whole ?? '0';

  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }

  const result = fraction ? `${grouped}.${fraction}` : grouped;
  return negative ? `-${result}` : result;
}

/** True Indian compact notation: 1,25,000 / 12,50,000 / 2,34,56,789 */
export function formatIndianCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${formatIndianNumber(value / 1e7, 2)} Cr`;
  if (abs >= 1e5) return `${formatIndianNumber(value / 1e5, 2)} L`;
  if (abs >= 1e3) return `${formatIndianNumber(value / 1e3, 1)} K`;
  return formatIndianNumber(value, 0);
}

/** Renders a number with the rupee sign, e.g. `₹1,25,000.00`. */
export function formatINR(value: number, fractionDigits = 2): string {
  return `₹${formatIndianNumber(value, fractionDigits)}`;
}

/** Compact rupee notation for tiles: `₹1.2 L`, `₹2.3 Cr`. */
export function formatINRCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e5) return `₹${formatIndianCompact(value)}`;
  if (abs >= 1e3) return `₹${formatIndianNumber(value / 1e3, 1)} K`;
  return `₹${formatIndianNumber(value, 0)}`;
}
