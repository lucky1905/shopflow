import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : 'neutral',
  className,
}: StatCardProps) => {
  const ArrowIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        `
        bg-card border border-border rounded-xl p-5
        shadow-sm hover:shadow-md
        transition-all duration-200
        `,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change !== undefined && changeLabel && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trend === 'up' && 'text-emerald-500',
                  trend === 'down' && 'text-red-500',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                <ArrowIcon
                  className={cn(
                    'h-3 w-3',
                    trend === 'up' && 'rotate-0',
                    trend === 'down' && '-rotate-90',
                    trend === 'neutral' && 'rotate-0'
                  )}
                />
                {change > 0 && '+'}
                {change}%
              </span>
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export { StatCard };
