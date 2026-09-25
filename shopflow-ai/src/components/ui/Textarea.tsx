import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Small counter rendered under the field, e.g. `120/400`. */
  counter?: ReactNode;
}

/**
 * Multi-line input matching the `Input` visual language (same height rhythm,
 * border, focus ring and error treatment) for forms and drawers.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, counter, id, rows = 3, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            `
            w-full px-3 py-2 text-sm
            bg-background border border-border rounded-lg
            text-foreground placeholder:text-muted-foreground
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted
            `,
            error && 'border-destructive focus:ring-destructive',
            className,
          )}
          {...props}
        />
        <div className="flex items-start justify-between gap-2">
          <div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {hint && !error && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {counter && (
            <p className="mt-1 shrink-0 text-xs tabular-nums text-muted-foreground">{counter}</p>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
