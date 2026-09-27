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

/* -------------------------------------------------------------------------- */
/*  Amount in words                                                           */
/* -------------------------------------------------------------------------- */

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** Converts 0-999 into words. */
function underThousand(value: number): string {
  if (value === 0) return '';
  if (value < 20) return ONES[value];
  if (value < 100) {
    const tens = TENS[Math.floor(value / 10)];
    const rest = value % 10;
    return rest ? `${tens} ${ONES[rest]}` : tens;
  }
  const hundreds = `${ONES[Math.floor(value / 100)]} Hundred`;
  const rest = value % 100;
  return rest ? `${hundreds} ${underThousand(rest)}` : hundreds;
}

/**
 * Spells a whole number using the Indian place-value system
 * (crore / lakh / thousand), e.g. 2345678 -> "Twenty Three Lakh Forty Five
 * Thousand Six Hundred Seventy Eight".
 */
export function numberToIndianWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;

  return [
    crore ? `${underThousand(crore)} Crore` : '',
    lakh ? `${underThousand(lakh)} Lakh` : '',
    thousand ? `${underThousand(thousand)} Thousand` : '',
    rest ? underThousand(rest) : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Invoice-style amount in words: "Rupees Thirty Two and Paise Forty Eight Only".
 * GST invoices are required to carry this line.
 */
export function amountInWords(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  const rupeePart = `Rupees ${numberToIndianWords(rupees)}`;
  if (paise === 0) return `${rupeePart} Only`;

  return `${rupeePart} and Paise ${numberToIndianWords(paise)} Only`;
}
