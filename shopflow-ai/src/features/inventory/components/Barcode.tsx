import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface BarcodeProps {
  /** Digits to encode (EAN-8 / EAN-13). */
  value: string;
  height?: number;
  /** Show the digits under the bars. */
  showValue?: boolean;
  className?: string;
}

/**
 * Dependency-free EAN-13 / EAN-8 renderer (laminated into an inline SVG).
 *
 * EAN encoding reference:
 *   - EAN-13: 1 guard + 6 left (L/G pattern per first digit) + center guard
 *     + 6 right (R) + end guard. 95 modules wide.
 *   - EAN-8: guards + 4 L + center + 4 R. 67 modules wide.
 */
const L_PATTERNS = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

const G_PATTERNS = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

const R_PATTERNS = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

/** Which digit position uses the G table for EAN-13 left half. */
const PARITY_TABLE = [
  'LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLLG',
  'LGGLLL', 'LGLGLL', 'LGLGGL', 'LGGLGL', 'LGGGLL',
];

const GUARD = '101';
const CENTER = '01010';

function encodeEan(digits: string): string | null {
  if (/^\d{13}$/.test(digits)) {
    const first = Number(digits[0]);
    const parity = PARITY_TABLE[first] ?? 'LLLLLL';
    let encoded = GUARD;
    for (let index = 0; index < 6; index += 1) {
      const digit = Number(digits[1 + index]);
      encoded += parity[index] === 'G' ? G_PATTERNS[digit] : L_PATTERNS[digit];
    }
    encoded += CENTER;
    for (let index = 7; index < 13; index += 1) {
      encoded += R_PATTERNS[Number(digits[index])];
    }
    encoded += GUARD;
    return encoded;
  }

  if (/^\d{8}$/.test(digits)) {
    let encoded = GUARD;
    for (let index = 0; index < 4; index += 1) {
      encoded += L_PATTERNS[Number(digits[index])];
    }
    encoded += CENTER;
    for (let index = 4; index < 8; index += 1) {
      encoded += R_PATTERNS[Number(digits[index])];
    }
    encoded += GUARD;
    return encoded;
  }

  return null;
}

/** Renders a scannable-style barcode; falls back to a dashed placeholder. */
export function Barcode({ value, height = 56, showValue = true, className }: BarcodeProps) {
  const modules = useMemo(() => encodeEan(value), [value]);

  if (!modules) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground',
          className,
        )}
        style={{ height }}
      >
        No barcode
      </div>
    );
  }

  const width = modules.length * 2;

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ height }}
        className="max-w-full"
        role="img"
        aria-label={`Barcode ${value}`}
      >
        <rect width={width} height={height} fill="white" />
        {modules.split('').map((bit, index) =>
          bit === '1' ? (
            <rect key={index} x={index * 2} y={0} width={2} height={height} fill="#0f172a" />
          ) : null,
        )}
      </svg>
      {showValue && (
        <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">{value}</span>
      )}
    </div>
  );
}

export default Barcode;
