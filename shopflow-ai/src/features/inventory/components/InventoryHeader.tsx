import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InventoryHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Right-side actions (primary last). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Module page header using the Pulse visual language:
 * gradient icon tile + tracking-tight title, entrance-animated.
 */
export function InventoryHeader({ icon, title, description, actions, className }: InventoryHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25">
          {icon}
        </span>
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}

export default InventoryHeader;
