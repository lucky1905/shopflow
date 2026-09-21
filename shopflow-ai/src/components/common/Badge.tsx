import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'gradient';

export type BadgeSize = 'sm' | 'default' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Renders a small colored dot before the label. */
  dot?: boolean;
  size?: BadgeSize;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  dot = false,
  size = 'default',
  className,
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-primary text-primary-foreground border border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border border-transparent',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-destructive/10 text-destructive border border-destructive/20',
    info: 'bg-highlight/10 text-highlight border border-highlight/20',
    outline: 'border border-border text-muted-foreground bg-transparent',
    gradient:
      'bg-gradient-to-r from-primary to-highlight text-primary-foreground border border-transparent',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-primary-foreground',
    secondary: 'bg-secondary-foreground',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
    info: 'bg-highlight',
    outline: 'bg-muted-foreground',
    gradient: 'bg-primary-foreground',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-[10px]',
    default: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export default Badge;
