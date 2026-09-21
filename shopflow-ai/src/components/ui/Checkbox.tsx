import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  error?: string;
}

/**
 * Accessible checkbox with a custom indicator.
 * The real input stays in the DOM (focus, keyboard, form submission).
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'group inline-flex cursor-pointer items-start gap-2.5 select-none',
            props.disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-input bg-background transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
              {...props}
            />
            <Check
              className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
              strokeWidth={3}
            />
          </span>

          {(label || description) && (
            <span className="space-y-0.5">
              {label && <span className="block text-sm text-foreground">{label}</span>}
              {description && (
                <span className="block text-xs text-muted-foreground">{description}</span>
              )}
            </span>
          )}
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };