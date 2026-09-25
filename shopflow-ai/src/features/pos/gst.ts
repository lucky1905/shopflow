/**
 * GST helpers for Indian retail billing.
 *
 * Intra-state sales split the tax evenly into CGST + SGST; inter-state sales
 * levy a single IGST. GSTIN validation covers the standard 15-character
 * format, and HSN codes are validated as 4/6/8 digit numeric strings.
 */

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GstRate = (typeof GST_RATES)[number];

export interface GstBreakdown {
  /** Taxable value (after discount, before tax). */
  taxableValue: number;
  gstRate: GstRate;
  totalGst: number;
  /** Intra-state half. */
  cgst: number;
  /** Intra-state half. */
  sgst: number;
  /** Inter-state full amount (zero for intra-state). */
  igst: number;
  isInterState: boolean;
}

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

/**
 * Splits `amount` into CGST/SGST (same state) or IGST (across states).
 */
export function computeGst(
  amount: number,
  gstRate: number,
  isInterState = false,
): GstBreakdown {
  const taxableValue = roundMoney(amount);
  const totalGst = roundMoney((taxableValue * gstRate) / 100);

  return {
    taxableValue,
    gstRate: (GST_RATES as readonly number[]).includes(gstRate) ? (gstRate as GstRate) : 18,
    totalGst,
    cgst: isInterState ? 0 : roundMoney(totalGst / 2),
    sgst: isInterState ? 0 : roundMoney(totalGst / 2),
    igst: isInterState ? totalGst : 0,
    isInterState,
  };
}

/** Grand total = taxable value + GST. */
export const gstInclusiveTotal = (breakdown: GstBreakdown): number =>
  roundMoney(breakdown.taxableValue + breakdown.totalGst);

/**
 * Strips the GSTIN out of a 15-character code.
 * Format: 2 state digits, 10-char PAN, 1 entity digit, 'Z', checksum.
 */
export function isValidGstin(value: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim().toUpperCase());
}

export function normaliseGstin(value: string): string {
  return value.trim().toUpperCase();
}

/** HSN/SAC codes are 4, 6 or 8 digits. */
export function isValidHsn(value: string): boolean {
  return /^[0-9]{4}$|^[0-9]{6}$|^[0-9]{8}$/.test(value.trim());
}

/** Common HSN/SAC codes surfaced as quick-pick chips on the product form. */
export const COMMON_HSN_CODES: ReadonlyArray<{ code: string; label: string }> = [
  { code: '0401', label: 'Milk & cream' },
  { code: '1905', label: 'Bread & bakery' },
  { code: '0902', label: 'Tea' },
  { code: '1006', label: 'Rice' },
  { code: '1701', label: 'Sugar' },
  { code: '1512', label: 'Cooking oil' },
  { code: '271019', label: 'Petrol' },
  { code: '3004', label: 'Medicines' },
  { code: '8517', label: 'Mobile phones' },
  { code: '4820', label: 'Stationery' },
];
