import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
}

/** Pill toggle used for settings and preferences. */
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted transition-colors has-checked:bg-primary',
            props.disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            className="peer sr-only"
            {...props}
          />
          <span className="pointer-events-none ml-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
        </label>

        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <label htmlFor={inputId} className="block cursor-pointer text-sm text-foreground">
                {label}
              </label>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';

export { Switch };