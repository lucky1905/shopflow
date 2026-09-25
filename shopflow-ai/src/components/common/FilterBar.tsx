import { useState, type ReactNode } from 'react';
import { ChevronDown, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import { Button } from '@/components/ui/Button';

export interface FilterBarProps {
  /** Number of non-default filters currently applied (shown as a badge). */
  activeCount: number;
  /** Clears every filter back to its default value. */
  onReset: () => void;
  /** Filter controls — typically a responsive grid of Selects / Inputs. */
  children: ReactNode;
  /** Label shown next to the sliders icon. */
  label?: string;
  /** Rendered on the right of the header (search field, quick actions…). */
  trailing?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Collapsible advanced-filter panel shared by the Sales and Purchases
 * modules: header with active-filter count + reset, expandable body for the
 * feature-specific controls.
 */
export function FilterBar({
  activeCount,
  onReset,
  children,
  label = 'Filters',
  trailing,
  defaultOpen = true,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          {label}
          {activeCount > 0 && (
            <Badge variant="default" size="sm">
              {activeCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {trailing}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-3.5">{children}</div>
      )}
    </section>
  );
}

export default FilterBar;