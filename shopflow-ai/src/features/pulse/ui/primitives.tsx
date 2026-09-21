import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Pulse visual language — frosted glass cards on the aurora backdrop.        */
/*  Deliberately different from the previous flat-card design system.          */
/* -------------------------------------------------------------------------- */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-black/[0.06] bg-card/85 text-card-foreground backdrop-blur-xl',
        'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)]',
        'transition-all duration-300 hover:border-violet-400/30 hover:shadow-[0_2px_4px_rgba(15,10,40,0.05),0_32px_72px_-24px_rgba(76,29,149,0.35)]',
        'dark:border-white/[0.07] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_28px_64px_-28px_rgba(139,92,246,0.35)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHead({
  title,
  sub,
  right,
  className,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h3 className="text-base font-bold tracking-tight">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/** Small pill with a pulsing dot — used for "live" signals. */
export function LivePill({ label = 'Live', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

/** Rounded gradient delta chip (up = emerald, down = rose). */
export function DeltaChip({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        up
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        className,
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}