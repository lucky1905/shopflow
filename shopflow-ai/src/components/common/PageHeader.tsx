import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional inline eyebrow / breadcrumb area above the title. */
  eyebrow?: ReactNode;
  /** Buttons rendered on the right (primary action last). */
  actions?: ReactNode;
  /** Tabs or filters rendered below the title row. */
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Consistent page title block used at the top of every dashboard page:
 * title, description, primary/secondary actions and optional filter row.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('space-y-4', className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-highlight/15 text-primary ring-1 ring-primary/15">
              {icon}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            {eyebrow}
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {children}
    </motion.header>
  );
}

export default PageHeader;