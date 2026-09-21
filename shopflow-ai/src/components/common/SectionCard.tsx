import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Rendered on the right of the header (buttons, menus, badges). */
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Removes the inner padding when the content manages its own (e.g. tables). */
  noPadding?: boolean;
  icon?: ReactNode;
}

/**
 * Bordered panel with an optional header/footer – the building block for
 * dashboard sections, settings groups and detail columns.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  footer,
  className,
  noPadding = false,
  icon,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="space-y-0.5">
              {title && (
                <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}

      <div className={cn(noPadding ? '' : 'p-5')}>{children}</div>

      {footer && (
        <footer className="border-t border-border bg-muted/30 px-5 py-3.5">{footer}</footer>
      )}
    </section>
  );
}

export default SectionCard;