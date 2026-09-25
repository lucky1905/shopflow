import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '../utils';

export interface CodeChipProps {
  value: string;
  /** Renders in monospace with a dashed border tint. */
  variant?: 'sku' | 'barcode';
  /** Enables the click-to-copy affordance. */
  copyable?: boolean;
  className?: string;
}

/** Small monospace chip for SKUs & barcodes with optional copy-on-click. */
export function CodeChip({ value, variant = 'sku', copyable = false, className }: CodeChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyable || !value) return;
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  if (!value) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  const content = (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center gap-1 truncate rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold',
        variant === 'sku'
          ? 'bg-black/[0.05] text-foreground dark:bg-white/[0.08]'
          : 'border border-dashed border-border text-muted-foreground',
        copyable && 'cursor-pointer transition-colors hover:border-violet-400/60 hover:text-foreground',
        className,
      )}
    >
      {value}
      {copyable && (
        copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />
      )}
    </span>
  );

  return copyable ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      className="inline-flex"
      aria-label={`Copy ${value}`}
      title={`Copy ${value}`}
    >
      {content}
    </button>
  ) : (
    content
  );
}

export default CodeChip;
